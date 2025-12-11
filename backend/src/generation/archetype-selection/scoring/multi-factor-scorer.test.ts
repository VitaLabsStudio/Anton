/**
 * Tests for MultiFactorScorer
 * Story 2.10: Scoring Logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Hoist mocks
const mocks = vi.hoisted(() => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
  prisma: {
    decisionOutcome: {
      aggregate: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/redis', () => ({
  redis: mocks.redis,
}));

vi.mock('../../../utils/prisma', () => ({
  prisma: mocks.prisma,
}));

import { MultiFactorScorer } from './multi-factor-scorer';
import type { ArchetypeContext } from '../types';

describe('MultiFactorScorer', () => {
  let scorer: MultiFactorScorer;

  const mockContext: ArchetypeContext = {
    postId: 'post-123',
    mode: 'HELPFUL',
    modeConfidence: 0.8,
    platform: 'reddit',
    timestamp: new Date(),
    overallConfidence: 0.8,
    freshness: {
      semantic: new Date(),
      persona: new Date(),
      competitor: new Date(),
      conversation: new Date(),
    },
    semanticProfile: {
      emotionVector: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, neutral: 1 },
      urgency: 0.2,
      misinformationProbability: 0.1,
      humorDetected: false,
      stance: 'neutral',
      rationale: '',
      confidence: 0.8,
      cacheHit: false,
      timestamp: new Date(),
    },
    personaProfile: {
      primaryPersona: 'unknown',
      receptiveness: 0.5,
      relationshipStage: 'first_contact',
      followerTier: 'nano',
      isPowerUser: false,
      confidence: 0.5,
      timestamp: new Date(),
    },
    competitorIntent: {
      detected: false,
      archetype: 'unknown',
      aggressiveness: 'low',
      recommendedCounterWeights: new Map(),
      confidence: 0,
      timestamp: new Date(),
    },
    conversationState: {
      threadDepth: 0,
      cadence: 'moderate',
      platformCultureBias: 0,
      cooldownHint: false,
      confidence: 0.5,
      timestamp: new Date(),
    },
  };

  beforeEach(() => {
    scorer = new MultiFactorScorer();
    vi.clearAllMocks();
  });

  describe('score()', () => {
    it('should calculate scores for all archetypes', async () => {
      const scores = await scorer.score(mockContext);
      expect(scores.scores.length).toBeGreaterThan(0);
      expect(scores.scores[0].score).toBeGreaterThanOrEqual(0);
      expect(scores.scores[0].score).toBeLessThanOrEqual(1);
    });

    it('should apply rotation penalty for recently used archetypes', async () => {
      // Arrange: Redis returns a recent timestamp for 'COACH'
      const recentTime = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
      mocks.redis.get.mockImplementation(async (key: string) => {
        if (key.includes('COACH')) return recentTime;
        return null;
      });

      // Act
      const scores = await scorer.score(mockContext);
      const coachScore = scores.scores.find((s) => s.archetype === 'COACH');

      // Assert
      expect(coachScore).toBeDefined();
      expect(coachScore?.factorBreakdown.rotationPenalty).toBeLessThan(0);
    });

    it('should not apply rotation penalty for unused archetypes', async () => {
      // Arrange: Redis returns null (never used)
      mocks.redis.get.mockResolvedValue(null);

      // Act
      const scores = await scorer.score(mockContext);
      const coachScore = scores.scores.find((s) => s.archetype === 'COACH');

      // Assert
      expect(coachScore).toBeDefined();
      expect(coachScore?.factorBreakdown.rotationPenalty).toBe(0);
    });

    it('should exempt MYTH_BUST from rotation penalty when misinformation is high', async () => {
      // Arrange: Recent usage for MYTH_BUST, but high misinformation risk
      const recentTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      mocks.redis.get.mockResolvedValue(recentTime); // All archetypes used recently

      const highRiskContext = {
        ...mockContext,
        semanticProfile: {
          ...mockContext.semanticProfile,
          misinformationProbability: 0.8, // > 0.7 threshold
        },
      };

      // Act
      const scores = await scorer.score(highRiskContext);
      const mythBustScore = scores.scores.find((s) => s.archetype === 'MYTH_BUST');

      // Assert
      expect(mythBustScore).toBeDefined();
      expect(mythBustScore?.factorBreakdown.rotationPenalty).toBe(0);
    });

    it('should apply positive performance bias for high-performing archetypes', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue(null);
      mocks.prisma.decisionOutcome.aggregate.mockResolvedValue({
        _avg: { engagementScore: 0.8 }, // High engagement (> 0.5)
        _count: 20, // > 10 sample size
      });

      // Act
      const scores = await scorer.score(mockContext);
      const coachScore = scores.scores.find((s) => s.archetype === 'COACH');

      // Assert
      expect(coachScore).toBeDefined();
      expect(coachScore?.factorBreakdown.performanceBias).toBeGreaterThan(0);
    });

    it('should apply negative performance bias for low-performing archetypes', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue(null);
      mocks.prisma.decisionOutcome.aggregate.mockResolvedValue({
        _avg: { engagementScore: 0.2 }, // Low engagement (< 0.5)
        _count: 20,
      });

      // Act
      const scores = await scorer.score(mockContext);
      const coachScore = scores.scores.find((s) => s.archetype === 'COACH');

      // Assert
      expect(coachScore).toBeDefined();
      expect(coachScore?.factorBreakdown.performanceBias).toBeLessThan(0);
    });

    it('should not apply performance bias with insufficient sample size', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue(null);
      mocks.prisma.decisionOutcome.aggregate.mockResolvedValue({
        _avg: { engagementScore: 0.9 },
        _count: 5, // < 10 sample size
      });

      // Act
      const scores = await scorer.score(mockContext);
      const coachScore = scores.scores.find((s) => s.archetype === 'COACH');

      // Assert
      expect(coachScore).toBeDefined();
      expect(coachScore?.factorBreakdown.performanceBias).toBe(0);
    });
  });
});
