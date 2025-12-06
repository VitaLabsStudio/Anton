import { describe, it, expect } from 'vitest';

import { detectOutliers, winsorizedMean } from '../../../src/utils/robust-statistics';

describe('winsorizedMean', () => {
  it('returns 0 for empty input', () => {
    expect(winsorizedMean([], 0.1)).toBe(0);
  });

  it('caps extremes using percentile trim', () => {
    const result = winsorizedMean([1, 2, 2, 3, 100], 0.2);
    expect(result).toBeCloseTo(2.4, 2);
  });

  it('handles negative percentile by clamping to 0', () => {
    const result = winsorizedMean([5, 7, 9], -0.2);
    expect(result).toBeCloseTo(7);
  });
});

describe('detectOutliers', () => {
  it('returns outlier indices using Tukey fences', () => {
    const outliers = detectOutliers([10, 12, 12, 13, 12, 80]);
    expect(outliers).toContain(5);
    expect(outliers.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty array when dataset too small', () => {
    expect(detectOutliers([1, 2, 3])).toEqual([]);
  });
});
