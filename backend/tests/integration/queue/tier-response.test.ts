import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueueProcessor } from '../../../src/services/queue-processor';
import { decisionEngine } from '../../../src/analysis/decision-engine';
import { prisma } from '../../../src/utils/prisma';
import { logger } from '../../../src/utils/logger';
import { metricsCollector } from '../../../src/observability/metrics-registry';

import { metricsCollector } from '../../../src/observability/metrics-registry';

// Mock dependencies
vi.mock('../../../src/observability/metrics-registry', () => ({
  metricsCollector: {
    increment: vi.fn(),
  },
}));

vi.mock('../../../src/analysis/decision-engine', () => ({
  decisionEngine: {
    analyzePost: vi.fn(),
  },
}));

vi.mock('../../../src/utils/prisma', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
    },
    decision: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

vi.mock('../../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

// Mock TIER_PRIORITY access if needed, or rely on real import
// QueueProcessor imports TIER_PRIORITY from tiered-user-detector. 
// Since we are mocking decisionEngine but NOT tiered-user-detector, the real constants should be used.

describe('QueueProcessor Tiered Response', () => {
  let processor: QueueProcessor;
  const analyzePostMock = vi.mocked(decisionEngine.analyzePost);
  const loggerWarnSpy = vi.mocked(logger.warn);

  beforeEach(() => {
    vi.clearAllMocks();
    processor = new QueueProcessor();
    // Mock Date.now to a fixed time
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-14T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('processes high priority tiers before low priority ones regardless of detection time', async () => {
    // Setup 3 posts
    const posts = [
      {
        id: 'post-standard',
        detectedAt: new Date('2025-12-14T11:00:00Z'), // 1 hour old (Older)
        author: { id: 'auth-1', userTier: 'STANDARD' },
      },
      {
        id: 'post-mega',
        detectedAt: new Date('2025-12-14T11:55:00Z'), // 5 mins old (Newer)
        author: { id: 'auth-2', userTier: 'MEGA_POWER' },
      },
      {
        id: 'post-micro',
        detectedAt: new Date('2025-12-14T11:50:00Z'), // 10 mins old
        author: { id: 'auth-3', userTier: 'MICRO_POWER' },
      },
    ];

    vi.mocked(prisma.post.findMany).mockResolvedValue(posts as any);

    // Mock analyzePost to return a valid decision structure
    analyzePostMock.mockResolvedValue({
      responseTargetMinutes: 30,
      userTier: 'MEGA_POWER', // Matches input roughly
      compositeScore: 0.5,
      isPowerUser: true,
      competitorDetected: false,
    } as any);

    // Act: Run private processBatch
    await (processor as any).processBatch();

    // Assert: Order of calls to analyzePost
    // Expect MEGA (tier 1) -> MICRO (tier 3) -> STANDARD (tier 5)
    expect(analyzePostMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 'post-mega' }), expect.anything());
    expect(analyzePostMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 'post-micro' }), expect.anything());
    expect(analyzePostMock).toHaveBeenNthCalledWith(3, expect.objectContaining({ id: 'post-standard' }), expect.anything());
  });

  it('logs SLA breach for tiered users', async () => {
    const post = {
      id: 'post-delayed',
      detectedAt: new Date('2025-12-14T10:00:00Z'), // 2 hours old
      author: { id: 'auth-1', userTier: 'MEGA_POWER' },
    };

    vi.mocked(prisma.post.findMany).mockResolvedValue([post] as any);

    analyzePostMock.mockResolvedValue({
      responseTargetMinutes: 30, // 30 min SLA
      userTier: 'MEGA_POWER',
      compositeScore: 0.5,
    } as any);

    await (processor as any).processBatch();

    // 2 hours (120 min) > 30 min SLA
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: 'post-delayed',
        tier: 'MEGA_POWER',
        sla: 30,
      }),
      'SLA breach detected for tiered response'
    );

    expect(metricsCollector.increment).toHaveBeenCalledWith('tier_sla_breaches_total', { tier: 'MEGA_POWER' });
  });
});
