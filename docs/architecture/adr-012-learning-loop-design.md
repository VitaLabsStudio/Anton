# ADR 012: Learning & Adaptation Loop Design

**Date:** 2025-12-07  
**Status:** PROPOSED  
**Author:** Winston (Architect)  
**Context:** Story 2.10 (Archetype Selection Engine)

## 1. Problem

Story 2.10 mandates performance tracking and weight optimization. The team needs a repeatable way to learn from engagement outcomes without destabilizing live decisions or introducing opaque black-box behavior.

## 2. Decision

Implement a **two-phase learning loop**:
1. **Online Telemetry Capture:** Every selection emits `SelectionDetail` (chosen archetype, alternative ranking, factor scores, overrides) plus eventual engagement metrics (clicks, replies, dwell time). Stored in analytics warehouse + Kafka topic.
2. **Offline Optimizer Job:** Nightly job aggregates outcomes by audience cluster, mode, and platform to compute weight delta suggestions using constrained gradient updates (±10% per iteration, trust-region style). Updates stored in versioned config (`weights_v{n}.json`) and rolled out via feature flag with rollback.

## 3. Rationale

* **Safety:** Offline optimization avoids real-time oscillations and allows human review before deployment.
* **Explainability:** Weight changes are explicit diffs in config files, so decisions remain debuggable.
* **Data Efficiency:** Aggregating per cluster ensures enough samples for reliable deltas while respecting privacy.

## 4. Consequences

**Benefits**
* Supports experimentation (A/B testing of weight sets).
* Provides audit trail of every change, enabling correlation between performance shifts and weight adjustments.

**Costs / Risks**
* Requires job orchestration (Temporal or cron) plus analytics queries.
* Learning is not instant; improvements land after nightly cycle.

## 5. Implementation Notes

* Persist telemetry in `decision_outcomes` table keyed by `selection_id`.
* Nightly optimizer pipeline:
  1. Pull last N days of outcomes (default 7).
  2. Compute gradient-like adjustments per factor weight by minimizing loss `(target_engagement - actual)`.
  3. Clamp adjustments, write new config + change log.
  4. Notify Architect channel for review before activation.
* Include fallback: if optimizer produces unstable result (e.g., variance > threshold), revert to previous weight set automatically.
