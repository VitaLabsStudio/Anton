# ADR 010: Competitor Context Handling in Archetype Selection

**Date:** 2025-12-07  
**Status:** PROPOSED  
**Author:** Winston (Architect)  
**Context:** Story 2.10 (Archetype Selection Engine)

## 1. Problem

The decision engine encounters posts that already contain competitor narratives. Previous design ignored competitor archetypes, leading to tone mismatches or reinforcing competitor positions. The new story requires detecting competitor strategies and recommending counter approaches.

## 2. Decision

Introduce a dedicated **Competitor Strategy Engine** that:
1. Consumes competitor signals (handles, hashtags, referenced slogans) and conversation participants.
2. Maps detected competitor moves to our archetype counter-strategy taxonomy (`competitor_archetype → recommended weight deltas`).
3. Feeds the Multi-Factor Scoring Matrix via Factor F4 to bias selection toward archetypes that best neutralize or differentiate from the competitor position.
4. Emits explainable metadata (detected competitor, confidence, recommended counter) for auditing.

## 3. Rationale

* **Strategic Differentiation:** Countering aggressive or misinformation-heavy competitor tactics requires specific archetypes (e.g., Myth-bust with evidence, or empathetic Coach) rather than generic helpful replies.
* **Explainability:** Representing competitor handling as its own factor enables dashboards to show why a certain archetype was chosen (“Competitor pushing fear-based story → boosted Credibility Anchor”).
* **Modularity:** Encapsulating competitor logic prevents contamination of other scoring factors and allows independent tuning or disablement if signals are sparse.

## 4. Consequences

**Benefits**
* Enables targeted responses that protect brand voice and positioning.
* Supports future experiments (A/B counter strategies) by tweaking weight deltas.
* Provides hooks for safety team to prioritize counters when misinformation detected from competitor sources.

**Costs / Risks**
* Requires building and maintaining a competitor taxonomy plus heuristics/ML detectors.
* False positives could mis-weight selection; mitigated by confidence thresholds and fallback to neutral weighting.

## 5. Implementation Notes

* Store competitor detection outputs in Redis for short TTL (30 minutes) to avoid reprocessing the same thread.
* Provide manual override table (feature flag) to disable competitive bias for regulated contexts if needed.
