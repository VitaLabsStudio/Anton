import { logger } from './logger.js';

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterPercent: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  jitterPercent: 0.2,
};

export interface RetryContext {
  isCircuitBreakerOpen: () => boolean;
}

function isTransientError(error: unknown): boolean {
  const err = error as { statusCode?: number; code?: string };

  // Network errors
  if (err.code && ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'].includes(err.code)) {
    return true;
  }

  // HTTP 5xx errors
  if (err.statusCode && err.statusCode >= 500) {
    return true;
  }

  // HTTP 429 (rate limit)
  if (err.statusCode === 429) {
    return true;
  }

  // 4xx errors are not transient
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    return false;
  }

  // Unknown errors without status code - assume transient
  if (!err.statusCode && !err.code) {
    return true;
  }

  return false;
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: 1s → 2s → 4s
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter (±20% by default) to prevent thundering herd
  const jitterRange = cappedDelay * config.jitterPercent;
  const jitter = (Math.random() * 2 - 1) * jitterRange;

  return Math.max(0, Math.round(cappedDelay + jitter));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  context?: RetryContext,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 1; attempt <= mergedConfig.maxRetries + 1; attempt++) {
    // Check circuit breaker before each attempt (if context provided)
    if (context?.isCircuitBreakerOpen()) {
      logger.warn('Retry skipped: circuit breaker is OPEN');
      throw lastError || new Error('Circuit breaker is OPEN');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if this is the last attempt
      if (attempt > mergedConfig.maxRetries) {
        logger.error(
          { attempt, maxRetries: mergedConfig.maxRetries, error },
          'All retry attempts exhausted'
        );
        throw error;
      }

      // Only retry on transient errors
      if (!isTransientError(error)) {
        logger.debug({ error }, 'Non-transient error, not retrying');
        throw error;
      }

      const delay = calculateDelay(attempt, mergedConfig);
      logger.warn(
        { attempt, maxRetries: mergedConfig.maxRetries, delayMs: delay, error },
        'Transient error, retrying'
      );

      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError;
}

export { isTransientError, calculateDelay };
