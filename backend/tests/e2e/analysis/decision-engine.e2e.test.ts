import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Author, Post } from '@prisma/client';

vi.mock('../../../src/utils/prisma.js', () => ({
  prisma: {
    segmentedWeight: { findUnique: vi.fn(async () => null) },
    decision: { create: vi.fn(async () => null) },
    post: { update: vi.fn(async () => null) },
    archetype: { findUnique: vi.fn(async () => null) },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<void>) => cb({})),
  },
}));

const sssSignal = { score: 0.75, confidence: 0.9, category: 'high_solution' };
const arsSignal = { score: 0.7, confidence: 0.8, archetypes: ['helper'], interactionCount: 3 };
const evsSignal = {
  ratio: 4,
  category: 'viral',
  confidence: 0.9,
  baselineRate: 1,
  currentRate: 4,
  temporalContext: { hoursSincePost: 2 },
};
const trsSignal = { score: 0.85, confidence: 0.9, context: 'actual_hangover' };
const safetySignal = { shouldDisengage: false, flags: [] };
const powerUserSignal = { isPowerUser: true, confidence: 0.95 };
const competitorSignal = { detected: true, name: 'Acme', confidence: 0.8 };
const temporalSignal = { context: { multiplier: 1, dayOfWeek: 1, hour: 9, reason: 'peak' }, timestamp: new Date() };

vi.mock('../../../src/analysis/signal-1-linguistic.js', () => ({
  analyzeLinguisticIntent: vi.fn(() => Promise.resolve(sssSignal)),
}));
vi.mock('../../../src/analysis/signal-2-author.js', () => ({
  analyzeAuthorContext: vi.fn(() => Promise.resolve(arsSignal)),
}));
vi.mock('../../../src/analysis/signal-3-velocity.js', () => ({
  analyzePostVelocity: vi.fn(() => Promise.resolve(evsSignal)),
}));
vi.mock('../../../src/analysis/signal-4-semantic.js', () => ({
  analyzeSemanticTopic: vi.fn(() => Promise.resolve(trsSignal)),
}));
vi.mock('../../../src/analysis/safety-protocol.js', () => ({
  checkSafetyProtocol: vi.fn(() => Promise.resolve(safetySignal)),
}));
vi.mock('../../../src/analysis/power-user-detector.js', () => ({
  detectPowerUser: vi.fn(() => Promise.resolve(powerUserSignal)),
}));
vi.mock('../../../src/analysis/competitive-detector.js', () => ({
  detectCompetitor: vi.fn(() => Promise.resolve(competitorSignal)),
}));
vi.mock('../../../src/analysis/temporal-intelligence.js', () => ({
  getTemporalContext: vi.fn(() => Promise.resolve(temporalSignal)),
}));

import { DecisionEngine, DEFAULT_THRESHOLDS } from '../../../src/analysis/decision-engine.js';

const baselineSignals = {
  sss: { score: 0.75, confidence: 0.9, category: 'high_solution' },
  ars: { score: 0.7, confidence: 0.8, archetypes: ['helper'], interactionCount: 3 },
  evs: {
    ratio: 4,
    category: 'viral',
    confidence: 0.9,
    baselineRate: 1,
    currentRate: 4,
    temporalContext: { hoursSincePost: 2 },
  },
  trs: { score: 0.85, confidence: 0.9, context: 'actual_hangover' },
  safety: { shouldDisengage: false, flags: [] as string[] },
  powerUser: { isPowerUser: true, confidence: 0.95 },
};

const resetSignals = () => {
  Object.assign(sssSignal, baselineSignals.sss);
  Object.assign(arsSignal, baselineSignals.ars);
  Object.assign(evsSignal, baselineSignals.evs);
  Object.assign(trsSignal, baselineSignals.trs);
  Object.assign(safetySignal, baselineSignals.safety);
  Object.assign(powerUserSignal, baselineSignals.powerUser);
};

function buildAuthor(): Author {
  return {
    id: 'author-e2e',
    platform: 'TWITTER',
    platformId: 'author-platform',
    handle: 'e2e-user',
    displayName: 'E2E',
    followerCount: 50000,
    isVerified: false,
    isPowerUser: true,
    powerTierId: null,
    archetypeTags: [],
    relationshipScore: 0.6,
    interactionHistory: [],
    firstSeenAt: new Date(),
    lastSeenAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    champions: null,
    powerTier: null,
    posts: [],
  } as unknown as Author;
}

function buildPost(): Post {
  const now = new Date();
  return {
    id: 'post-e2e',
    platform: 'TWITTER',
    platformPostId: 'post-e2e-1',
    authorId: 'author-e2e',
    content: 'Testing decision engine',
    detectedAt: now,
    processedAt: null,
    keywordMatches: [],
    keywordCategories: [],
    spamFiltered: false,
    rawMetrics: { likes: 2, replies: 1, reposts: 0, upvotes: 0, comments: 0 },
    errorCount: 0,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
    competitiveMentions: [],
    decisions: [],
    escalations: [],
    author: buildAuthor(),
  } as unknown as Post;
}

describe('DecisionEngine E2E orchestration', () => {
  beforeEach(() => {
    resetSignals();
    vi.clearAllMocks();
  });

  it('executes decision flow and persists output', async () => {
    const prisma = {
      segmentedWeight: { findUnique: vi.fn(async () => null) },
      decision: { create: vi.fn() },
      post: { update: vi.fn() },
      archetype: { findUnique: vi.fn(async () => ({ id: 'arch-e2e', name: 'general' })) },
      $transaction: vi.fn(async (callback: (tx: typeof prisma) => Promise<void>) => callback(prisma)),
    };

    const engine = new DecisionEngine({
      thresholds: { ...DEFAULT_THRESHOLDS },
      prismaClient: prisma,
    });

    const result = await engine.analyzePost(buildPost(), buildAuthor());

    expect(result.segmentUsed).toContain('_');
    expect(result.competitorDetected).toBe('Acme');
    expect(prisma.decision.create).toHaveBeenCalled();
    expect(prisma.post.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ processedAt: expect.any(Date) }) }));
  });

  it('disengages when safety protocol flags content', async () => {
    safetySignal.shouldDisengage = true;
    safetySignal.flags = ['unsafe_content'];

    const engine = new DecisionEngine({ thresholds: DEFAULT_THRESHOLDS });
    const decision = await engine.analyzePost(buildPost(), buildAuthor());

    expect(decision.mode).toBe('DISENGAGED');
    expect(decision.needsReview).toBe(false);
    expect(decision.safetyFlags).toContain('unsafe_content');
  });

  it('disengages when topic relevance is below gate', async () => {
    trsSignal.score = 0.2;

    const engine = new DecisionEngine({ thresholds: DEFAULT_THRESHOLDS });
    const decision = await engine.analyzePost(buildPost(), buildAuthor());

    expect(decision.mode).toBe('DISENGAGED');
    expect(decision.modeConfidence).toBe(1);
  });

  it('follows power-user priority rules', async () => {
    powerUserSignal.isPowerUser = true;
    sssSignal.score = 0.72;
    evsSignal.ratio = 1.5;

    const engine = new DecisionEngine({ thresholds: DEFAULT_THRESHOLDS });
    const decision = await engine.analyzePost(buildPost(), buildAuthor());

    expect(decision.mode).toBe('HELPFUL');
    expect(decision.modeProbabilities.HELPFUL).toBeGreaterThan(decision.modeProbabilities.ENGAGEMENT);
  });

  it('flags low-confidence decisions for review', async () => {
    powerUserSignal.isPowerUser = false;
    Object.assign(sssSignal, { score: 0.55, confidence: 0.6 });
    Object.assign(arsSignal, { score: 0.2, confidence: 0.6, archetypes: [], interactionCount: 0 });
    evsSignal.ratio = 1.0;

    const engine = new DecisionEngine({
      thresholds: { ...DEFAULT_THRESHOLDS, confidenceThreshold: 0.95, reviewConfidenceDelta: 0 },
    });
    const decision = await engine.analyzePost(buildPost(), buildAuthor());

    expect(decision.needsReview).toBe(true);
    expect(decision.reviewReason).toBe('LOW_CONFIDENCE');
  });

  it('handles concurrent requests and reuses cached weights', async () => {
    const prisma = {
      segmentedWeight: { findUnique: vi.fn(async () => null) },
      decision: { create: vi.fn() },
      post: { update: vi.fn() },
      archetype: { findUnique: vi.fn(async () => ({ id: 'arch-e2e', name: 'general' })) },
      $transaction: vi.fn(async (callback: (tx: typeof prisma) => Promise<void>) => callback(prisma)),
    };

    const engine = new DecisionEngine({
      thresholds: { ...DEFAULT_THRESHOLDS },
      prismaClient: prisma,
    });

    const author = buildAuthor();
    await engine.analyzePost(buildPost(), author); // warm cache

    const posts = Array.from({ length: 4 }, (_, idx) => ({ ...buildPost(), id: `post-concurrent-${idx}` }));
    await Promise.all(posts.map((post) => engine.analyzePost(post, author)));

    const snapshot = engine.getHealthSnapshot();
    expect(snapshot.cache.hits).toBeGreaterThanOrEqual(3);
    expect(snapshot.cache.misses).toBeGreaterThanOrEqual(1);
    expect(prisma.decision.create).toHaveBeenCalledTimes(5);
  });
});
