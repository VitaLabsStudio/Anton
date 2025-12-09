import '../../env-config';
import type { Server } from 'node:http';

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { describe, expect, it, beforeEach, afterEach, vi, type Mock } from 'vitest';

import { decisionEngine } from '../../../src/analysis/decision-engine.js';
import { requestTrace } from '../../../src/api/middleware/request-trace.js';
import { QueueProcessor } from '../../../src/services/queue-processor.js';
import { logger } from '../../../src/utils/logger.js';
import { prisma } from '../../../src/utils/prisma.js';

let queueRequestId: string | undefined;

vi.mock('../../../src/utils/prisma.js', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
    },
    decision: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('../../../src/analysis/decision-engine.js', () => {
  const deepSeekSpy = vi.fn(async () => ({
    content: JSON.stringify({ score: 0.85, confidence: 0.9, reasoning: 'traceable request' }),
    confidence: 0.9,
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  }));

  const twitterSearchSpy = vi.fn(async () => []);

  return {
    decisionEngine: {
      analyzePost: vi.fn(async () => {
        if (!queueRequestId) {
          throw new Error('Queue requestId was not captured');
        }

        await deepSeekSpy('trace-prompt', { requestId: queueRequestId });
        await twitterSearchSpy('trace-query', { requestId: queueRequestId });

        return {
          compositeScore: 0.8,
          isPowerUser: false,
          competitorDetected: null,
        };
      }),
    },
  };
});

describe('RequestId Flow Integration', () => {
  const testApp = new Hono();
  testApp.use('*', requestTrace);
  testApp.get('/api/trace', (c) => c.json({ ok: true }));

  const mockPost = {
    id: 'trace-post',
    content: 'Capture request ID trace',
    author: {
      id: 'trace-author',
      handle: 'trace-user',
    },
  } as const;

  const testPort = 3999;
  let server: Server | null = null;
  let baseUrl: string;
  let childLoggerMock: Record<string, ReturnType<typeof vi.fn>>;
  let processor: QueueProcessor | null = null;

  beforeEach(async () => {
    queueRequestId = undefined;
    childLoggerMock = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    vi.spyOn(logger, 'child').mockImplementation((meta) => {
      if (meta && 'requestId' in meta) {
        queueRequestId = meta.requestId as string;
      }
      return childLoggerMock;
    });

    (prisma.post.findMany as Mock).mockReset();
    (prisma.decision.updateMany as Mock).mockReset();
    (decisionEngine.analyzePost as Mock).mockReset();

    server = serve({
      fetch: testApp.fetch,
      port: testPort,
    });
    baseUrl = `http://localhost:${testPort}`;

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    processor?.stop();
    processor = null;
    if (server) {
      await new Promise<void>((resolve) => {
        server?.close(() => resolve());
      });
      server = null;
    }
    vi.restoreAllMocks();
  });

  it('propagates requestId from API through queue to external clients', async () => {
    const customRequestId = 'test-trace-e2e-123';
    const apiResponse = await fetch(`${baseUrl}/api/trace`, {
      headers: { 'x-request-id': customRequestId },
    });

    expect(apiResponse.status).toBe(200);
    expect(apiResponse.headers.get('x-request-id')).toBe(customRequestId);

    const postFindMany = prisma.post.findMany as Mock;
    postFindMany.mockResolvedValueOnce([mockPost]);
    postFindMany.mockResolvedValue([]);

    processor = new QueueProcessor();
    processor.start();

    await vi.waitFor(() => expect(decisionEngine.analyzePost).toHaveBeenCalled());

    processor.stop();

    expect(queueRequestId).toBeDefined();
    expect(childLoggerMock.info).toHaveBeenCalled();
  });
});
