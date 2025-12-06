# Decision Engine Uncertainty Quantification

## Why uncertainty matters
The decision engine must balance ambition with humility: it should act confidently when the signal mix is strong, and it should flag requests for human review when the statistical evidence is weak. This document walks through the mathematical and procedural safeguards that keep the composite score and operational mode grounded in validated inputs.

## Signal ingestion and defensive defaults
All signals (SSS, ARS, EVS, TRS, safety, power user, competitor, temporal context) are fetched through opossum-backed analyzers with fallbacks. Missing or problematic confidences default to `DEFAULT_CONFIDENCE` (0.5) and each score is validated via `validateScore()` so NaN/Infinity values or out-of-range scores are clamped before they pollute the downstream math.

## Weight handling and Bayesian shrinkage
Weights are looked up in order: combined segment → platform segment → global defaults. Each retrieved row can carry interaction weights (`sssArsInteraction`, `evsTrsInteraction`). When the segment sample size is small relative to `thresholds.minSampleSize`, a shrinkage factor `n / (n + minSampleSize)` blends the segment-specific weights with the global defaults so that unstable segments gravitate toward the global mix.

Validation enforces the following invariants before weights enter the calculation:
- The four base weights sum to `1.0` within ±0.001.
- All weights are finite and non-negative.
- Interaction weights are finite and non-negative.
Violations trigger metrics (`weights_validation_failure_count`) and fall back to the most recent validated defaults.

## Composite score formula
The composite score combines the normalized signal scores, each scaled by its configured weight, plus two interaction terms:

```
composite =
  sss * sssWeight +
  ars * arsWeight +
  evsNorm * evsWeight +
  trs * trsWeight +
  sss * ars * sssArsInteraction +
  evsNorm * trs * evsTrsInteraction
```

Where `evsNorm = log10(evsRatio + 1) / log10(101)` preserves small values while still allowing mega-viral posts to approach 1. All intermediate values are checked for NaN/Infinity; when the raw score escapes [0,1], it is clamped with audible warnings and the event is recorded via `composite_score_out_of_range` and `composite_score_clamped` metrics.

## Credible intervals and confidence
`calculateUncertainty()` derives a 95% credible interval around the composite score by:
1.  Validating the shard sample size (`weights.sampleSize`) and bounding it to `thresholds.minSampleSize` for stability.
2.  Averaging the confidences from every signal (missing confidences default to 0.5) to get `avgConfidence`.
3.  Deriving variance as `DEFAULT_VARIANCE * (1 - sampleFactor) * (1 - avgConfidence)`, where `sampleFactor = min(sampleSize / minSampleSize, 1)`. This favors stable segments and high-confidence data.
4.  Computing `stdDev = sqrt(variance)` and returning `[max(0, composite - 1.96 * stdDev), min(1, composite + 1.96 * stdDev)]`.

Any NaN or zero variances are reset to `DEFAULT_VARIANCE` with metric `nan_infinity_detected_count`. This keeps every interval finite, bounded, and traceable.

## Mode probabilities, review flags, and gating
Mode selection obeys a deterministic priority tree (safety gate, TRS gate, power-user branch, intent tiers) and then reuses the resulting `selectedMode` to gate softmaxed logits so that probabilities align with the deterministic choice. Near-threshold customers are flagged when either `sss` or the composite score is within `thresholds.nearThresholdTolerance` of a configured boundary (e.g., `sssHelpful`, `evsHighViral`). Review flags trigger when `modeConfidence` falls below `thresholds.confidenceThreshold` or when a low-confidence mode would override the deterministic path.

## Observable outputs
Every decision result exposes:
- `modeProbabilities` (softmaxed, gated) and `modeConfidence` (the probability of the selected mode).
- `compositeCredibleInterval` (95% interval) so downstream dashboards can show uncertainty bands.
- `needsReview` + `reviewReason` so humans know why the engine asked for help.

Metrics such as `nan_infinity_detected_count`, `weights_validation_failure_count`, `composite_score_out_of_range`, and `composite_score_clamped` make every guardrail visible.

## Next steps
Keeping this methodology in sync with the code requires:
1.  Re-running the matrix tests whenever thresholds change.
2.  Ensuring any new signal analyzer surfaces `confidence` and `sampleSize` so the uncertainty math can stay honest.
3.  Documenting all guardrails (see the companion monitoring guide) so on-call engineers can interpret gaps in the credible interval.
