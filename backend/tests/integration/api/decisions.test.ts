import '../../env-config';
import type { Server } from 'node:http';

import { serve } from '@hono/node-server';
import { PrismaClient } from '@prisma/client';
import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { requestTrace } from '../../../src/api/middleware/request-trace.js';
import { decisionsRouter } from '../../../src/api/routes/decisions.js';
import { logger } from '../../../src/utils/logger.js';

// Mock Prisma Client
const prisma = new PrismaClient();

const testApp = new Hono();
testApp.use('*', requestTrace);
testApp.use('*', honoLogger()); // Using Hono's logger, not our custom pino instance for requests
testApp.route('/api/decisions', decisionsRouter);

let server: Server | null = null;
let url: string;

describe('Decision API Integration Tests', () => {
  const testPort = 3002;
  let testDecisions: any[] = [];
  const requestId = 'test-request-id-123';
  const fixedTestDate = new Date('2026-02-15T12:00:00.000Z');

  beforeEach(async () => {
    url = `http://localhost:${testPort}`;
    server = serve({
      fetch: testApp.fetch,
      port: testPort,
    });

    await new Promise<void>((resolve) => setTimeout(resolve, 100));

    // Clean and seed test data
    await prisma.$executeRawUnsafe('DELETE FROM "decisions";');
    await prisma.$executeRawUnsafe('DELETE FROM "posts";');
    await prisma.$executeRawUnsafe('DELETE FROM "authors";');

    const partitionStatements = [
      `CREATE TABLE IF NOT EXISTS "decisions_y2025m12" PARTITION OF "decisions" FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');`,
      `CREATE TABLE IF NOT EXISTS "decisions_y2026m01" PARTITION OF "decisions" FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');`,
      `CREATE TABLE IF NOT EXISTS "decisions_y2026m02" PARTITION OF "decisions" FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');`,
      `CREATE TABLE IF NOT EXISTS "decisions_y2026m03" PARTITION OF "decisions" FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');`,
    ];
    for (const stmt of partitionStatements) {
      await prisma.$executeRawUnsafe(stmt);
    }

    // Create a test author and post
    await prisma.author.create({
      data: {
        id: 'test-author-1',
        platform: 'TWITTER',
        platformId: 'auth123',
        handle: 'testauthor',
      },
    });
    const post = await prisma.post.create({
      data: {
        id: 'test-post-1',
        platform: 'TWITTER',
        platformPostId: 'post123',
        authorId: 'test-author-1',
        content: 'Test post content for decision',
      },
    });

    // Create test decisions
    const today = new Date(fixedTestDate);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoMonthsAgo = new Date(fixedTestDate);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    testDecisions = await Promise.all([
      prisma.decision.create({
        data: {
          id: 'decision-1',
          postId: post.id,
          platform: 'TWITTER',
          sssScore: 0.8,
          arsScore: 0.7,
          evsScore: 0.6,
          trsScore: 0.9,
          compositeScore: 0.75,
          mode: 'HELPFUL',
          createdAt: today,
          compositeCredibleIntervalLower: 0.7,
          compositeCredibleIntervalUpper: 0.8,
          modeConfidence: 0.9,
        },
      }),
      prisma.decision.create({
        data: {
          id: 'decision-2',
          postId: post.id,
          platform: 'REDDIT',
          sssScore: 0.5,
          arsScore: 0.4,
          evsScore: 0.3,
          trsScore: 0.2,
          compositeScore: 0.35,
          mode: 'DISENGAGED',
          createdAt: yesterday,
          compositeCredibleIntervalLower: 0.3,
          compositeCredibleIntervalUpper: 0.4,
          modeConfidence: 0.5,
        },
      }),
      // Decision older than 90 days, should not be found by default
      prisma.decision.create({
        data: {
          id: 'decision-3',
          postId: post.id,
          platform: 'THREADS',
          sssScore: 0.1,
          arsScore: 0.1,
          evsScore: 0.1,
          trsScore: 0.1,
          compositeScore: 0.1,
          mode: 'HYBRID',
          createdAt: twoMonthsAgo,
          compositeCredibleIntervalLower: 0.05,
          compositeCredibleIntervalUpper: 0.15,
          modeConfidence: 0.2,
        },
      }),
    ]);
  });

  afterEach(async () => {
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
      server = null;
    }
  });

  it('GET /api/decisions/:id should return a specific decision by ID', async () => {
    const targetDecision = testDecisions[0];
    const res = await fetch(`${url}/api/decisions/${targetDecision.id}`, {
      headers: { 'x-request-id': requestId },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(targetDecision.id);
    expect(data.mode).toBe(targetDecision.mode);
    expect(data.platform).toBe(targetDecision.platform);
    expect(data.post.content).toBe('Test post content for decision');
    expect(data.scores.composite).toBe(targetDecision.compositeScore);
  });

  it('GET /api/decisions/:id should return 404 if decision not found', async () => {
    const res = await fetch(`${url}/api/decisions/non-existent-id`, {
      headers: { 'x-request-id': requestId },
    });
    expect(res.status).toBe(404);
  });

  it('GET /api/decisions should return decisions within the specified date range', async () => {
    const today = new Date(fixedTestDate);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const res = await fetch(
      `${url}/api/decisions?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`,
      {
        headers: { 'x-request-id': requestId },
      }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.length).toBe(1); // Only today's decision
    expect(data.items[0].id).toBe(testDecisions[0].id);
  });

  it('GET /api/decisions should filter by platform and mode', async () => {
    const today = new Date(fixedTestDate);
    const twoMonthsAgo = new Date(fixedTestDate);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const res = await fetch(
      `${url}/api/decisions?startDate=${twoMonthsAgo.toISOString()}&endDate=${today.toISOString()}&platform=REDDIT&mode=DISENGAGED`,
      {
        headers: { 'x-request-id': requestId },
      }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.length).toBe(1);
    expect(data.items[0].id).toBe(testDecisions[1].id);
  });

  it('GET /api/decisions should respect limit and offset', async () => {
    const today = new Date(fixedTestDate);
    const twoMonthsAgo = new Date(fixedTestDate);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const res = await fetch(
      `${url}/api/decisions?startDate=${twoMonthsAgo.toISOString()}&endDate=${today.toISOString()}&limit=1&offset=1`,
      {
        headers: { 'x-request-id': requestId },
      }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.length).toBe(1);
    expect(data.items[0].id).toBe(testDecisions[1].id); // Second decision in order
  });
});
