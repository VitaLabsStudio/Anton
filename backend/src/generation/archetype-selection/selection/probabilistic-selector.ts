/**
 * Probabilistic Selector - Top-N weighted sampling with temperature
 * Story 2.10: Task 4
 */

import { logger } from '@/utils/logger';

import type { SelectionDetail, StrategicEnvelope } from '../types';

export class ProbabilisticSelector {
  private defaultTopN = 4;
  private minTemperature = 0.6;
  private maxTemperature = 1.0;

  constructor() {
    logger.info('ProbabilisticSelector initialized');
  }

  public select(envelope: StrategicEnvelope): SelectionDetail {
    // Check for forced override
    const forcedOverride = envelope.overrides.find((o) => o.forcedArchetype);
    if (forcedOverride && forcedOverride.forcedArchetype) {
      return this.createForcedSelection(forcedOverride, envelope);
    }

    // Get top-N candidates
    const topN = Math.min(this.defaultTopN, envelope.adjustedScores.length);
    const candidates = envelope.adjustedScores.slice(0, topN);

    if (candidates.length === 0) {
      return this.createFallbackSelection();
    }

    // Calculate temperature based on score spread
    const temperature = this.calculateTemperature(candidates.map((c) => c.score));

    // Apply softmax with temperature
    const probabilities = this.softmax(
      candidates.map((c) => c.score),
      temperature
    );

    // Sample from distribution
    const selectedIndex = this.sample(probabilities);
    const selected = candidates[selectedIndex];

    // Build alternatives list
    const alternatives = candidates.map((c, i) => ({
      archetype: c.archetype,
      score: c.score,
      probability: probabilities[i],
    }));

    return {
      archetype: selected.archetype,
      confidence: selected.confidence,
      reason: this.buildReason(selected, envelope),
      factorBreakdown: selected.factorBreakdown,
      alternatives,
      temperature,
      fallbackMode: false,
      timestamp: new Date(),
    };
  }

  private calculateTemperature(scores: number[]): number {
    if (scores.length < 2) return this.maxTemperature;

    const spread = scores[0] - scores[scores.length - 1];

    // Higher spread = lower temperature (more confident)
    // Lower spread = higher temperature (more exploration)
    if (spread > 0.3) return this.minTemperature;
    if (spread < 0.1) return this.maxTemperature;

    return this.minTemperature + (this.maxTemperature - this.minTemperature) * (1 - spread / 0.3);
  }

  private softmax(scores: number[], temperature: number): number[] {
    const expScores = scores.map((s) => Math.exp(s / temperature));
    const sum = expScores.reduce((a, b) => a + b, 0);
    return expScores.map((e) => e / sum);
  }

  private sample(probabilities: number[]): number {
    const rand = Math.random();
    let cumulative = 0;

    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];
      if (rand <= cumulative) return i;
    }

    return 0; // Fallback to first
  }

  private buildReason(selected: any, envelope: StrategicEnvelope): string {
    const reasons: string[] = [];

    // Add factor contributions
    reasons.push(selected.justification);

    // Add override reasons
    if (envelope.overrides.length > 0) {
      reasons.push(`Overrides: ${envelope.overrides.map((o) => o.reason).join(', ')}`);
    }

    return reasons.join(' | ');
  }

  private createForcedSelection(override: any, envelope: StrategicEnvelope): SelectionDetail {
    const forced = envelope.adjustedScores.find((s) => s.archetype === override.forcedArchetype);

    return {
      archetype: override.forcedArchetype,
      confidence: forced?.confidence || 0.9,
      reason: `FORCED: ${override.reason}`,
      factorBreakdown: forced?.factorBreakdown || ({} as any),
      alternatives: [],
      temperature: 0,
      fallbackMode: false,
      timestamp: new Date(),
    };
  }

  private createFallbackSelection(): SelectionDetail {
    logger.warn('No candidates available, using fallback');

    return {
      archetype: 'COACH',
      confidence: 0.3,
      reason: 'Fallback: No valid candidates',
      factorBreakdown: {} as any,
      alternatives: [],
      temperature: 1.0,
      fallbackMode: true,
      timestamp: new Date(),
    };
  }
}
