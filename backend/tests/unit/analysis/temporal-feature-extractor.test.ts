import '../../env-config';
import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';

import { TemporalFeatureExtractor } from '../../../src/analysis/temporal-feature-extractor.js';
import type { TemporalContext } from '../../../src/config/temporal-schema.js';

describe('TemporalFeatureExtractor', () => {
  const extractor = new TemporalFeatureExtractor('America/New_York');

  it('computes cyclical hour encoding', () => {
    const context: TemporalContext = {
      phase: 'normal',
      monitoringMultiplier: 1,
      sssThresholdAdjustment: 0,
      matchedRules: [],
      timezone: 'America/New_York',
      localTime: '2025-01-01T00:00:00-05:00',
    };

    const features = extractor.extract(context);
    expect(features.hour_sin).toBeCloseTo(0, 5);
    expect(features.hour_cos).toBeCloseTo(1, 5);
  });

  it('computes cyclical day encoding for Sunday', () => {
    const context: TemporalContext = {
      phase: 'normal',
      monitoringMultiplier: 1,
      sssThresholdAdjustment: 0,
      matchedRules: [],
      timezone: 'America/New_York',
      localTime: '2025-01-05T12:00:00-05:00', // Sunday
    };

    const features = extractor.extract(context);
    expect(features.day_sin).toBeCloseTo(0, 5);
    expect(features.day_cos).toBeCloseTo(1, 5);
    expect(features.is_weekend).toBe(1);
  });

  it('sets phase one-hot flags correctly', () => {
    const context: TemporalContext = {
      phase: 'prevention',
      monitoringMultiplier: 1.5,
      sssThresholdAdjustment: -0.1,
      matchedRules: ['thursday_prevention'],
      timezone: 'America/New_York',
      localTime: '2025-01-02T18:00:00-05:00',
      isPriority: true,
    };

    const features = extractor.extract(context);
    expect(features.phase_prevention).toBe(1);
    expect(features.phase_peak).toBe(0);
    expect(features.phase_normal).toBe(0);
    expect(features.is_priority).toBe(1);
  });
});
