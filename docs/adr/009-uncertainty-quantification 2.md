# ADR-009: Decision Engine Uncertainty Quantification

**Status:** Accepted

## Context
The decision engine had no quantified notion of confidence, making it hard to explain why certain examples received review flags or why two similar posts produced different modes.

## Decision
Track a 95% credible interval around the composite score based on average signal confidence and segment sample size. Confidence defaults to 0.5 when missing, and small sample sizes revert to global priors via the shrinkage factor. Review flags (`LOW_CONFIDENCE`, `NEAR_THRESHOLD`) surface whenever `modeConfidence` dips below `confidenceThreshold` or the composite/SSS scores are within `nearThresholdTolerance` of an important boundary.

## Consequences
- Product stakeholders can visualize uncertainty as `compositeCredibleInterval` and `modeProbabilities` in dashboards.
- The new metrics (e.g., `nan_infinity_detected_count`, `mode_confidence_distribution`) make guardrails auditable.
- The uncertainty math requires every new signal to expose a `confidence` so that missing data doesn’t artificially tighten intervals.
