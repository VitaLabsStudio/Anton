import { beforeAll, describe, expect, it, vi } from 'vitest';

import { prisma } from '../../../src/utils/prisma.js';
import type { DecisionThresholds } from '../../../src/analysis/decision-engine.js';

const hasDatabase = Boolean(process.env['DATABASE_URL']);
const describeIfDb = hasDatabase ? describe : describe.skip;

vi.mock('../../../src/analysis/signal-1-linguistic.js', () => ({
  analyzeLinguisticIntent: vi.fn(async () => ({
    score: 0.8,
    confidence: 0.9,
    category: 'high_solution',
  })),
}));
vi.mock('../../../src/analysis/signal-2-author.js', () => ({
  analyzeAuthorContext: vi.fn(async () => ({
    score: 0.75,
    confidence: 0.9,
    archetypes: ['helper'],
    interactionCount: 1,
  })),
}));
vi.mock('../../../src/analysis/signal-3-velocity.js', () => ({
  analyzePostVelocity: vi.fn(async () => ({
    ratio: 2,
    category: 'normal',
    confidence: 0.9,
    baselineRate: 1,
    currentRate: 2,
    temporalContext: { hoursSincePost: 1 },
  })),
}));
vi.mock('../../../src/analysis/signal-4-semantic.js', () => ({
  analyzeSemanticTopic: vi.fn(async () => ({
    score: 0.8,
    confidence: 0.9,
    context: 'actual_hangover',
  })),
}));
vi.mock('../../../src/analysis/safety-protocol.js', () => ({
  checkSafetyProtocol: vi.fn(async () => ({ shouldDisengage: false, flags: [] })),
}));
vi.mock('../../../src/analysis/power-user-detector.js', () => ({
  detectPowerUser: vi.fn(async () => ({ isPowerUser: true, confidence: 0.95 })),
}));
vi.mock('../../../src/analysis/competitive-detector.js', () => ({
  detectCompetitor: vi.fn(async () => ({ detected: true, name: 'Acme', confidence: 0.8 })),
}));
vi.mock('../../../src/analysis/temporal-intelligence.js', () => ({
  getTemporalContext: vi.fn(async () => ({
    context: { multiplier: 1, dayOfWeek: 0, hour: 0, reason: 'test' },
    timestamp: new Date(),
  })),
}));

type DecisionEngineModuleType = typeof import('../../../src/analysis/decision-engine.js');
let DecisionEngineModule: DecisionEngineModuleType;
let thresholds: DecisionThresholds;

beforeAll(async () => {
  DecisionEngineModule = await import('../../../src/analysis/decision-engine.js');
  thresholds = { ...DecisionEngineModule.DEFAULT_THRESHOLDS, minSampleSize: 10 };
});

describeIfDb('DecisionEngine DB persistence integration', () => {
  it('persists multi-signal decision + indexes', async () => {
    const archetype = await prisma.archetype.upsert({
      where: { name: 'helper' },
      create: { name: 'helper' },
      update: {},
    });

    const author = await prisma.author.create({
      data: {
        platform: 'TWITTER',
        platformId: `db-${Date.now()}`,
        handle: 'db-test',
        archetypeTags: ['helper'],
      },
    });

    const post = await prisma.post.create({
      data: {
        platform: 'TWITTER',
        platformPostId: `post-${Date.now()}`,
        authorId: author.id,
        content: 'Persistence guardrail test',
        rawMetrics: { likes: 0, replies: 0 },
        keywordMatches: [],
        keywordCategories: [],
      },
    });

    const engine = new DecisionEngineModule.DecisionEngine({
      thresholds,
      prismaClient: prisma,
    });

    try {
      await engine.analyzePost(post, author);

      const decision = await prisma.decision.findFirst({ where: { postId: post.id } });
      expect(decision).toBeTruthy();
      expect(decision!.segmentUsed).toContain('_');
      expect(typeof decision!.competitorDetected).toBe('string');
      expect(decision!.competitorDetected).toBe('Acme');
      expect(decision!.archetypeId).toBe(archetype.id);
      expect(decision!.modeProbabilities).toHaveProperty('HELPFUL');
      expect(decision!.modeConfidence).toBeGreaterThanOrEqual(0);

      const processedPost = await prisma.post.findUnique({ where: { id: post.id } });
      expect(processedPost?.processedAt).toBeTruthy();

      const indexes = [
        'idx_segment_weights_sample',
        'idx_decisions_composite_mode_needs_review',
        'idx_posts_processed_at_null',
      ];

      for (const name of indexes) {
        const [result] =
          await prisma.$queryRaw<{ to_regclass: string | null }>`
            SELECT to_regclass(${name})::text AS to_regclass
          `;
        expect(result?.to_regclass).toBeTruthy();
      }
    } finally {
      await prisma.decision.deleteMany({ where: { postId: post.id } });
      await prisma.post.delete({ where: { id: post.id } });
      await prisma.author.delete({ where: { id: author.id } });
    }
  });
});
