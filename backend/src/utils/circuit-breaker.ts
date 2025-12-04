import { logger } from './logger.js';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  threshold: number;
  timeout: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: number = 0;
  private lastFailure: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.config.timeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker entering HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error: unknown) {
      if (this.isSystemicError(error)) {
        this.onFailure();
      } else {
        logger.debug({ error }, 'Client error, not counting towards circuit breaker');
      }
      throw error;
    }
  }

  private isSystemicError(error: unknown): boolean {
    const err = error as { statusCode?: number; code?: string };
    if (!err.statusCode && !err.code) return true;
    if (err.code && ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'].includes(err.code)) return true;
    if (err.statusCode && err.statusCode >= 500) return true;
    if (err.statusCode === 429) return true;
    if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) return false;
    return true;
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info('Circuit breaker CLOSED after successful recovery');
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    logger.warn(`Circuit breaker failure count: ${this.failures}/${this.config.threshold}`);
    if (this.failures >= this.config.threshold) {
      this.state = 'OPEN';
      logger.error(`Circuit breaker OPEN after ${this.failures} systemic failures`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }
}
