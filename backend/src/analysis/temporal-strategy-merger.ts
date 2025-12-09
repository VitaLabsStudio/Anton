import type { TemporalStrategy } from '../config/temporal-schema.js';
import type { MatchedRule } from './temporal-rule-engine.js';

export const defaultStrategy: TemporalStrategy = {
  phase: 'normal',
  monitoringMultiplier: 1.0,
  archetypePreferences: [],
  archetypeWeights: [],
  toneAdjustment: 'neutral',
  sssThresholdAdjustment: 0,
  isPriority: false,
  keywordTargets: [],
};

export class StrategyMerger {
  merge(matches: MatchedRule[]): TemporalStrategy {
    // Apply lowest priority first so higher priority matches overwrite fields.
    const merged = [...matches]
      .sort((a, b) => a.priority - b.priority)
      .reduce<TemporalStrategy>(
        (acc, match) => ({ ...acc, ...match.strategy }),
        { ...defaultStrategy }
      );

    // Ensure archetypePreferences and weights are consistent if one is provided without the other
    if (merged.archetypePreferences && merged.archetypeWeights) {
      if (merged.archetypePreferences.length !== merged.archetypeWeights.length) {
        merged.archetypeWeights = [];
      }
    } else if (merged.archetypePreferences && !merged.archetypeWeights) {
      merged.archetypeWeights = [];
    }

    return merged;
  }
}
