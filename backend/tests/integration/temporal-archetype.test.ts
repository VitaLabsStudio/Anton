import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DecisionEngine } from '../../src/analysis/decision-engine.js';
import * as authorSignal from '../../src/analysis/signal-2-author.js';
import * as temporalIntelligence from '../../src/analysis/temporal-intelligence.js';
import { logger } from '../../src/utils/logger.js';

// Mock dependencies
vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    decision: { create: vi.fn() },
    post: { update: vi.fn() },
    segmentedWeight: { findUnique: vi.fn() },
    archetype: { findUnique: vi.fn() },
    $transaction: vi.fn((cb) => cb({ decision: { create: vi.fn() }, post: { update: vi.fn() } })),
  },
}));

vi.mock('../../src/analysis/signal-2-author.js');
vi.mock('../../src/analysis/temporal-intelligence.js');

// Mock other signals to return safe defaults
vi.mock('../../src/analysis/signal-1-linguistic.js', () => ({
  analyzeLinguisticIntent: vi.fn().mockResolvedValue({ score: 0.8, confidence: 0.9 }),
}));
vi.mock('../../src/analysis/signal-3-velocity.js', () => ({
  analyzePostVelocity: vi.fn().mockResolvedValue({ ratio: 1.0, confidence: 0.9, category: 'normal' }),
}));
vi.mock('../../src/analysis/signal-4-semantic.js', () => ({
  analyzeSemanticTopic: vi.fn().mockResolvedValue({ score: 0.7, confidence: 0.9, context: 'relevant' }),
}));
vi.mock('../../src/analysis/safety-protocol.js', () => ({
  checkSafetyProtocol: vi.fn().mockResolvedValue({ shouldDisengage: false, flags: [], severity: 'none' }),
  SafetySeverity: { CRITICAL: 'CRITICAL' },
}));
vi.mock('../../src/analysis/power-user-detector.js', () => ({
  detectPowerUser: vi.fn().mockResolvedValue({ isPowerUser: false, confidence: 0.9 }),
}));
vi.mock('../../src/analysis/competitive-detector.js', () => ({
  detectCompetitor: vi.fn().mockResolvedValue({ detected: false, confidence: 0.9 }),
}));

describe('Temporal Archetype Integration', () => {
  let engine: DecisionEngine;
  const mockPost = {
    id: 'post-123',
    content: 'test content',
    platform: 'TWITTER',
    detectedAt: new Date(),
  };
  const mockAuthor = {
    id: 'author-123',
    platformId: 'auth-1',
    platform: 'TWITTER',
    handle: 'tester',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new DecisionEngine();
  });

  it('should prioritize temporally preferred archetype if author matches', async () => {
    // Arrange
    // Author can be REALIST or COACH
    vi.mocked(authorSignal.analyzeAuthorContext).mockResolvedValue({
      score: 0.8,
      confidence: 0.9,
      archetypes: ['REALIST', 'COACH'],
      interactionCount: 10,
    });

    // Temporal context prefers COACH (Thursday evening)
    vi.mocked(temporalIntelligence.getTemporalContext).mockReturnValue({
      phase: 'prevention',
      monitoringMultiplier: 1.5,
      matchedRules: ['thursday_prevention'],
      archetypePreferences: ['COACH', 'CREDIBILITY_ANCHOR'],
      timezone: 'UTC',
      localTime: '2025-12-11T18:00:00',
    } as any);

    // Act
    const result = await engine.analyzePost(mockPost as any, mockAuthor as any);

    // Assert
    expect(result.archetype).toBe('COACH');
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        preferredMatch: 'COACH',
        preferences: ['COACH', 'CREDIBILITY_ANCHOR'],
      }),
      'temporal_archetype_applied'
    );
  });

  it('should fallback to first author archetype if no temporal preference intersection', async () => {
    // Arrange
    // Author is REALIST only
    vi.mocked(authorSignal.analyzeAuthorContext).mockResolvedValue({
      score: 0.8,
      confidence: 0.9,
      archetypes: ['REALIST'],
      interactionCount: 10,
    });

    // Temporal context prefers COACH
    vi.mocked(temporalIntelligence.getTemporalContext).mockReturnValue({
      phase: 'prevention',
      matchedRules: ['thursday_prevention'],
      archetypePreferences: ['COACH', 'CREDIBILITY_ANCHOR'],
    } as any);

    // Act
    const result = await engine.analyzePost(mockPost as any, mockAuthor as any);

    // Assert
    expect(result.archetype).toBe('REALIST');
    expect(logger.info).not.toHaveBeenCalledWith(
      expect.anything(),
      'temporal_archetype_applied'
    );
  });

  it('should fallback to first author archetype if no temporal preferences', async () => {
    // Arrange
    vi.mocked(authorSignal.analyzeAuthorContext).mockResolvedValue({
      score: 0.8,
      confidence: 0.9,
      archetypes: ['REALIST', 'COACH'],
      interactionCount: 10,
    });

    // No preferences
    vi.mocked(temporalIntelligence.getTemporalContext).mockReturnValue({
      phase: 'normal',
      matchedRules: [],
      archetypePreferences: [],
    } as any);

    // Act
    const result = await engine.analyzePost(mockPost as any, mockAuthor as any);

    // Assert
    expect(result.archetype).toBe('REALIST');
  });
});
