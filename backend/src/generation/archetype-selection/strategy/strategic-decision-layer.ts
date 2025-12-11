/**
 * Strategic Decision Layer - Policy enforcement, overrides, flexible boundaries
 * Story 2.10: Task 3
 */

import { logger } from '@/utils/logger';

import type { ArchetypeScores, StrategicEnvelope, ArchetypeScore } from '../types';

export class StrategicDecisionLayer {
  constructor() {
    logger.info('StrategicDecisionLayer initialized');
  }

  public applyPolicies(scores: ArchetypeScores): StrategicEnvelope {
    const overrides: StrategicEnvelope['overrides'] = [];
    const suppressedCandidates: string[] = [];
    const policyChain: string[] = [];

    // Apply safety overrides
    const safetyResults = this.applySafetyOverrides(scores);
    overrides.push(...safetyResults.overrides);
    suppressedCandidates.push(...safetyResults.suppressed);
    policyChain.push(...safetyResults.policies);

    // Apply flexible mode boundaries
    const flexibleScores = this.applyFlexibleBoundaries(scores);

    // Apply rotation penalties (from Redis store)
    const finalScores = this.applyRotationPenalties(flexibleScores);

    return {
      adjustedScores: finalScores.scores,
      overrides,
      suppressedCandidates,
      policyChain,
      timestamp: new Date(),
    };
  }

  private applySafetyOverrides(scores: ArchetypeScores): {
    overrides: StrategicEnvelope['overrides'];
    suppressed: string[];
    policies: string[];
  } {
    const overrides: StrategicEnvelope['overrides'] = [];
    const suppressed: string[] = [];
    const policies: string[] = [];

    // Check for high misinformation risk
    const hasHighMisinfo = scores.scores.some((s) => s.factorBreakdown.F7_safetyCompliance < 0.3);

    if (hasHighMisinfo) {
      overrides.push({
        type: 'safety',
        reason: 'High misinformation risk detected',
        forcedArchetype: 'MYTH_BUST',
      });
      policies.push('MISINFORMATION_OVERRIDE');
    }

    return { overrides, suppressed, policies };
  }

  private applyFlexibleBoundaries(scores: ArchetypeScores): ArchetypeScores {
    // AC3: "Allow out-of-mode selections when margin > +0.08"
    const topScore = scores.scores[0]?.score || 0;
    const threshold = topScore - 0.08; // Use AC3 specified value

    const filtered = scores.scores.filter((s) => s.score >= threshold);

    logger.debug(
      {
        topScore,
        threshold,
        beforeCount: scores.scores.length,
        afterCount: filtered.length,
      },
      'Applied flexible mode boundaries'
    );

    return {
      ...scores,
      scores: filtered,
    };
  }

  private applyRotationPenalties(scores: ArchetypeScores): ArchetypeScores {
    // TODO: Query Redis for recent usage and apply exponential decay
    // penalty = -μ × e^(-k × age) where μ=0.12, k=0.35
    return scores;
  }
}
