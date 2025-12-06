# ADR-006: Configurable Mode Selection Thresholds

**Status:** Accepted

## Context
Hard-coding thresholds for `ssHelpful`, `ssModerate`, `evsHighViral`, etc., made tuning brittle and prevented quick experimentation. QA called out that threshold tuning should be surfaced to product teams and environment-specific deployments.

## Decision
Store all thresholds in `config/decision-thresholds.yaml` and layer optional overrides per environment (`.development`, `.staging`, `.production`). The file is parsed with schema validation (`zod`) so invalid YAML logs an error and the engine falls back to defaults. `DecisionThresholds` drives both gating (safety/TRS/power user tiers) and review flagging (`confidenceThreshold`, `nearThresholdTolerance`).

## Consequences
- Enables A/B teams to adjust thresholds without touching code.
- Health endpoints and metrics can reference the current thresholds for diagnostics.
- Additional YAML files must be kept in sync with the schema, so the config loader now warns when a file is missing or unparsable.
