import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/utils/prisma.js', () => ({
  prisma: {
    segmentedWeight: { findUnique: vi.fn(async () => null) },
    archetype: { findUnique: vi.fn(async () => null) },
  },
}));

import { DecisionEngine, DEFAULT_THRESHOLDS } from '../../../src/analysis/decision-engine.js';

const sssLevels = [0.1, 0.4, 0.54, 0.55, 0.7, 0.81, 0.82, 0.9];
const arsLevels = [0.2, 0.5, 0.69, 0.7, 0.85];
const evsLevels = [0.5, 1.0, 1.9, 2.0, 4.9, 5.0, 10.0];
const trsLevels = [0.3, 0.49, 0.5, 0.8];
const safetyLevels = [true, false];
const powerUserLevels = [true, false];

const thresholds = { ...DEFAULT_THRESHOLDS, minSampleSize: 10 };

const engine = new DecisionEngine({ thresholds });

const combos = (() => {
  const out = [];
  for (const sss of sssLevels) {
    for (const ars of arsLevels) {
      for (const evs of evsLevels) {
        for (const trs of trsLevels) {
          for (const safety of safetyLevels) {
            for (const powerUser of powerUserLevels) {
              out.push({ sss, ars, evs, trs, safety, powerUser });
            }
          }
        }
      }
    }
  }
  return out;
})();

function buildSignals({ sss, ars, evs, trs, safety, powerUser }: (typeof combos)[number]) {
  return {
    sss: { score: sss, confidence: 0.8, category: 'moderate' },
    ars: { score: ars, confidence: 0.8, archetypes: [], interactionCount: 0 },
    evs: {
      ratio: evs,
      category: 'normal',
      confidence: 0.9,
      baselineRate: 1,
      currentRate: evs,
      temporalContext: { hoursSincePost: 1 },
    },
    trs: { score: trs, confidence: 0.85, context: 'actual_hangover' },
    safety: { shouldDisengage: safety, flags: [] },
    powerUser: { isPowerUser: powerUser, confidence: 0.9 },
    competitor: { detected: false, name: null, confidence: 0 },
    temporal: {
      context: { multiplier: 1, dayOfWeek: 0, hour: 0, reason: 'test' },
      timestamp: new Date(),
    },
  };
}

describe('DecisionEngine exhaustive mode matrix', () => {
  it('honors gating, priorities, and probability normalization across combos', () => {
    for (const combo of combos) {
      const result = engine.selectMode(buildSignals(combo));
      const { mode, probabilities } = result;

      const totalProb = Object.values(probabilities).reduce((sum, value) => sum + value, 0);
      expect(totalProb).toBeGreaterThanOrEqual(0.9999);
      expect(totalProb).toBeLessThanOrEqual(1.0001);
      expect(probabilities[mode]).toBeGreaterThan(0);

      if (combo.safety) {
        expect(mode).toBe('DISENGAGED');
        expect(probabilities.DISENGAGED).toBe(1);
        continue;
      }

      if (combo.trs < thresholds.trsGate) {
        expect(mode).toBe('DISENGAGED');
        continue;
      }

      if (combo.powerUser) {
        if (combo.sss >= 0.7) {
          expect(mode).toBe('HELPFUL');
        } else if (combo.evs > 3) {
          expect(mode).toBe('HYBRID');
        } else {
          expect(mode).toBe('ENGAGEMENT');
        }
        continue;
      }

      if (combo.sss >= thresholds.sssHelpful) {
        expect(mode).toBe('HELPFUL');
        continue;
      }

      if (combo.evs > thresholds.evsHighViral) {
        if (combo.ars > thresholds.arsStrong) {
          expect(mode).toBe('HYBRID');
        } else if (combo.sss >= thresholds.sssModerate) {
          expect(mode).toBe('ENGAGEMENT');
        } else {
          expect(mode).toBe('DISENGAGED');
        }
        continue;
      }

      if (combo.sss >= thresholds.sssModerate) {
        if (combo.ars > thresholds.arsStrong) {
          expect(mode).toBe('HYBRID');
        } else {
          expect(mode).toBe('ENGAGEMENT');
        }
        continue;
      }

      if (combo.evs > thresholds.evsModerateViral) {
        expect(mode).toBe('ENGAGEMENT');
        continue;
      }

      expect(mode).toBe('DISENGAGED');
    }
  });
});
