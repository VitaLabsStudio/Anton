# ADR 011: Semantic Analysis Approach (Hybrid LLM + ML)

**Date:** 2025-12-07  
**Status:** PROPOSED  
**Author:** Winston (Architect)  
**Context:** Story 2.10 (Archetype Selection Engine)

## 1. Problem

Story 2.10 requires semantic content analysis covering emotion, urgency, misinformation risk, humor detection, and intent cues. Options:
* **Pure regex / heuristics:** Fast but insufficient for nuanced tone detection.
* **Traditional ML classifiers:** Efficient but brittle for emerging memes or edge cases.
* **LLM-only prompts:** Accurate but high latency and cost; difficult to guarantee consistent structured output.

## 2. Decision

Adopt a **hybrid architecture**:
1. Use a lightweight hosted LLM (e.g., DeepSeek, Claude) with carefully crafted prompt to extract structured semantic descriptors (emotion vector, urgency type, humor flag, misinformation rationale). Cache outputs per post.
2. Feed LLM output plus raw text to specialized ML classifiers (toxicity, misinformation probability, sarcasm) trained on internal datasets for calibration and guardrails.
3. Fuse results via `SemanticProfilePipeline`, which reconciles discrepancies (e.g., clamp misinformation probability to max(LLM_confidence, ML_probability)).

## 3. Rationale

* **Accuracy + Cost Balance:** LLM handles nuanced interpretation; smaller ML models provide consistent scoring and fast validation.
* **Explainability:** LLM provides textual rationale, while ML models supply quantitative scores—perfect for explainable factors.
* **Resilience:** If LLM temporarily unavailable, ML outputs still exist; conversely, ML false positives can be tempered by LLM rationale.

## 4. Consequences

**Benefits**
* Meets requirement for “semantic content analysis (emotion, urgency, misinformation risk ML-based)” by combining strengths.
* Scales via caching and asynchronous enrichment (LLM is invoked once per post, reused for thread replies).

**Costs / Risks**
* Requires orchestration to merge two sources and reconcile conflicts.
* LLM latency could impact P95 response; mitigated via async pre-processing and cached embeddings.

## 5. Implementation Notes

* Define canonical schema: `SemanticProfile = { emotions: Record<string, number>, urgency: number, humor: number, misinformation_prob: number, rationale: string, confidence: number }`.
* Expose pipeline metrics (latency, cache hits, fallback activations).
* Ensure redaction / privacy compliance when sending content to external LLM—strip PII before request.
