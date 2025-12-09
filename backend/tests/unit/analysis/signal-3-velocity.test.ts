import { Platform, type Author, type Post } from '@prisma/client';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

import { PostVelocityAnalyzer } from '../../../src/analysis/signal-3-velocity';

const mocks = vi.hoisted(() => ({
  prisma: {
    post: {
      findMany: vi.fn(),
    },
  },
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/prisma', () => ({
  prisma: mocks.prisma,
}));

vi.mock('../../../src/utils/logger', () => ({
  logger: mocks.logger,
}));

describe('PostVelocityAnalyzer', () => {
  const analyzer = new PostVelocityAnalyzer();
  const now = new Date('2025-01-01T12:00:00Z');

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const buildAuthor = (): Author => {
    return {
      id: 'author-1',
      platform: Platform.TWITTER,
      platformId: 'author-platform-1',
      handle: 'author-handle',
      displayName: 'Author',
      followerCount: 100,
      isVerified: false,
      isPowerUser: false,
      powerTierId: null,
      archetypeTags: [],
      relationshipScore: 0.5,
      interactionHistory: [],
      firstSeenAt: now,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    } as unknown as Author;
  };

  const buildPost = (overrides: Partial<Post> & { rawMetrics?: unknown } = {}): Post => {
    const detectedAt = overrides.detectedAt ?? new Date('2025-01-01T11:00:00Z');
    return {
      id: overrides.id ?? `post-${Math.random()}`,
      platform: overrides.platform ?? Platform.TWITTER,
      platformPostId: overrides.platformPostId ?? 'baseline-post',
      authorId: overrides.authorId ?? 'author-1',
      content: overrides.content ?? 'test content',
      detectedAt,
      processedAt: null,
      keywordMatches: [],
      keywordCategories: [],
      spamFiltered: false,
      rawMetrics: overrides.rawMetrics ?? { likes: 10, replies: 2, retweets: 1 },
      errorCount: 0,
      errorMessage: null,
      createdAt: overrides.createdAt ?? detectedAt,
      updatedAt: overrides.updatedAt ?? detectedAt,
    } as unknown as Post;
  };

  it('computes velocity ratio and moderate category with baseline', async () => {
    const currentPost = buildPost({
      platformPostId: 'current-post',
      rawMetrics: { likes: 40, replies: 10, retweets: 0 },
    });

    const baselinePosts = [
      buildPost({ platformPostId: 'p1', rawMetrics: { likes: 22, replies: 3 } }),
      buildPost({ platformPostId: 'p2', rawMetrics: { likes: 24, replies: 2 } }),
      buildPost({ platformPostId: 'p3', rawMetrics: { likes: 20, replies: 1 } }),
      buildPost({ platformPostId: 'p4', rawMetrics: { likes: 18, replies: 2 } }),
      buildPost({ platformPostId: 'p5', rawMetrics: { likes: 21, replies: 1 } }),
    ];

    mocks.prisma.post.findMany.mockResolvedValue(baselinePosts);

    const result = await analyzer.analyzePostVelocity(currentPost, buildAuthor());

    expect(result.category).toBe('moderate');
    expect(result.ratio).toBeGreaterThan(2);
    expect(result.baselineRate).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.temporalContext.hoursSincePost).toBeCloseTo(1, 1);
  });

  it('defaults to neutral velocity when insufficient history', async () => {
    mocks.prisma.post.findMany.mockResolvedValue([]);

    const result = await analyzer.analyzePostVelocity(
      buildPost({ platformPostId: 'current-post', rawMetrics: { likes: 12, replies: 3 } }),
      buildAuthor()
    );

    expect(result.ratio).toBe(1.0);
    expect(result.category).toBe('normal');
    expect(result.confidence).toBe(0.5);
  });

  it('removes outliers when building baseline', async () => {
    const baselinePosts = [
      buildPost({ platformPostId: 'p1', rawMetrics: { likes: 20 } }),
      buildPost({ platformPostId: 'p2', rawMetrics: { likes: 18 } }),
      buildPost({ platformPostId: 'p3', rawMetrics: { likes: 19 } }),
      buildPost({ platformPostId: 'p4', rawMetrics: { likes: 22 } }),
      buildPost({ platformPostId: 'p5', rawMetrics: { likes: 500 } }), // outlier
    ];
    mocks.prisma.post.findMany.mockResolvedValue(baselinePosts);

    const currentPost = buildPost({
      platformPostId: 'current-post',
      rawMetrics: { likes: 40, replies: 5 },
    });

    const result = await analyzer.analyzePostVelocity(currentPost, buildAuthor());

    expect(result.ratio).toBeGreaterThan(1.5);
    expect(result.category).toBe('moderate');
  });

  it('categorizes silent pleas when below baseline', async () => {
    const baselinePosts = [
      buildPost({ platformPostId: 'p1', rawMetrics: { likes: 90 } }),
      buildPost({ platformPostId: 'p2', rawMetrics: { likes: 85 } }),
      buildPost({ platformPostId: 'p3', rawMetrics: { likes: 88 } }),
      buildPost({ platformPostId: 'p4', rawMetrics: { likes: 92 } }),
      buildPost({ platformPostId: 'p5', rawMetrics: { likes: 95 } }),
    ];
    mocks.prisma.post.findMany.mockResolvedValue(baselinePosts);

    const result = await analyzer.analyzePostVelocity(
      buildPost({ platformPostId: 'current-post', rawMetrics: { likes: 10, replies: 1 } }),
      buildAuthor()
    );

    expect(result.category).toBe('silent_plea');
    expect(result.ratio).toBeLessThan(1);
  });

  it('categorizes viral when far above baseline', async () => {
    const baselinePosts = [
      buildPost({ platformPostId: 'p1', rawMetrics: { likes: 5 } }),
      buildPost({ platformPostId: 'p2', rawMetrics: { likes: 6 } }),
      buildPost({ platformPostId: 'p3', rawMetrics: { likes: 7 } }),
      buildPost({ platformPostId: 'p4', rawMetrics: { likes: 5 } }),
      buildPost({ platformPostId: 'p5', rawMetrics: { likes: 6 } }),
    ];
    mocks.prisma.post.findMany.mockResolvedValue(baselinePosts);

    const result = await analyzer.analyzePostVelocity(
      buildPost({ platformPostId: 'current-post', rawMetrics: { likes: 200, replies: 20 } }),
      buildAuthor()
    );

    expect(result.category).toBe('viral');
    expect(result.ratio).toBeGreaterThan(5);
  });

  it('boosts normalized rate during off-peak hours via temporal factors', async () => {
    // Current time: 2025-01-05T03:00:00Z (Sunday, off-peak)
    const offPeakNow = new Date('2025-01-05T03:00:00Z');
    vi.setSystemTime(offPeakNow);

    const offPeakPost = buildPost({
      platformPostId: 'off-peak',
      detectedAt: new Date('2025-01-05T02:00:00Z'), // 1 hour old
      rawMetrics: { likes: 12, replies: 3 },
    });

    const { rate, temporalContext } = (
      analyzer as unknown as {
        calculateNormalizedEngagementRate: (post: Post) => {
          rate: number;
          temporalContext: unknown;
        };
        calculateEngagementRate: (post: Post, hoursSincePost: number) => number;
      }
    ).calculateNormalizedEngagementRate(offPeakPost);

    const rawRate = (
      analyzer as unknown as {
        calculateEngagementRate: (post: Post, hoursSincePost: number) => number;
      }
    ).calculateEngagementRate(offPeakPost, temporalContext.hoursSincePost);

    const normalizationFactor = Math.max(
      0.6,
      temporalContext.timeOfDayFactor * temporalContext.dayOfWeekFactor
    );

    expect(temporalContext.timeOfDayFactor).toBeLessThan(1);
    expect(temporalContext.dayOfWeekFactor).toBeLessThan(1);
    expect(rate).toBeCloseTo(rawRate / normalizationFactor);
    expect(rate).toBeGreaterThan(rawRate); // off-peak normalization boosts effective rate
  });
});
