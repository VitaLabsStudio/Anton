/**
 * Robust statistical helpers to prevent skew from extreme outliers.
 */

const MIN_PERCENTILE = 0;
const MAX_PERCENTILE = 0.5;

/**
 * Calculates a winsorized mean by capping values at the lower/upper percentile bounds.
 * Defaults to a 10% trim on each end.
 */
export function winsorizedMean(values: number[], percentile: number = 0.1): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  const clampedPercentile = Math.min(Math.max(percentile, MIN_PERCENTILE), MAX_PERCENTILE);
  const sorted = [...values].sort((a, b) => a - b);

  const trimCount = Math.floor(sorted.length * clampedPercentile);
  const lowerBound = sorted[Math.min(trimCount, sorted.length - 1)];
  const upperBound = sorted[Math.max(sorted.length - trimCount - 1, 0)];

  const winsorized = sorted.map((value) => {
    if (value < lowerBound) return lowerBound;
    if (value > upperBound) return upperBound;
    return value;
  });

  const total = winsorized.reduce((sum, value) => sum + value, 0);
  return total / winsorized.length;
}

/**
 * Detect outlier indices using Tukey's method (IQR fences).
 */
export function detectOutliers(values: number[]): number[] {
  if (values.length < 4) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const iqr = q3 - q1;

  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  const outlierIndices: number[] = [];
  values.forEach((value, index) => {
    if (value < lowerFence || value > upperFence) {
      outlierIndices.push(index);
    }
  });

  return outlierIndices;
}

function percentile(sortedValues: number[], fraction: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const rank = fraction * (sortedValues.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  const weight = rank - lowerIndex;

  return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight;
}
