# ADR-005: Interaction Terms in the Decision Engine

**Status:** Accepted

## Context
SSS (signal sentiment score) and ARS (author relationship score) often reinforce each other when loyal authors explicitly request help. EVS (velocity) and TRS (topical relevance) both spike when content goes viral in a relevant thread. The naive linear combination of the four core signals misses these multiplicative effects.

## Decision
Introduce two interaction terms: `SSS × ARS` and `EVS × TRS`. Each interaction weight is configurable via the segmented weights table to allow data teams to tune joint behaviors. The interactions are incorporated into the composite score as additional additive terms after the normalized signal weights.

## Consequences
- Captures loyal-helpful intent when SSS and ARS are both high.
- Rewards highly relevant viral content with a bonus (EVS × TRS). 
- Requires additional validation and monitoring since interaction weights can introduce nonlinearity; the validation pipeline now enforces weights are finite and non-negative.
- Interaction contributions are tracked with `weights_validation_failure_count` so regressions trigger alerts.
