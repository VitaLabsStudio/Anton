import { describe, it, expect, vi, beforeEach } from 'vitest';

import { withRetry, isTransientError, calculateDelay } from '../src/utils/retry';

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Retry Utility', () => {
  describe('isTransientError', () => {
    it('should identify network errors as transient', () => {
      expect(isTransientError({ code: 'ECONNREFUSED' })).toBe(true);
      expect(isTransientError({ code: 'ETIMEDOUT' })).toBe(true);
      expect(isTransientError({ code: 'ENOTFOUND' })).toBe(true);
      expect(isTransientError({ code: 'ECONNRESET' })).toBe(true);
    });

    it('should identify 5xx errors as transient', () => {
      expect(isTransientError({ statusCode: 500 })).toBe(true);
      expect(isTransientError({ statusCode: 502 })).toBe(true);
      expect(isTransientError({ statusCode: 503 })).toBe(true);
      expect(isTransientError({ statusCode: 504 })).toBe(true);
    });

    it('should identify 429 rate limit as transient', () => {
      expect(isTransientError({ statusCode: 429 })).toBe(true);
    });

    it('should NOT identify 4xx client errors as transient', () => {
      expect(isTransientError({ statusCode: 400 })).toBe(false);
      expect(isTransientError({ statusCode: 401 })).toBe(false);
      expect(isTransientError({ statusCode: 403 })).toBe(false);
      expect(isTransientError({ statusCode: 404 })).toBe(false);
    });

    it('should treat errors without statusCode or code as transient', () => {
      expect(isTransientError(new Error('Unknown error'))).toBe(true);
      expect(isTransientError({})).toBe(true);
    });
  });

  describe('calculateDelay', () => {
    it('should use exponential backoff', () => {
      // Note: Jitter makes exact values unpredictable, so we check ranges
      const config = { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 10000, jitterPercent: 0 };

      expect(calculateDelay(1, config)).toBe(1000); // 1s
      expect(calculateDelay(2, config)).toBe(2000); // 2s
      expect(calculateDelay(3, config)).toBe(4000); // 4s
    });

    it('should cap delay at maxDelayMs', () => {
      const config = { maxRetries: 10, baseDelayMs: 1000, maxDelayMs: 5000, jitterPercent: 0 };

      expect(calculateDelay(10, config)).toBe(5000); // Capped at 5s, not 512s
    });

    it('should add jitter within expected range', () => {
      const config = { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 10000, jitterPercent: 0.2 };

      // With 20% jitter, delay should be between 800ms and 1200ms for first attempt
      for (let i = 0; i < 20; i++) {
        const delay = calculateDelay(1, config);
        expect(delay).toBeGreaterThanOrEqual(800);
        expect(delay).toBeLessThanOrEqual(1200);
      }
    });
  });

  describe('withRetry', () => {
    it('should return result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient error and succeed', async () => {
      const error = new Error('Server error');
      (error as any).statusCode = 500;

      const fn = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const result = await withRetry(fn, undefined, {
        baseDelayMs: 10, // Fast for testing
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should NOT retry on non-transient error', async () => {
      const error = new Error('Bad request');
      (error as any).statusCode = 400;

      const fn = vi.fn().mockRejectedValue(error);

      await expect(withRetry(fn)).rejects.toThrow('Bad request');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries exhausted', async () => {
      const error = new Error('Server error');
      (error as any).statusCode = 500;

      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        withRetry(fn, undefined, {
          maxRetries: 2,
          baseDelayMs: 10,
        })
      ).rejects.toThrow('Server error');

      expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should skip retry if circuit breaker is open from start', async () => {
      const context = {
        isCircuitBreakerOpen: vi.fn().mockReturnValue(true),
      };

      const fn = vi.fn().mockResolvedValue('success');

      // When circuit breaker is open from start, we should throw immediately
      await expect(withRetry(fn, context)).rejects.toThrow('Circuit breaker is OPEN');
      expect(fn).not.toHaveBeenCalled();
    });

    it('should check circuit breaker before each retry', async () => {
      const error = new Error('Server error');
      (error as any).statusCode = 500;

      const fn = vi.fn().mockRejectedValue(error);
      const context = {
        isCircuitBreakerOpen: vi
          .fn()
          .mockReturnValueOnce(false) // First attempt
          .mockReturnValueOnce(false) // Before second attempt
          .mockReturnValueOnce(true), // Before third attempt - circuit opens
      };

      await expect(
        withRetry(fn, context, {
          maxRetries: 3,
          baseDelayMs: 10,
        })
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(2);
      expect(context.isCircuitBreakerOpen).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff timing', async () => {
      const error = new Error('Server error');
      (error as any).statusCode = 500;

      let attemptTimes: number[] = [];
      const fn = vi.fn().mockImplementation(() => {
        attemptTimes.push(Date.now());
        return Promise.reject(error);
      });

      const start = Date.now();
      await expect(
        withRetry(fn, undefined, {
          maxRetries: 2,
          baseDelayMs: 100,
          jitterPercent: 0, // No jitter for predictable timing
        })
      ).rejects.toThrow();

      // Check delays between attempts
      const delay1 = attemptTimes[1] - attemptTimes[0];
      const delay2 = attemptTimes[2] - attemptTimes[1];

      // First retry: ~100ms, Second retry: ~200ms
      expect(delay1).toBeGreaterThanOrEqual(90);
      expect(delay1).toBeLessThan(150);
      expect(delay2).toBeGreaterThanOrEqual(190);
      expect(delay2).toBeLessThan(250);
    });
  });
});
