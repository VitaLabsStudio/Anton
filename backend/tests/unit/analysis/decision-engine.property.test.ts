import fc from 'fast-check';
import { vi } from 'vitest';

import {
  DecisionEngine,
  DEFAULT_THRESHOLDS,
  DEFAULT_WEIGHTS,
} from '../../../src/analysis/decision-engine.js';

vi.mock('../../../src/utils/prisma.js', () => ({
  prisma: {
    segmentedWeight: { findUnique: vi.fn(async () => null) },
    decision: { create: vi.fn(async () => null) },
    post: { update: vi.fn(async () => null) },
    archetype: { findUnique: vi.fn(async () => null) },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<void>) => cb({})),
  },
}));

const baseThresholds = { ...DEFAULT_THRESHOLDS, minSampleSize: 10 };

function createPrismaStub() {
  const stub: Record<string, unknown> = {
    segmentedWeight: { findUnique: vi.fn(async () => null) },
    decision: { create: vi.fn(async () => null) },
    post: { update: vi.fn(async () => null) },
    archetype: { findUnique: vi.fn(async () => ({ id: 'arch-1', name: 'general' })) },
    $transaction: undefined,
  };
  (stub as any).$transaction = vi.fn(async (callback: (tx: typeof stub) => Promise<void>) =>
    callback(stub)
  );
  return stub;
}
const templateTemporal = {
  context: { multiplier: 1, dayOfWeek: 0, hour: 0, reason: 'test' },
  timestamp: new Date(),
};

function buildSignals(sss: number, ars: number, evs: number, trs: number) {
  return {
    sss: { score: sss, confidence: 0.5, category: 'moderate' } as const,
    ars: { score: ars, confidence: 0.5, archetypes: [], interactionCount: 0 } as const,
    evs: {
      ratio: evs,
      category: 'normal',
      confidence: 0.5,
      baselineRate: 1,
      currentRate: evs,
      temporalContext: templateTemporal.context,
    } as const,
    trs: { score: trs, confidence: 0.5, context: 'actual_hangover' } as const,
    safety: { shouldDisengage: false, flags: [] },
    powerUser: { isPowerUser: false, confidence: 0.5 },
    competitor: { detected: false, name: null, confidence: 0 },
    temporal: templateTemporal,
  };
}

describe('DecisionEngine property invariants', () => {
  const engine = new DecisionEngine({
    thresholds: baseThresholds,
    prismaClient: createPrismaStub(),
  });

  it('keeps composite score within [0,1]', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1 }),
        fc.float({ min: 0, max: 1 }),
        fc.float({ min: 0, max: 10 }),
        fc.float({ min: 0, max: 1 }),
        (sss, ars, evs, trs) => {
          const weights = { ...DEFAULT_WEIGHTS, validationTimestamp: new Date() };
          const score = engine.calculateComposite(
            buildSignals(sss, ars, evs, trs).sss,
            buildSignals(sss, ars, evs, trs).ars,
            buildSignals(sss, ars, evs, trs).evs,
            buildSignals(sss, ars, evs, trs).trs,
            weights
          );
          return score >= 0 && score <= 1 && Number.isFinite(score);
        }
      )
    );
  });

  it('normalizes probabilities to 1', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1 }),
        fc.float({ min: 0, max: 1 }),
        fc.float({ min: 0, max: 10 }),
        fc.float({ min: 0, max: 1 }),
        (sss, ars, evs, trs) => {
          const { probabilities } = engine.selectMode(buildSignals(sss, ars, evs, trs));
          const sum = Object.values(probabilities).reduce((acc, value) => acc + value, 0);
          return Math.abs(sum - 1) < 1e-6;
        }
      )
    );
  });

  it('ensures shrinkage results sum to 1 when validated', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1 }),
        fc.float({ min: 0, max: 1 }),
        fc.float({ min: 0, max: 1 }),
        fc.float({ min: 0, max: 1 }),
        fc.integer({ min: 1, max: 1000 }),
        (sss, ars, evs, trs, sampleSize) => {
          const shrunk = engine.applyBayesianShrinkage(
            {
              sssWeight: sss,
              arsWeight: ars,
              evsWeight: evs,
              trsWeight: trs,
              segmentType: 'COMBINED',
              segmentKey: 'TEST',
              sampleSize,
            },
            DEFAULT_WEIGHTS
          );
          if (!shrunk.isValidated) {
            return true;
          }
          const sum = shrunk.sssWeight + shrunk.arsWeight + shrunk.evsWeight + shrunk.trsWeight;
          return Math.abs(sum - 1) <= 1e-3;
        }
      )
    );
  });

  it('keeps uncertainty interval bounded', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1 }),
        fc.float({ min: 0, max: 1 }),
        fc.float({ min: 0, max: 10 }),
        fc.float({ min: 0, max: 1 }),
        (sss, ars, evs, trs) => {
          const weights = { ...DEFAULT_WEIGHTS, validationTimestamp: new Date() };
          const composite = engine.calculateComposite(
            buildSignals(sss, ars, evs, trs).sss,
            buildSignals(sss, ars, evs, trs).ars,
            buildSignals(sss, ars, evs, trs).evs,
            buildSignals(sss, ars, evs, trs).trs,
            weights
          );
          const interval = engine.calculateUncertainty(
            buildSignals(sss, ars, evs, trs).sss,
            buildSignals(sss, ars, evs, trs).ars,
            buildSignals(sss, ars, evs, trs).evs,
            buildSignals(sss, ars, evs, trs).trs,
            weights,
            composite
          ).credibleInterval;
          const [lower, upper] = interval;
          return lower >= 0 && upper <= 1;
        }
      )
    );
  });
});
