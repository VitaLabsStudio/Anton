/**
 * Tests for StrategicDecisionLayer
 * Story 2.10: Strategy Implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { StrategicDecisionLayer } from './strategic-decision-layer';
import type { ArchetypeScores } from '../types';

describe('StrategicDecisionLayer', () => {
  let layer: StrategicDecisionLayer;

  const mockScores: ArchetypeScores = {
    scores: [
      {
        archetype: 'COACH',
        score: 0.9,
        confidence: 0.8,
        factorBreakdown: {
          F1_modeIntent: 0.3,
          F2_semanticResonance: 0.2,
          F3_authorPersonaFit: 0.1,
          F4_competitorCounter: 0.1,
          F5_conversationState: 0.1,
          F6_performanceMemory: 0.1,
          F7_safetyCompliance: 0.8, // Safe
          F8_rotationNovelty: 0.05,
          rotationPenalty: 0,
          performanceBias: 0,
          totalScore: 0.9,
        },
        justification: '',
      },
      {
        archetype: 'CHECKLIST',
        score: 0.85,
        confidence: 0.8,
        factorBreakdown: {
          F1_modeIntent: 0.25,
          F2_semanticResonance: 0.2,
          F3_authorPersonaFit: 0.1,
          F4_competitorCounter: 0.1,
          F5_conversationState: 0.1,
          F6_performanceMemory: 0.1,
          F7_safetyCompliance: 0.8, // Safe
          F8_rotationNovelty: 0.05,
          rotationPenalty: 0,
          performanceBias: 0,
          totalScore: 0.85,
        },
        justification: '',
      },
      {
        archetype: 'MYTH_BUST',
        score: 0.81, // 0.90 - 0.81 = 0.09 (Outside 0.08 margin)
        confidence: 0.8,
        factorBreakdown: {
          F1_modeIntent: 0.25,
          F2_semanticResonance: 0.2,
          F3_authorPersonaFit: 0.1,
          F4_competitorCounter: 0.1,
          F5_conversationState: 0.1,
          F6_performanceMemory: 0.1,
          F7_safetyCompliance: 0.8, // Safe
          F8_rotationNovelty: 0.05,
          rotationPenalty: 0,
          performanceBias: 0,
          totalScore: 0.81,
        },
        justification: '',
      },
    ],
    variance: 0.05,
    timestamp: new Date(),
  };

  beforeEach(() => {
    layer = new StrategicDecisionLayer();
  });

  describe('applyFlexibleBoundaries', () => {
    it('should apply 0.08 margin for flexible boundaries', () => {
      const envelope = layer.applyPolicies(mockScores);

      expect(envelope.adjustedScores.length).toBe(2);
      expect(envelope.adjustedScores.find((s) => s.archetype === 'COACH')).toBeDefined();
      expect(envelope.adjustedScores.find((s) => s.archetype === 'CHECKLIST')).toBeDefined();
      expect(envelope.adjustedScores.find((s) => s.archetype === 'MYTH_BUST')).toBeUndefined();
    });

    it('should include all candidates if margin is tight', () => {
        const tightScores = {
            ...mockScores,
            scores: [
                { ...mockScores.scores[0], score: 0.90 },
                { ...mockScores.scores[1], score: 0.89 },
                { ...mockScores.scores[2], score: 0.88 },
            ]
        };
        const envelope = layer.applyPolicies(tightScores as any);
        expect(envelope.adjustedScores.length).toBe(3);
    });
  });
});
