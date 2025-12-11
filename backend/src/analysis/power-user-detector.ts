// Deprecated shim kept for backward compatibility.
export {
  TieredUserDetector,
  detectUserTier as detectPowerUser,
  detectUserTier,
  archetypesForTier,
  checkBioKeywords,
  POWER_TIERS,
  TIER_PRIORITY,
  TIER_RESPONSE_TARGETS,
  buildFollowUpPlan,
} from './tiered-user-detector.js';
export type { TierDetectionResult } from './tiered-user-detector.js';
