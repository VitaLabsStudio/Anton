import '../../env-config';
process.env['PARTITION_TEST_MODE'] = 'true';
process.env['PARTITION_TEST_DATE'] = '2026-03-15T12:00:00.000Z';
import { exec as execCallback } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { managePartitions } from '../../../../scripts/manage-partitions.js';

const exec = promisify(execCallback);
const prisma = new PrismaClient();

const dropDecisionForeignKeys = [
  `ALTER TABLE "replies" DROP CONSTRAINT IF EXISTS "replies_decision_id_decision_created_at_fkey";`,
  `ALTER TABLE "randomized_experiments" DROP CONSTRAINT IF EXISTS "randomized_experiments_decision_id_decision_created_at_fkey";`,
  `ALTER TABLE "escalations" DROP CONSTRAINT IF EXISTS "escalations_decision_id_decision_created_at_fkey";`,
];

const addDecisionForeignKeys = [
  `ALTER TABLE "replies" ADD CONSTRAINT "replies_decision_id_decision_created_at_fkey" FOREIGN KEY ("decision_id", "decision_created_at") REFERENCES "decisions"("id", "created_at") ON DELETE CASCADE;`,
  `ALTER TABLE "randomized_experiments" ADD CONSTRAINT "randomized_experiments_decision_id_decision_created_at_fkey" FOREIGN KEY ("decision_id", "decision_created_at") REFERENCES "decisions"("id", "created_at") ON DELETE CASCADE;`,
  `ALTER TABLE "escalations" ADD CONSTRAINT "escalations_decision_id_decision_created_at_fkey" FOREIGN KEY ("decision_id", "decision_created_at") REFERENCES "decisions"("id", "created_at") ON DELETE CASCADE;`,
];

async function managePartitionsSafely() {
  for (const stmt of dropDecisionForeignKeys) {
    await prisma.$executeRawUnsafe(stmt);
  }

  try {
    await managePartitions();
  } finally {
    for (const stmt of addDecisionForeignKeys) {
      await prisma.$executeRawUnsafe(stmt);
    }
  }
}

const ARCHIVE_DIR = './volumes/archive';
const RETAIN_DAYS = 90;

describe('Partition Lifecycle & Archiving Integration Tests', () => {
  const currentTestDate = new Date('2026-03-15T12:00:00.000Z'); // Simulating a specific date for consistent partition management
  const olderThan90DaysDate = new Date(currentTestDate);
  olderThan90DaysDate.setDate(currentTestDate.getDate() - RETAIN_DAYS - 5); // 95 days ago
  let systemTimeSpy: ReturnType<typeof vi.spyOn<DateConstructor, 'now'>> | null = null;

  beforeEach(async () => {
    // Mock Date.now() for consistent testing
    systemTimeSpy = vi.spyOn(Date, 'now').mockReturnValue(currentTestDate.getTime());

    await prisma.$connect();

    const partitionStatements = [
      `CREATE TABLE IF NOT EXISTS "decisions_y2025m12" PARTITION OF "decisions" FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');`,
      `CREATE TABLE IF NOT EXISTS "decisions_y2026m01" PARTITION OF "decisions" FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');`,
      `CREATE TABLE IF NOT EXISTS "decisions_y2026m02" PARTITION OF "decisions" FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');`,
      `CREATE TABLE IF NOT EXISTS "decisions_y2026m03" PARTITION OF "decisions" FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');`,
    ];
    for (const stmt of partitionStatements) {
      await prisma.$executeRawUnsafe(stmt);
    }

    // Clean up database and archive directory
    await prisma.$executeRawUnsafe('DELETE FROM "decisions_y2025m12";');
    await prisma.$executeRawUnsafe('DELETE FROM "decisions_y2026m01";');
    await prisma.$executeRawUnsafe('DELETE FROM "decisions_y2026m02";');
    await prisma.$executeRawUnsafe('DELETE FROM "decisions";'); // Clear parent table too if any
    await prisma.$executeRawUnsafe('DELETE FROM "posts";');
    await prisma.$executeRawUnsafe('DELETE FROM "authors";');

    await fs.rm(ARCHIVE_DIR, { recursive: true, force: true });
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });

    // Seed test data in relevant partitions
    // Data in an "expired" partition (e.g., Dec 2025 if current is Mar 2026 and retain is 90 days)
    await prisma.author.create({
      data: {
        id: 'test-author-archive',
        platform: 'TWITTER',
        platformId: 'auth_archive',
        handle: 'archive_author',
      },
    });
    const postArchive = await prisma.post.create({
      data: {
        id: 'test-post-archive',
        platform: 'TWITTER',
        platformPostId: 'post_archive',
        authorId: 'test-author-archive',
        content: 'Content for archived post',
      },
    });
    await prisma.decision.create({
      data: {
        id: 'decision-old-1',
        postId: postArchive.id,
        platform: 'TWITTER',
        sssScore: 0.1,
        arsScore: 0.1,
        evsScore: 0.1,
        trsScore: 0.1,
        compositeScore: 0.1,
        mode: 'DISENGAGED',
        createdAt: new Date('2025-12-20T10:00:00.000Z'), // Older than 90 days from March 15, 2026
        compositeCredibleIntervalLower: 0,
        compositeCredibleIntervalUpper: 0,
        modeConfidence: 0,
      },
    });

    // Data in a "current" partition (e.g., Feb 2026)
    await prisma.decision.create({
      data: {
        id: 'decision-recent-1',
        postId: postArchive.id,
        platform: 'REDDIT',
        sssScore: 0.9,
        arsScore: 0.9,
        evsScore: 0.9,
        trsScore: 0.9,
        compositeScore: 0.9,
        mode: 'HELPFUL',
        createdAt: new Date('2026-02-10T10:00:00.000Z'), // Within 90 days
        compositeCredibleIntervalLower: 0.8,
        compositeCredibleIntervalUpper: 1.0,
        modeConfidence: 1.0,
      },
    });
  });

  afterEach(async () => {
    systemTimeSpy?.mockRestore();
    systemTimeSpy = null;
    await prisma.$disconnect();
  });

  it("should create the next month's partition and archive/drop expired ones", async () => {
    // Dynamically import the real managePartitions script
    await managePartitionsSafely();

    // Verify next month's partition is created (April 2026 from our mocked March 2026 current date)
    const nextMonth = new Date(currentTestDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextYear = nextMonth.getFullYear();
    const nextMon = (nextMonth.getMonth() + 1).toString().padStart(2, '0');
    const expectedNewPartition = `decisions_y${nextYear}m${nextMon}`;

    const partitionsAfterRun = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'decisions_y%';`
    );
    expect(partitionsAfterRun.some((p) => p.tablename === expectedNewPartition)).toBe(true);

    // Verify expired partition is dropped (Dec 2025 from our mocked March 2026 current date)
    const expiredYear = 2025;
    const expiredMonth = 12; // December
    const expiredPartitionName = `decisions_y${expiredYear}m${expiredMonth}`;
    expect(partitionsAfterRun.some((p) => p.tablename === expiredPartitionName)).toBe(false);

    // Verify archive file exists for the dropped partition
    const archiveFileName = `decisions_${expiredYear}_${expiredMonth.toString().padStart(2, '0')}.json.gz`;
    const archiveFilePath = join(ARCHIVE_DIR, archiveFileName);
    await expect(fs.stat(archiveFilePath)).resolves.toBeDefined();

    // Verify the archived data contains the old decision
    const archivedContent = await exec(`gunzip -c ${archiveFilePath}`);
    expect(archivedContent.stdout).toContain('decision-old-1');
  }, 120000);

  it('should not drop partitions within the retention period', async () => {
    // Dynamically import the real managePartitions script
    await managePartitionsSafely();

    // Verify Jan 2026, Feb 2026, Mar 2026 partitions are still there (within 90 days of Mar 15)
    const partitionsAfterRun = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'decisions_y%';`
    );

    expect(partitionsAfterRun.some((p) => p.tablename === 'decisions_y2026m01')).toBe(true);
    expect(partitionsAfterRun.some((p) => p.tablename === 'decisions_y2026m02')).toBe(true);
    expect(partitionsAfterRun.some((p) => p.tablename === 'decisions_y2026m03')).toBe(true);
  }, 120000);
});
