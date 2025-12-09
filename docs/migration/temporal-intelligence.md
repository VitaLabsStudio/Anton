# Temporal Intelligence Migration Plan

## Overview
This document outlines the strategy for migrating from the legacy hardcoded `temporal-multiplier.ts` system to the new rule-based `TemporalIntelligence` engine.

## Migration Phases

### Phase 1: Parallel Execution (Week 1)
- **Configuration**: Set `TEMPORAL_MIGRATION_MODE=parallel` in `.env`.
- **Behavior**: The system runs both legacy and new engines for every request.
- **Output**: The application uses the **New System** output but logs warnings if it deviates significantly (> 0.1 delta) from the legacy system.
- **Action**: Monitor logs for `temporal_migration_discrepancy`. Tune rules in `backend/src/config/temporal-rules.json` to match desired behavior or accept improvements.

### Phase 2: Canary Rollout (Week 2-3)
- **Configuration**: Set `TEMPORAL_MIGRATION_MODE=new_only` for a subset of workers or instances (if possible), or simply proceed if Phase 1 showed high agreement/improvement.
- **Validation**: Run `scripts/validate-temporal-migration.ts` to ensure logic remains sound.

### Phase 3: Full Cutover (Week 4)
- **Configuration**: Set `TEMPORAL_MIGRATION_MODE=new_only` globally.
- **Cleanup**: Remove `temporal-multiplier.ts` and `temporal-migration.ts` wrapper. Update imports to use `temporal-intelligence.ts` directly.

## Rollback Plan
If critical issues arise:
1. Revert `TEMPORAL_MIGRATION_MODE` to `legacy_only`.
2. Restart services.

## Validation Script
Run `npx tsx scripts/validate-temporal-migration.ts` to perform a statistical comparison of the two systems over a simulated week.
