# Decision Engine Math & Usage

## Core Formulas

- **EVS normalization**: `evsNormalized = log10(ratio + 1) / log10(101)` (0–1, preserves 10×/100× viral lift).
- **Bayesian shrinkage**: `shrinkage = sampleSize / (sampleSize + minSampleSize)`; blended weight = `shrinkage * segment + (1 - shrinkage) * global` for base and interaction weights.
- **Composite score**: `composite = sss*w_sss + ars*w_ars + evsNorm*w_evs + trs*w_trs + (sss*ars)*w_sssArs + (evsNorm*trs)*w_evsTrs`.
- **Mode logits**: per-mode linear combination of signals; probabilities = `softmax(logits)` then gated to selected mode after safety/TRS checks.
- **Credible interval**: variance = `DEFAULT_VARIANCE * (1 - sampleFactor) * (1 - avgConfidence)` with `sampleFactor = min(sampleSize / minSampleSize, 1)`; CI = `composite ± 1.96 * sqrt(variance)` clamped to `[0,1]`.

## Operational Notes

- **Gates**: Safety and TRS gates short-circuit to `DISENGAGED` with deterministic probabilities.
- **Confidence**: `modeConfidence` = `probabilities[selectedMode]`; `needsReview` when confidence < `confidenceThreshold + reviewConfidenceDelta` or near thresholds.
- **Caching**: Weight cache keyed by `platform_timeOfDay` with 10-minute TTL; validation enforces non-negative weights summing to `1.0 ± 0.001`.

## Usage Example

```typescript
import { DecisionEngine, DEFAULT_THRESHOLDS } from '@/analysis/decision-engine';

const engine = new DecisionEngine({ thresholds: DEFAULT_THRESHOLDS });
const decision = await engine.analyzePost(post, author);

console.log(decision.mode, decision.modeConfidence, decision.compositeCredibleInterval);

// Observability
const metricsText = await fetch('http://localhost:3000/metrics').then((r) => r.text());
const health = await fetch('http://localhost:3000/metrics?format=json').then((r) => r.json());
```

## Threshold Tuning Tips

- Raise `sssHelpful` to reduce false positives for HELPFUL; lower to increase coverage.
- Increase `confidenceThreshold` if you prefer more human review; decrease for higher autonomy.
- Adjust `minSampleSize` when segment data is sparse to lean harder on global weights.
