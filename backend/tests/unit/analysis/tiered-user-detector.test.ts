import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectUserTier, TIER_RESPONSE_TARGETS, archetypesForTier } from '../../../src/analysis/tiered-user-detector';
import { prisma } from '../../../src/utils/prisma';
import { redis } from '../../../src/utils/redis';

vi.mock('../../../src/utils/prisma', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
    },
    author: {
      update: vi.fn(),
    },
    tierChange: {
      create: vi.fn(),
    },
    pendingAction: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('../../../src/utils/redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
  },
}));

describe('TieredUserDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset implementations to defaults
    vi.mocked(prisma.post.findMany).mockResolvedValue([]);
    vi.mocked(prisma.author.update).mockResolvedValue({} as any);
    vi.mocked(redis.get).mockResolvedValue(null);
  });

  const createAuthor = (overrides = {}) => ({
    id: 'author-123',
    platform: 'TWITTER',
    platformId: '123456',
    handle: 'testuser',
    displayName: 'Test User',
    bio: 'Just a user',
    followerCount: 0,
    isVerified: false,
    userTier: 'NEW_UNKNOWN',
    isPowerUser: false,
    interactionHistory: [],
    archetypeTags: [],
    relationshipScore: 0.5,
    firstSeenAt: new Date(),
    lastSeenAt: new Date(),
    lastTierUpdate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    powerTierId: null,
    ...overrides,
  });

  it('detects MEGA_POWER for >500k followers', async () => {
    const author = createAuthor({ followerCount: 600000 });
    const result = await detectUserTier(author as any);
    
    expect(result.userTier).toBe('MEGA_POWER');
    expect(result.isPowerUser).toBe(true);
    expect(result.responseTargetMinutes).toBe(TIER_RESPONSE_TARGETS.MEGA_POWER);
    expect(result.suggestedArchetypes).toEqual(archetypesForTier('MEGA_POWER'));
  });

  it('detects MACRO_POWER for 50k-500k followers', async () => {
    const author = createAuthor({ followerCount: 100000 });
    const result = await detectUserTier(author as any);
    
    expect(result.userTier).toBe('MACRO_POWER');
    expect(result.isPowerUser).toBe(true);
  });

  it('detects MICRO_POWER for 5k-50k followers', async () => {
    const author = createAuthor({ followerCount: 10000 });
    const result = await detectUserTier(author as any);
    
    expect(result.userTier).toBe('MICRO_POWER');
    expect(result.isPowerUser).toBe(true);
  });

  it('detects MICRO_POWER for verified users even with low followers', async () => {
    const author = createAuthor({ followerCount: 1000, isVerified: true });
    const result = await detectUserTier(author as any);
    
    expect(result.userTier).toBe('MICRO_POWER');
    expect(result.isPowerUser).toBe(true);
    expect(result.reasons).toContain('Verified badge detected');
  });

  it('detects MICRO_POWER for bio keywords', async () => {
    const author = createAuthor({ followerCount: 1000, bio: 'I am a content creator' });
    const result = await detectUserTier(author as any);
    
    expect(result.userTier).toBe('MICRO_POWER');
    expect(result.isPowerUser).toBe(true);
    expect(result.metadata.bioKeywords).toContain('content creator');
  });

  it('detects MICRO_POWER for high engagement rate (>3%)', async () => {
    // Mock engagement calculation
    vi.mocked(prisma.post.findMany).mockResolvedValue([
      { id: '1', rawMetrics: { likes: 350 }, detectedAt: new Date() },
    ] as any);
    // 350 engagement / 10000 followers = 3.5%

    const author = createAuthor({ followerCount: 10000 });
    const result = await detectUserTier(author as any);
    
    expect(result.userTier).toBe('MICRO_POWER');
    expect(result.engagementRate).toBeGreaterThan(0.03);
  });

  it('detects ENGAGED_REGULAR for 1k-5k followers with >2% engagement', async () => {
    vi.mocked(prisma.post.findMany).mockResolvedValue([
      { id: '1', rawMetrics: { likes: 50 }, detectedAt: new Date() }, // 50/2000 = 2.5%
    ] as any);

    const author = createAuthor({ followerCount: 2000 });
    const result = await detectUserTier(author as any);
    
    expect(result.userTier).toBe('ENGAGED_REGULAR');
    expect(result.isPowerUser).toBe(false);
    expect(result.responseTargetMinutes).toBe(TIER_RESPONSE_TARGETS.ENGAGED_REGULAR);
  });

  it('detects STANDARD for 500-1k followers', async () => {
    const author = createAuthor({ followerCount: 800 });
    const result = await detectUserTier(author as any);
    
    expect(result.userTier).toBe('STANDARD');
  });

  it('detects SMALL for 100-500 followers', async () => {
    const author = createAuthor({ followerCount: 200 });
    const result = await detectUserTier(author as any);
    
    expect(result.userTier).toBe('SMALL');
    expect(result.caringResponse).toBe(true);
  });

  it('detects NEW_UNKNOWN for <100 followers', async () => {
    const author = createAuthor({ followerCount: 50 });
    const result = await detectUserTier(author as any);
    
    expect(result.userTier).toBe('NEW_UNKNOWN');
    expect(result.caringResponse).toBe(true);
  });

  it('persists classification to DB', async () => {
    const author = createAuthor({ followerCount: 600000, userTier: 'NEW_UNKNOWN' });
    await detectUserTier(author as any);
    
    expect(prisma.author.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: author.id },
      data: expect.objectContaining({
        userTier: 'MEGA_POWER',
        isPowerUser: true,
      }),
    }));

    expect(prisma.tierChange.create).toHaveBeenCalled();
  });
});