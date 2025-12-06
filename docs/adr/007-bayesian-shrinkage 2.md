# ADR-007: Bayesian Shrinkage for Segment Weights

**Status:** Accepted

## Context
Some segments have sparse historical data, and relying solely on their weight estimates led to volatile decisions. A hard sample-size cutoff can flip behavior abruptly.

## Decision
Apply a shrinkage factor `n / (n + minSampleSize)` when blending segment weights with global defaults. The factor smoothly favors the global mix when `n` is small and gradually trusts the segment as more data arrives. `minSampleSize` is configurable through `decision-thresholds.yaml` and is treated as both a shrinkage pivot and a floor for default weights.

## Consequences
- Prevents noisy segments from dominating decisions.
- Smooth transitions allow QA to reason about behavior across versions.
- The validation pipeline now enforces that `sampleSize` is positive/finite; otherwise, the defaults are used and `weights_validation_failure_count` is incremented.
