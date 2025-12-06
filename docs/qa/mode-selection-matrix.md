# Mode Selection Exhaustive Matrix

This document summarizes the 4,480-scenario matrix that validates the deterministic gating and probabilistic mode selection inside `DecisionEngine.selectMode()`.

| Variable | Levels |
| --- | --- |
| SSS | 0.1, 0.4, 0.54, 0.55, 0.7, 0.81, 0.82, 0.9 |
| ARS | 0.2, 0.5, 0.69, 0.70, 0.85 |
| EVS | 0.5, 1.0, 1.9, 2.0, 4.9, 5.0, 10.0 |
| TRS | 0.3, 0.49, 0.50, 0.8 |
| Safety | false, true |
| Power user | false, true |

Every combination is exercised by `backend/tests/unit/analysis/decision-engine.matrix.test.ts`. The test enforces the following invariants:

1. **Safety gate**: `mode` must be `DISENGAGED` whenever `safety.shouldDisengage` is true.
2. **TRS gate**: TRS below `thresholds.trsGate` yields `DISENGAGED` regardless of other signals.
3. **Power-user priority**: When `powerUser.isPowerUser` is true, the branch and thresholds are:
   - `SSS >= 0.70` → `HELPFUL`
   - Else if `EVS > 3` → `HYBRID`
   - Else → `ENGAGEMENT`
4. **Intent hierarchy**: For non power users the tree is:
   - `SSS >= thresholds.sssHelpful` → `HELPFUL`
   - `EVS > thresholds.evsHighViral` → `HYBRID` (if `ARS > thresholds.arsStrong`) or `ENGAGEMENT`/`DISENGAGED` depending on `SSS`.
   - `SSS >= thresholds.sssModerate` → `ENGAGEMENT` or `HYBRID` (if `ARS > thresholds.arsStrong`).
   - `EVS > thresholds.evsModerateViral` → `ENGAGEMENT`.
   - Failing all gates → `DISENGAGED`.
5. **Probability consistency**: For every scenario, the gated probabilities sum to 1. The probability of the selected mode remains greater than zero, aligning `modeConfidence` with the deterministic branch.

Results: No unexpected mode transitions or probability drift were observed across the entire matrix. The exhaustive test serves as both a regression guardrail and a living document for the stability of the priority tree.
