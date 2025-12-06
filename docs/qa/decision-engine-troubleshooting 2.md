# Decision Engine Troubleshooting Guide

## Common Signals

- **Weight validation failures**: Metrics `decision_weights_validation_failure_total` > 0. Check segmented weights for negative values or sums != 1.0 and verify `sampleSize > 0`.
- **NaN/Infinity detections**: Metrics `decision_nan_infinity_detected_total` or clamping counters increment. Inspect upstream signal responses for missing/invalid numbers; ensure fallbacks are configured.
- **Circuit breaker opens**: Metrics `decision_breaker_state_open_total` spikes. Validate upstream APIs (linguistic, author, velocity, semantic, safety) and confirm timeouts (5s) are sufficient.
- **Cache hit-rate drops**: `decision_weight_cache_hits_total` low and misses rising. Confirm `timeOfDay` normalization inputs and cache TTL; warm cache per platform/time window if needed.
- **Latency regression**: `decision_latency_ms_p95` or buckets trend upward. Check upstream dependency latency, database contention, or breaker timeouts.

## Quick Checks

- Call `GET /metrics?format=json` for cache stats, breaker states, and latency snapshot.
- Validate YAML thresholds with `pnpm test` (Zod validation fails fast on invalid keys/values).
- Ensure migrations for segmented weights and decision indexes are applied before running integration tests.

## Recovery Playbook

1. **Breaker storm**: Lower traffic, increase breaker reset timeout temporarily, and verify upstream health before re-enabling.
2. **Bad weight records**: Disable the offending segment by setting sample size to 0 or removing the record; defaults will backstop decisions.
3. **Confidence spikes**: If many decisions are flagged for review, revisit `confidenceThreshold` and near-threshold tolerance; verify signal confidences are emitted.
4. **Cache churn**: Increase TTL or reduce `timeOfDay` granularity if cache churn is platform-specific; monitor hit-rate improvements.
