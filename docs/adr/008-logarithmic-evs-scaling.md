# ADR-008: Logarithmic EVS Scaling

**Status:** Accepted

## Context
Previous versions capped EVS by clamping `ratio / 5`, which compressed viral extremes and made scores indistinguishable above a threshold. This hurt the engine's ability to differentiate between large spikes and subtle increases.

## Decision
Normalize EVS with `log10(ratio + 1) / log10(101)`. This maps a ratio of 0 to 0 and saturates at 1 when the ratio is 100. The shape preserves gradations for both small and massive virality.

## Consequences
- Mega-viral posts can still influence the composite score without causing runaway behavior.
- Analysts can backfill how EVS contributes because the curve is documented.
- The decision engine still guards against NaN/Infinity values when `evs.ratio` is missing or malformed.
