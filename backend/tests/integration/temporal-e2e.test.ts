import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DecisionEngine } from '../../src/analysis/decision-engine.js';
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

// Mock other signals to return safe defaults
vi.mock('../../src/analysis/signal-1-linguistic.js', () => ({
  analyzeLinguisticIntent: vi.fn().mockResolvedValue({ score: 0.5, confidence: 0.9 }),
}));
vi.mock('../../src/analysis/signal-2-author.js', () => ({
  analyzeAuthorContext: vi.fn().mockResolvedValue({ score: 0.5, confidence: 0.9, archetypes: [], interactionCount: 0 }),
}));
vi.mock('../../src/analysis/signal-3-velocity.js', () => ({
  analyzePostVelocity: vi.fn().mockResolvedValue({ ratio: 1.0, confidence: 0.9, category: 'normal' }),
}));
vi.mock('../../src/analysis/signal-4-semantic.js', () => ({
  analyzeSemanticTopic: vi.fn().mockResolvedValue({ score: 0.5, confidence: 0.9, context: 'relevant' }),
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

// We do NOT mock temporal-intelligence.js because we want to test its integration.
// However, we might need to configure it with rules if it uses default loading.
// The real instance loads from JSON.

describe('Temporal Intelligence End-to-End', () => {
  let engine: DecisionEngine;
  
  beforeEach(() => {
    vi.clearAllMocks();
    engine = new DecisionEngine();
    
    // We assume the real temporal intelligence is used by DecisionEngine
    // but DecisionEngine uses 'getTemporalContext' from 'temporal-migration.ts'
    // which defaults to legacy_only if env var not set.
    // We MUST set env var to 'new_only' to test new system E2E.
    process.env.TEMPORAL_MIGRATION_MODE = 'new_only';
  });

  it('should apply Peak Suffering strategy on Sunday Morning', async () => {
    // Setup: Create mock post at Sunday 9am
    const sundayMorning = new Date('2025-12-14T09:00:00-05:00'); // Sunday
    const mockPost = {
      id: 'post-sun',
      content: 'I hate Sundays',
      platform: 'TWITTER',
      detectedAt: sundayMorning,
    };
    const mockAuthor = {
      id: 'author-1',
      platformId: 'auth-1',
      platform: 'TWITTER',
      handle: 'sufferer',
    };

    // Act
    const decision = await engine.analyzePost(mockPost as any, mockAuthor as any);
    const context = decision.temporalContext as any;

    // Assert
    expect(context).toBeDefined();
    // Verify specific rules from temporal-rules.json (sunday_morning_peak)
    // "id": "sunday_morning_peak", "monitoringMultiplier": 3.0, "isPriority": true
    
    // Note: If using real rules, we need to ensure time provider works correctly.
    // Real getTemporalContext uses LuxonTimeProvider which uses system time or mocked time?
    // It uses `timeProvider.getContext(date)`.
    // Since we pass `detectedAt` to `getTemporalContext`, it should respect it.
    
    expect(context.phase).toBe('peak_suffering');
    expect(context.monitoringMultiplier).toBe(3.0);
    expect(context.isPriority).toBe(true);
    expect(context.matchedRules).toContain('sunday_morning_peak');
  });

  it('should apply Prevention strategy on Thursday Evening', async () => {
    // Thursday 6pm
    const thursdayEvening = new Date('2025-12-11T18:00:00-05:00');
    const mockPost = {
      id: 'post-thu',
      content: 'Thirsty Thursday',
      platform: 'TWITTER',
      detectedAt: thursdayEvening,
    };
    const mockAuthor = {
      id: 'author-2',
      platformId: 'auth-2',
      platform: 'TWITTER',
      handle: 'partier',
    };

    // Act
    const decision = await engine.analyzePost(mockPost as any, mockAuthor as any);
    const context = decision.temporalContext as any;

    // Assert
    // "id": "thursday_prevention", "monitoringMultiplier": 1.5, "archetypePreferences": ["COACH", "CREDIBILITY_ANCHOR"]
    expect(context.matchedRules).toContain('thursday_prevention');
    expect(context.phase).toBe('prevention');
    expect(context.archetypePreferences).toContain('COACH');
    
    // Decision engine should have tried to apply archetype (if author matched, but here author signal returns empty)
    // So archetype remains default, but preferences are in context.
  });
});
