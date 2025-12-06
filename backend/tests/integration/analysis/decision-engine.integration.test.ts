import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/utils/prisma.js', () => ({
  prisma: {
    segmentedWeight: { findUnique: vi.fn(async () => null) },
    decision: { create: vi.fn(async () => null) },
    post: { update: vi.fn(async () => null) },
    archetype: { findUnique: vi.fn(async () => null) },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<void>) => cb({})),
  },
}));

import {
  DecisionEngine,
  DEFAULT_THRESHOLDS,
} from '../../../src/analysis/decision-engine.js';

const baseThresholds = { ...DEFAULT_THRESHOLDS, minSampleSize: 50 };

describe('DecisionEngine integration behaviors', () => {
  it('caches weights and tracks cache metrics', async () => {
    const record = {
      sssWeight: 0.3,
      arsWeight: 0.3,
      evsWeight: 0.2,
      trsWeight: 0.2,
      segmentType: 'COMBINED',
      segmentKey: 'TWITTER_MORNING',
      sampleSize: 150,
    };

    const prisma = {
      segmentedWeight: { findUnique: vi.fn(async () => record) },
    };

    const increments: Array<{ name: string; tags?: Record<string, unknown> }> = [];
    const engine = new DecisionEngine({
      thresholds: baseThresholds,
      prismaClient: prisma,
      metrics: { increment: (name, tags) => increments.push({ name, tags }) },
      cacheTTLSeconds: 10,
      cacheCheckPeriodSeconds: 1,
    });

    const context = { platform: 'TWITTER', timeOfDay: 'MORNING' } as const;

    await engine.getWeights(context);
    await engine.getWeights(context);

    expect(prisma.segmentedWeight.findUnique).toHaveBeenCalledTimes(1);
    expect(increments.some((entry) => entry.name === 'weight_cache_miss')).toBe(true);
    expect(increments.some((entry) => entry.name === 'weight_cache_hit')).toBe(true);
  });

  it('falls back to global weights when validation fails', async () => {
    const invalidRecord = {
      sssWeight: 0.9,
      arsWeight: 0.9,
      evsWeight: 0.9,
      trsWeight: -1,
      segmentType: 'COMBINED',
      segmentKey: 'BADSEG',
      sampleSize: 10,
    };

    const prisma = {
      segmentedWeight: { findUnique: vi.fn(async () => invalidRecord) },
    };

    const increments: string[] = [];
    const engine = new DecisionEngine({
      thresholds: baseThresholds,
      prismaClient: prisma,
      metrics: { increment: (name) => increments.push(name) },
    });

    const context = { platform: 'TWITTER', timeOfDay: 'MORNING' } as const;
    const weights = await engine.getWeights(context);

    expect(weights.segmentType).toBe('GLOBAL');
    expect(increments).toContain('weights_validation_failure_count');
  });
});
