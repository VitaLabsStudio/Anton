# ADR 009: Probabilistic Archetype Scoring vs Rule-Based Selection

**Date:** 2025-12-07  
**Status:** PROPOSED  
**Author:** Winston (Architect)  
**Context:** Story 2.10 (Archetype Selection Engine)

## 1. Problem

The existing selector relies on rule cascades and random choice within a filtered pool. This approach fails the new requirements:
* Inflexible when signals conflict (mode vs author context vs conversation state).
* Cannot provide explainable factor breakdown or confidence levels.
* Breaks down when new archetypes or signals are introduced—rules must be rewritten manually.

## 2. Decision

Adopt a **probabilistic multi-factor scoring model**:
1. Compute eight factor scores per archetype (mode alignment, semantic resonance, persona fit, competitor counter strategy, conversation state, performance memory, safety, rotation).
2. Apply dynamic weights (per mode/platform) to produce a composite score.
3. Select archetypes via temperature-scaled weighted sampling of the top-N candidates, emitting both winning archetype and ranked alternatives.

## 3. Rationale

* **Continuous Adjustments:** Weighted scoring handles nuance better than binary allow/deny rules.
* **Explainability:** Factor contributions can be exposed directly to dashboards and telemetry, meeting “explainable scoring” requirement.
* **Extensibility:** Adding a new signal means defining its factor scorer and weight, not rewriting rule trees.
* **Graceful Degradation:** If certain signals are missing, weights can be redistributed or factors skipped without total failure.

## 4. Consequences

**Benefits**
* Able to express partial preferences (e.g., “prefer” vs “must”).
* Rotation and performance history become additive penalties instead of brittle filters.
* Enables downstream learning loop to adjust weights statistically.

**Costs / Risks**
* Requires careful tuning of weights and normalization to avoid domination by a single factor.
* Implementation complexity is higher than simple conditionals; requires monitoring (temperature, entropy).

## 5. Status & Follow-up

* Implement scoring module with pluggable weight profiles stored in `config/archetype-scoring.yaml`.
* Add metrics for score variance and selection entropy to ensure the model behaves as expected.
