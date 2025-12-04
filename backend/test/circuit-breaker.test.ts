import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CircuitBreaker } from '../src/utils/circuit-breaker';

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('CircuitBreaker', () => {
  describe('State Transitions', () => {
    it('should start in CLOSED state', () => {
      const breaker = new CircuitBreaker({ threshold: 5, timeout: 1000 });
      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getFailureCount()).toBe(0);
    });

    it('should open after threshold systemic failures', async () => {
      const breaker = new CircuitBreaker({ threshold: 3, timeout: 1000 });
      const error = new Error('Server error');
      (error as any).statusCode = 500;

      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(async () => {
            throw error;
          })
        ).rejects.toThrow();
      }

      expect(breaker.getState()).toBe('OPEN');
      expect(breaker.getFailureCount()).toBe(3);
    });

    it('should fast-fail when OPEN', async () => {
      const breaker = new CircuitBreaker({ threshold: 1, timeout: 10000 });
      const error = new Error('Server error');
      (error as any).statusCode = 500;

      // Trip the breaker
      await expect(
        breaker.execute(async () => {
          throw error;
        })
      ).rejects.toThrow();

      expect(breaker.getState()).toBe('OPEN');

      // Should fast-fail without calling the function
      const fn = vi.fn();
      await expect(
        breaker.execute(async () => {
          fn();
          return 'result';
        })
      ).rejects.toThrow('Circuit breaker is OPEN');
      expect(fn).not.toHaveBeenCalled();
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      const breaker = new CircuitBreaker({ threshold: 1, timeout: 100 });
      const error = new Error('Server error');
      (error as any).statusCode = 500;

      // Trip the breaker
      await expect(
        breaker.execute(async () => {
          throw error;
        })
      ).rejects.toThrow();

      expect(breaker.getState()).toBe('OPEN');

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Next call should transition to HALF_OPEN and attempt
      const result = await breaker.execute(async () => 'success');
      expect(result).toBe('success');
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should recover from HALF_OPEN to CLOSED on success', async () => {
      const breaker = new CircuitBreaker({ threshold: 1, timeout: 50 });
      const error = new Error('Server error');
      (error as any).statusCode = 500;

      // Trip the breaker
      await expect(
        breaker.execute(async () => {
          throw error;
        })
      ).rejects.toThrow();

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Successful call in HALF_OPEN should close the circuit
      await breaker.execute(async () => 'success');

      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getFailureCount()).toBe(0);
    });

    it('should re-open from HALF_OPEN on failure', async () => {
      const breaker = new CircuitBreaker({ threshold: 1, timeout: 50 });
      const error = new Error('Server error');
      (error as any).statusCode = 500;

      // Trip the breaker
      await expect(
        breaker.execute(async () => {
          throw error;
        })
      ).rejects.toThrow();

      expect(breaker.getState()).toBe('OPEN');

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Fail in HALF_OPEN state
      await expect(
        breaker.execute(async () => {
          throw error;
        })
      ).rejects.toThrow();

      expect(breaker.getState()).toBe('OPEN');
    });
  });

  describe('Error Classification', () => {
    it('should NOT count 4xx client errors towards circuit breaker', async () => {
      const breaker = new CircuitBreaker({ threshold: 2, timeout: 1000 });

      // 400 Bad Request
      const error400 = new Error('Bad request');
      (error400 as any).statusCode = 400;

      await expect(
        breaker.execute(async () => {
          throw error400;
        })
      ).rejects.toThrow();

      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getFailureCount()).toBe(0);

      // 404 Not Found
      const error404 = new Error('Not found');
      (error404 as any).statusCode = 404;

      await expect(
        breaker.execute(async () => {
          throw error404;
        })
      ).rejects.toThrow();

      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getFailureCount()).toBe(0);
    });

    it('should count 429 (rate limit) errors towards circuit breaker', async () => {
      const breaker = new CircuitBreaker({ threshold: 2, timeout: 1000 });
      const error = new Error('Rate limited');
      (error as any).statusCode = 429;

      // First 429
      await expect(
        breaker.execute(async () => {
          throw error;
        })
      ).rejects.toThrow();
      expect(breaker.getFailureCount()).toBe(1);

      // Second 429
      await expect(
        breaker.execute(async () => {
          throw error;
        })
      ).rejects.toThrow();
      expect(breaker.getState()).toBe('OPEN');
    });

    it('should count 5xx server errors towards circuit breaker', async () => {
      const breaker = new CircuitBreaker({ threshold: 2, timeout: 1000 });

      // 500 Internal Server Error
      const error500 = new Error('Internal server error');
      (error500 as any).statusCode = 500;

      await expect(
        breaker.execute(async () => {
          throw error500;
        })
      ).rejects.toThrow();
      expect(breaker.getFailureCount()).toBe(1);

      // 503 Service Unavailable
      const error503 = new Error('Service unavailable');
      (error503 as any).statusCode = 503;

      await expect(
        breaker.execute(async () => {
          throw error503;
        })
      ).rejects.toThrow();
      expect(breaker.getState()).toBe('OPEN');
    });

    it('should count network errors towards circuit breaker', async () => {
      const breaker = new CircuitBreaker({ threshold: 2, timeout: 1000 });

      // ECONNREFUSED
      const errorConn = new Error('Connection refused');
      (errorConn as any).code = 'ECONNREFUSED';

      await expect(
        breaker.execute(async () => {
          throw errorConn;
        })
      ).rejects.toThrow();
      expect(breaker.getFailureCount()).toBe(1);

      // ETIMEDOUT
      const errorTimeout = new Error('Connection timed out');
      (errorTimeout as any).code = 'ETIMEDOUT';

      await expect(
        breaker.execute(async () => {
          throw errorTimeout;
        })
      ).rejects.toThrow();
      expect(breaker.getState()).toBe('OPEN');
    });

    it('should count ENOTFOUND errors towards circuit breaker', async () => {
      const breaker = new CircuitBreaker({ threshold: 1, timeout: 1000 });
      const error = new Error('DNS lookup failed');
      (error as any).code = 'ENOTFOUND';

      await expect(
        breaker.execute(async () => {
          throw error;
        })
      ).rejects.toThrow();

      expect(breaker.getState()).toBe('OPEN');
    });

    it('should count unknown errors (no statusCode or code) as systemic', async () => {
      const breaker = new CircuitBreaker({ threshold: 1, timeout: 1000 });
      const error = new Error('Unknown error');

      await expect(
        breaker.execute(async () => {
          throw error;
        })
      ).rejects.toThrow();

      expect(breaker.getState()).toBe('OPEN');
    });
  });

  describe('Success Handling', () => {
    it('should reset failure count on success', async () => {
      const breaker = new CircuitBreaker({ threshold: 3, timeout: 1000 });
      const error = new Error('Server error');
      (error as any).statusCode = 500;

      // Fail twice (but not enough to open)
      await expect(
        breaker.execute(async () => {
          throw error;
        })
      ).rejects.toThrow();
      await expect(
        breaker.execute(async () => {
          throw error;
        })
      ).rejects.toThrow();

      expect(breaker.getFailureCount()).toBe(2);

      // Success should reset
      await breaker.execute(async () => 'success');

      expect(breaker.getFailureCount()).toBe(0);
      expect(breaker.getState()).toBe('CLOSED');
    });
  });

  describe('Edge Cases', () => {
    it('should handle threshold of 1', async () => {
      const breaker = new CircuitBreaker({ threshold: 1, timeout: 1000 });
      const error = new Error('Server error');
      (error as any).statusCode = 500;

      await expect(
        breaker.execute(async () => {
          throw error;
        })
      ).rejects.toThrow();

      expect(breaker.getState()).toBe('OPEN');
    });

    it('should handle high threshold', async () => {
      const breaker = new CircuitBreaker({ threshold: 100, timeout: 1000 });
      const error = new Error('Server error');
      (error as any).statusCode = 500;

      // Fail 99 times
      for (let i = 0; i < 99; i++) {
        await expect(
          breaker.execute(async () => {
            throw error;
          })
        ).rejects.toThrow();
      }

      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getFailureCount()).toBe(99);

      // 100th failure should open
      await expect(
        breaker.execute(async () => {
          throw error;
        })
      ).rejects.toThrow();

      expect(breaker.getState()).toBe('OPEN');
    });
  });
});
