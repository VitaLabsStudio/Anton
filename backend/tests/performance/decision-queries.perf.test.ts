import '../env-config';

import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();

describe('Decision Query Performance', () => {
  const NUM_RECORDS = 10000; // Scaled down for CI/dev speed, but representative enough for index usage
  const BATCH_SIZE = 1000;

  beforeAll(async () => {
    // 1. Clean DB
    await prisma.$executeRawUnsafe('DELETE FROM "decisions";');
    await prisma.$executeRawUnsafe('DELETE FROM "posts";');
    await prisma.$executeRawUnsafe('DELETE FROM "authors";');

    // 2. Create Partitions (3 months)
    const partitionStatements = [
      `CREATE TABLE IF NOT EXISTS "decisions_perf_m1" PARTITION OF "decisions" FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');`,
      `CREATE TABLE IF NOT EXISTS "decisions_perf_m2" PARTITION OF "decisions" FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');`,
      `CREATE TABLE IF NOT EXISTS "decisions_perf_m3" PARTITION OF "decisions" FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');`,
      `CREATE TABLE IF NOT EXISTS "decisions_perf_m4" PARTITION OF "decisions" FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');`,
    ];
    for (const stmt of partitionStatements) {
      await prisma.$executeRawUnsafe(stmt);
    }

    // 3. Create Dependencies
    const author = await prisma.author.create({
      data: {
        id: 'perf-author',
        platform: 'TWITTER',
        platformId: 'perf-auth-1',
        handle: 'perf_user',
      },
    });

    const post = await prisma.post.create({
      data: {
        id: 'perf-post',
        platform: 'TWITTER',
        platformPostId: 'perf-post-1',
        authorId: author.id,
        content: 'Perf test post',
      },
    });

    // 4. Seed Data
    console.info(`Seeding ${NUM_RECORDS} decisions...`);
    const decisions = [];
    const baseDate = new Date('2025-01-02T12:00:00Z').getTime();

    for (let i = 0; i < NUM_RECORDS; i++) {
      // Distribute dates across 3 months
      const date = new Date(baseDate + Math.random() * 90 * 24 * 60 * 60 * 1000);

      decisions.push({
        id: `perf-dec-${i}`,
        postId: post.id,
        platform: Math.random() > 0.5 ? 'TWITTER' : 'REDDIT',
        mode: Math.random() > 0.5 ? 'HELPFUL' : 'DISENGAGED',
        sssScore: Math.random(),
        arsScore: Math.random(),
        evsScore: Math.random(),
        trsScore: Math.random(),
        compositeScore: Math.random(),
        createdAt: date,
        compositeCredibleIntervalLower: 0.1,
        compositeCredibleIntervalUpper: 0.9,
        modeConfidence: 0.8,
        decisionLogicVersion: 'v2.1',
      });

      if (decisions.length >= BATCH_SIZE) {
        await prisma.decision.createMany({ data: decisions });
        decisions.length = 0;
      }
    }
    if (decisions.length > 0) {
      await prisma.decision.createMany({ data: decisions });
    }
    console.info('Seeding complete.');
  }, 60000); // Increased timeout for seeding

  afterAll(async () => {
    // Cleanup
    await prisma.$executeRawUnsafe('DELETE FROM "decisions";');
    await prisma.$executeRawUnsafe('DELETE FROM "posts";');
    await prisma.$executeRawUnsafe('DELETE FROM "authors";');
    await prisma.$disconnect();
  });

  it('should execute complex filter query in < 200ms', async () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-04-01');

    const start = performance.now();
    const results = await prisma.decision.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        platform: 'TWITTER',
        mode: 'HELPFUL',
        sssScore: { gte: 0.5 },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const duration = performance.now() - start;

    console.info(`Query duration: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(200);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should use the composite index for filtering', async () => {
    // We use raw SQL for EXPLAIN ANALYZE
    // The query mimics what Prisma generates
    const query = `
        EXPLAIN ANALYZE SELECT "id" FROM "decisions" 
        WHERE "platform" = 'TWITTER' 
        AND "mode" = 'HELPFUL' 
        AND "created_at" >= '2025-01-01' 
        AND "created_at" <= '2025-04-01'
        ORDER BY "created_at" DESC 
        LIMIT 50;
    `;

    const result = (await prisma.$queryRawUnsafe(query)) as { 'QUERY PLAN': string }[];
    const explainOutput = result.map((r) => r['QUERY PLAN']).join('\n');
    console.info('Explain Analyze Output:', explainOutput);

    // Check for Index Scan on the composite index
    // The index name is "idx_decisions_platform_mode_created", but on partitions it might appear as "...platform_mode_created_at_idx"
    expect(explainOutput).toContain('platform_mode_created');
  });
});
