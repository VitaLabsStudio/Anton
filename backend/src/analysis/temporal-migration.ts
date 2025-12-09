import { getTemporalContext as getNewContext } from './temporal-intelligence.js';
import { temporalMultiplier } from '../workers/temporal-multiplier.js';
import { logger } from '../utils/logger.js';
import type { TemporalContext } from '../config/temporal-schema.js';

export const getTemporalContext = (date: Date = new Date()): TemporalContext => {
  const mode = process.env.TEMPORAL_MIGRATION_MODE || 'legacy_only';

  if (mode === 'legacy_only') {
    return getLegacyContextAdapted(date);
  }

  if (mode === 'new_only') {
    return getNewContext(date);
  }

  // Parallel mode: run both, use new, log diff
  const legacy = getLegacyContextAdapted(date);
  const newCtx = getNewContext(date);

  const diff = {
    multiplier_delta: Math.abs((legacy.monitoringMultiplier || 1) - (newCtx.monitoringMultiplier || 1)),
    legacy_multiplier: legacy.monitoringMultiplier,
    new_multiplier: newCtx.monitoringMultiplier,
    new_phase: newCtx.phase,
    legacy_reason: (legacy as any)._legacy_reason,
  };

  if (diff.multiplier_delta > 0.1) {
    logger.warn({ diff }, 'temporal_migration_discrepancy');
  }

  // In parallel mode, we return the NEW context to test it, 
  // OR the legacy one if we want to be safe?
  // The prompt says: "Parallel mode: run both, use new, log diff" -> "use new"
  // Wait, usually parallel mode implies using safe (legacy) but logging new.
  // "Use new" implies we are testing the new system in prod but logging diffs against old.
  // Actually, standard "shadow" mode is: use legacy, log new.
  // Standard "canary" / "parallel" might differ.
  // Prompt says: "return { context: newCtx, timestamp: date };"
  // So I will return newCtx.
  
  return newCtx;
};

function getLegacyContextAdapted(date: Date): TemporalContext {
  const legacy = temporalMultiplier.getContext(date);
  
  return {
    phase: legacy.multiplier > 1 ? 'peak_suffering' : 'normal', // Approximate mapping
    monitoringMultiplier: legacy.multiplier,
    matchedRules: [],
    archetypePreferences: [],
    archetypeWeights: [],
    keywordTargets: [],
    evaluatedAt: date.toISOString(),
    timezone: 'UTC', // Legacy was server time based
    localTime: date.toISOString(),
    cacheHit: false,
    _legacy_reason: legacy.reason,
  } as TemporalContext & { _legacy_reason?: string };
}
