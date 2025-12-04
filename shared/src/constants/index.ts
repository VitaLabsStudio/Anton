/**
 * Shared constants for Antone
 */

// Application constants
export const APP_NAME = 'Antone';
export const APP_VERSION = '1.0.0';

// Platform identifiers
export const PLATFORMS = {
  TWITTER: 'twitter',
  REDDIT: 'reddit',
  THREADS: 'threads',
} as const;

// Decision modes
export const DECISION_MODES = {
  AUTO_POST: 'AUTO_POST',
  APPROVE: 'APPROVE',
  SKIP: 'SKIP',
  ESCALATE: 'ESCALATE',
} as const;

// API rate limits (per minute)
export const RATE_LIMITS = {
  TWITTER: 50,
  REDDIT: 60,
  THREADS: 200,
} as const;

// Default timeouts (ms)
export const TIMEOUTS = {
  API_REQUEST: 30000,
  ANALYSIS: 5000,
  GENERATION: 10000,
} as const;
