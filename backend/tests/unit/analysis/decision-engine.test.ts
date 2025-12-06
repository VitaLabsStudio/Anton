import { afterEach, describe, expect, it, vi } from 'vitest';
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

const sssSignal = { score: 0.78, confidence: 0.9, category: 'high_solution' };
const arsSignal = { score: 0.72, confidence: 0.85, archetypes: ['helper'], interactionCount: 5 };
const evsSignal = {
  ratio: 3,
  category: 'moderate',
  confidence: 0.9,
  baselineRate: 1,
  currentRate: 3,
  temporalContext: { hoursSincePost: 1 },
};
const trsSignal = { score: 0.8, confidence: 0.9, context: 'actual_hangover' };
const safetySignal = { shouldDisengage: false, flags: [] };
const powerUserSignal = { isPowerUser: true, confidence: 0.95 };
const competitorSignal = { detected: true, name: 'Acme', confidence: 0.8 };
const temporalSignal = { context: { multiplier: 1, dayOfWeek: 0, hour: 8, reason: 'baseline' }, timestamp: new Date() };

type SignalModule = { [key: string]: () => Promise<unknown> };

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

import {
  DecisionEngine,
  DEFAULT_THRESHOLDS,
  DEFAULT_WEIGHTS,
  type SignalWeights,
} from '../../../src/analysis/decision-engine.js';

const baseThresholds = { ...DEFAULT_THRESHOLDS, minSampleSize: 50, confidenceThreshold: 0.7 };

function createPrismaStub(overrides: Partial<Record<string, unknown>> = {}) {
  const stub: Record<string, unknown> = {
    segmentedWeight: { findUnique: vi.fn(async () => null) },
    decision: { create: vi.fn(async () => null) },
    post: { update: vi.fn(async () => null) },
    archetype: { findUnique: vi.fn(async () => ({ id: 'arch-1', name: 'general' })) },
    $transaction: undefined,
    ...overrides,
  };
  (stub as any).$transaction = vi.fn(async (callback: (tx: typeof stub) => Promise<void>) => callback(stub));
  return stub;
}

function baseWeights(overrides: Partial<SignalWeights> = {}): SignalWeights {
  return {
    ...DEFAULT_WEIGHTS,
    validationTimestamp: new Date(),
    ...overrides,
  };
}

function createMetricsSpy() {
  const counts = new Map<string, number>();
  const records = new Map<string, number[]>();
  const increment = (name: string) => {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  };
  const record = (name: string, value: number) => {
    const existing = records.get(name) ?? [];
    existing.push(value);
    records.set(name, existing);
  };
  return {
    counts,
    records,
    increment,
    record,
  };
}

function buildAuthor(): Author {
  return {
    id: 'author-1',
    platform: 'TWITTER',
    platformId: 'author-platform',
    handle: 'hero',
    displayName: 'Hero',
    followerCount: 150000,
    isVerified: false,
    isPowerUser: true,
    powerTierId: null,
    archetypeTags: [],
    relationshipScore: 0.8,
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
    id: 'post-1',
    platform: 'TWITTER',
    platformPostId: 't-post-1',
    authorId: 'author-1',
    content: 'Need help with hangover',
    detectedAt: now,
    processedAt: null,
    keywordMatches: [],
    keywordCategories: [],
    spamFiltered: false,
    rawMetrics: { likes: 5, replies: 2, reposts: 0, upvotes: 0, comments: 0 },
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

describe('DecisionEngine', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calculates uncertainty without NaN when confidences/sampleSize are missing', () => {
    const engine = new DecisionEngine({ thresholds: baseThresholds, prismaClient: createPrismaStub() });
    const weights = baseWeights({ sampleSize: 0 });

    const result = engine.calculateUncertainty(
      { score: 0.7 },
      { score: 0.6 },
      { ratio: 2.5 },
      { score: 0.8 },
      weights,
      0.6
    );

    expect(result.credibleInterval[0]).toBeGreaterThanOrEqual(0);
    expect(result.credibleInterval[1]).toBeLessThanOrEqual(1);
    expect(Number.isNaN(result.credibleInterval[0])).toBe(false);
    expect(Number.isNaN(result.credibleInterval[1])).toBe(false);
  });

  it('falls back to defaults when sample size is invalid in shrinkage', () => {
    const engine = new DecisionEngine({ thresholds: baseThresholds, prismaClient: createPrismaStub() });
    const fallback = baseWeights();

    const shrunk = engine.applyBayesianShrinkage(
      {
        sssWeight: 0.4,
        arsWeight: 0.3,
        evsWeight: 0.2,
        trsWeight: 0.1,
        segmentType: 'PLATFORM',
        segmentKey: 'TWITTER',
        sampleSize: 0,
      },
      fallback
    );

    expect(shrunk.isValidated).toBe(false);
    expect(shrunk.segmentType).toBe(fallback.segmentType);
  });

  it('shrinks interaction weights along with base weights', () => {
    const engine = new DecisionEngine({ thresholds: baseThresholds, prismaClient: createPrismaStub() });
    const fallback = baseWeights({
      sssArsInteraction: 0.05,
      evsTrsInteraction: 0.03,
    });

    const shrunk = engine.applyBayesianShrinkage(
      {
        sssWeight: 0.3,
        arsWeight: 0.3,
        evsWeight: 0.2,
        trsWeight: 0.2,
        sssArsInteraction: 0.2,
        evsTrsInteraction: 0.1,
        segmentType: 'COMBINED',
        segmentKey: 'TEST_AM',
        sampleSize: 200,
      },
      fallback
    );

    expect(shrunk.isValidated).toBe(true);
    expect(shrunk.sssArsInteraction).toBeCloseTo(0.17, 2);
    expect(shrunk.evsTrsInteraction).toBeCloseTo(0.086, 2);
  });

  it('enforces safety/TRS gates in mode probabilities', () => {
    const engine = new DecisionEngine({ thresholds: baseThresholds, prismaClient: createPrismaStub() });

    const gated = engine.selectMode({
      sss: { score: 0.9, confidence: 0.9, category: 'high_solution' },
      ars: { score: 0.9, confidence: 0.9, archetypes: [], interactionCount: 0 },
      evs: { ratio: 5, category: 'viral', confidence: 0.8, baselineRate: 1, currentRate: 5, temporalContext: { hoursSincePost: 1 } },
      trs: { score: 0.4, confidence: 0.8, context: 'metaphor' },
      safety: { shouldDisengage: false, flags: [] },
      powerUser: { isPowerUser: false, confidence: 0.5 },
      competitor: { detected: false, name: null, confidence: 0 },
      temporal: temporalSignal,
    });

    expect(gated.mode).toBe('DISENGAGED');
    expect(gated.probabilities.DISENGAGED).toBe(1);
  });

  it('loads thresholds from config overrides', () => {
    const thresholds = { ...DEFAULT_THRESHOLDS, sssHelpful: 0.9, sssModerate: 0.3 };
    const engine = new DecisionEngine({ thresholds });

    expect(engine.isNearThreshold(0.9, 0.5)).toBe(true);
    expect(engine.isNearThreshold(0.6, 0.6)).toBe(false);
  });

  it('often returns decisions with segmentUsed and competitor metadata', async () => {
    const fakePrisma = {
      segmentedWeight: { findUnique: vi.fn(async () => null) },
      decision: { create: vi.fn() },
      post: { update: vi.fn() },
      archetype: { findUnique: vi.fn(async () => ({ id: 'arch-123', name: 'general' })) },
      $transaction: vi.fn(async (callback: (tx: typeof fakePrisma) => Promise<void>) => callback(fakePrisma)),
    };

    const engine = new DecisionEngine({
      thresholds: baseThresholds,
      prismaClient: fakePrisma,
    });

    const decision = await engine.analyzePost(buildPost(), buildAuthor());

    expect(fakePrisma.$transaction).toHaveBeenCalled();
    expect(decision.segmentUsed).toContain('_');
    expect(decision.competitorDetected).toBe('Acme');
    expect(decision.archetypeId).toBe('arch-123');
    expect(decision.mode).not.toBeUndefined();
  });

  it('rolls back persistence when transaction work fails', async () => {
    const committedDecisions: Array<Record<string, unknown>> = [];
    const prisma = {
      segmentedWeight: { findUnique: vi.fn(async () => null) },
      decision: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          committedDecisions.push({ ...data });
        }),
      },
      post: {
        update: vi.fn(() => {
          throw new Error('post update failed');
        }),
      },
      $transaction: vi.fn(async (callback: (tx: typeof prisma) => Promise<void>) => {
        const snapshot = [...committedDecisions];
        try {
          await callback(prisma);
        } catch (error) {
          committedDecisions.splice(0, committedDecisions.length, ...snapshot);
          throw error;
        }
      }),
      archetype: { findUnique: vi.fn(async () => ({ id: 'arch-1', name: 'general' })) },
    };

    const engine = new DecisionEngine({
      thresholds: baseThresholds,
      prismaClient: prisma as any,
    });

    await engine.analyzePost(buildPost(), buildAuthor());

    expect(prisma.decision.create).toHaveBeenCalled();
    expect(prisma.post.update).toHaveBeenCalled();
    expect(committedDecisions).toHaveLength(0);
  });

  it('records latency histogram and throughput metrics', () => {
    const metrics = createMetricsSpy();
    const engine = new DecisionEngine({
      thresholds: baseThresholds,
      prismaClient: createPrismaStub(),
      metrics,
    });

    const now = process.hrtime.bigint();
    const samples = [50, 90, 120, 240, 320];
    for (const ms of samples) {
      engine['recordLatency'](now - BigInt(ms) * 1_000_000n);
    }

    const stats = engine.getLatencyMetrics();
    expect(stats.count).toBe(samples.length);
    expect(stats.p95).toBeLessThanOrEqual(320);
    expect(metrics.counts.get('decision_latency_count')).toBe(samples.length);
    expect(metrics.records.get('decision_latency_ms')?.length).toBe(samples.length);
    expect(stats.buckets.find((bucket) => bucket.le === 500)?.count).toBeGreaterThan(0);
  });
});
