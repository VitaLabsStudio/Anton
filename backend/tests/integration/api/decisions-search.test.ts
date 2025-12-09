import '../../env-config';
import type { Server } from 'node:http';

import { serve } from '@hono/node-server';
import { PrismaClient } from '@prisma/client';
import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { requestTrace } from '../../../src/api/middleware/request-trace.js';
import { decisionsRouter } from '../../../src/api/routes/decisions.js';

// Mock Prisma Client
const prisma = new PrismaClient();

const testApp = new Hono();
testApp.use('*', requestTrace);
testApp.use('*', honoLogger());
testApp.route('/api/decisions', decisionsRouter);

let server: Server | null = null;
let url: string;

describe('Decision Search API Integration Tests', () => {
  const testPort = 3003;
  const requestId = 'test-request-id-search';
  const fixedTestDate = new Date();

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

    // Create partitions for current time range to ensure tests pass regardless of date
    const partitionStatements = [
      `CREATE TABLE IF NOT EXISTS "decisions_y2025m11" PARTITION OF "decisions" FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');`,
      `CREATE TABLE IF NOT EXISTS "decisions_y2025m12" PARTITION OF "decisions" FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');`,
      `CREATE TABLE IF NOT EXISTS "decisions_y2026m01" PARTITION OF "decisions" FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');`,
    ];
    for (const stmt of partitionStatements) {
      await prisma.$executeRawUnsafe(stmt);
    }

    // Create a test author and post
    await prisma.author.create({
      data: {
        id: 'test-author-search',
        platform: 'TWITTER',
        platformId: 'authSearch123',
        handle: 'searcher',
      },
    });
    const post = await prisma.post.create({
      data: {
        id: 'test-post-search',
        platform: 'TWITTER',
        platformPostId: 'postSearch123',
        authorId: 'test-author-search',
        content: 'Test post content for search',
      },
    });

    // Create test decisions with varied scores
    await Promise.all([
      prisma.decision.create({
        data: {
          id: 'dec-high-sss',
          postId: post.id,
          platform: 'TWITTER',
          sssScore: 0.95,
          arsScore: 0.5,
          evsScore: 0.5,
          trsScore: 0.5,
          compositeScore: 0.8,
          mode: 'HELPFUL',
          createdAt: fixedTestDate,
          compositeCredibleIntervalLower: 0.75,
          compositeCredibleIntervalUpper: 0.85,
          modeConfidence: 0.9,
        },
      }),
      prisma.decision.create({
        data: {
          id: 'dec-mid-sss',
          postId: post.id,
          platform: 'TWITTER',
          sssScore: 0.55,
          arsScore: 0.5,
          evsScore: 0.5,
          trsScore: 0.5,
          compositeScore: 0.5,
          mode: 'HYBRID',
          createdAt: new Date(fixedTestDate.getTime() - 86400000), // 1 day ago
          compositeCredibleIntervalLower: 0.45,
          compositeCredibleIntervalUpper: 0.55,
          modeConfidence: 0.6,
        },
      }),
      prisma.decision.create({
        data: {
          id: 'dec-low-sss',
          postId: post.id,
          platform: 'TWITTER',
          sssScore: 0.15,
          arsScore: 0.5,
          evsScore: 0.5,
          trsScore: 0.5,
          compositeScore: 0.2,
          mode: 'DISENGAGED',
          createdAt: new Date(fixedTestDate.getTime() - 86400000 * 2), // 2 days ago
          compositeCredibleIntervalLower: 0.15,
          compositeCredibleIntervalUpper: 0.25,
          modeConfidence: 0.8,
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

  it('GET /api/decisions should filter by sssMin', async () => {
    const res = await fetch(`${url}/api/decisions?sssMin=0.9`, {
      headers: { 'x-request-id': requestId },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.length).toBe(1);
    expect(data.items[0].id).toBe('dec-high-sss');
  });

  it('GET /api/decisions should filter by sss range', async () => {
    const res = await fetch(`${url}/api/decisions?sssMin=0.5&sssMax=0.6`, {
      headers: { 'x-request-id': requestId },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.length).toBe(1);
    expect(data.items[0].id).toBe('dec-mid-sss');
  });

  it('GET /api/decisions should return 400 for invalid range values', async () => {
    const res = await fetch(`${url}/api/decisions?sssMin=1.5`, {
      headers: { 'x-request-id': requestId },
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('must be between 0 and 1');
  });

  it('GET /api/decisions should return 400 when min > max', async () => {
    const res = await fetch(`${url}/api/decisions?sssMin=0.8&sssMax=0.7`, {
      headers: { 'x-request-id': requestId },
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('min must be <= max');
  });

  it('GET /api/decisions should default startDate to 7 days ago if missing', async () => {
    const res = await fetch(`${url}/api/decisions`, {
      headers: { 'x-request-id': requestId },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    // Should return all 3 decisions as they are within 7 days
    expect(data.items.length).toBe(3);

    // Verify filters in response
    const endDate = new Date(data.filters.endDate);
    const startDate = new Date(data.filters.startDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });
});
