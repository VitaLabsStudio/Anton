# Temporal Intelligence Troubleshooting

## Common Issues

### 1. Monitoring Multiplier Not Affecting Frequency
**Symptoms**: Temporal context shows high multiplier (e.g., 3.0) but logs show `baseInterval` remains unchanged or polls occur at normal speed.
**Diagnosis**:
- Check `stream-monitor.ts` logs for `temporal_monitoring_adjusted`.
- Verify `TEMPORAL_MIGRATION_MODE` is not set to `legacy_only` if expecting new rules.
**Fix**: Ensure `StreamMonitorWorker` is correctly importing `getTemporalContext` and applying the multiplier logic.

### 2. Wrong Timezone / Rules Not Matching
**Symptoms**: Rules expected to match at 9am EST are matching at 2pm EST (or not matching).
**Diagnosis**:
- Check `TARGET_TIMEZONE` env var. Default is `America/New_York`.
- Check logs for `localTime` field in temporal context.
**Fix**: Set `TARGET_TIMEZONE` correctly in `.env`.

### 3. Rules Not Loading
**Symptoms**: Only default strategy is applied.
**Diagnosis**:
- Check logs for "temporal-rules.json not found".
- Verify `TEMPORAL_RULES_PATH` matches actual file location.
**Fix**: Ensure JSON file exists and path is correct.

### 4. Migration Discrepancies
**Symptoms**: `parallel` mode logs many warnings.
**Diagnosis**:
- Check `scripts/validate-temporal-migration.ts` output.
- Legacy system logic might differ from new rules.
**Fix**: Adjust new rules to match legacy behavior OR accept new behavior and ignore warnings if intended.
