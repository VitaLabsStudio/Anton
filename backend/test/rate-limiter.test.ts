import { describe, it, expect, vi } from 'vitest';

import { RateLimiter } from '../src/utils/rate-limiter';

// Mock logger to prevent console output during tests
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('RateLimiter', () => {
  describe('Basic Functionality', () => {
    it('should schedule read operations without blocking', async () => {
      const limiter = new RateLimiter({
        read: { maxRequests: 100, windowMs: 1000 },
        write: { maxRequests: 100, windowMs: 1000 },
      });

      const start = Date.now();
      const result = await limiter.scheduleRead(async () => 'success');
      const duration = Date.now() - start;

      expect(result).toBe('success');
      expect(duration).toBeLessThan(100);
      await limiter.stop();
    });

    it('should schedule write operations without blocking', async () => {
      const limiter = new RateLimiter({
        read: { maxRequests: 100, windowMs: 1000 },
        write: { maxRequests: 100, windowMs: 1000 },
      });

      const start = Date.now();
      const result = await limiter.scheduleWrite(async () => 'write-success');
      const duration = Date.now() - start;

      expect(result).toBe('write-success');
      expect(duration).toBeLessThan(100);
      await limiter.stop();
    });

    it('should return correct status', async () => {
      const limiter = new RateLimiter({
        read: { maxRequests: 100, windowMs: 1000 },
        write: { maxRequests: 50, windowMs: 1000 },
      });

      const status = limiter.getStatus();

      expect(status).toHaveProperty('read');
      expect(status).toHaveProperty('write');
      expect(status.read).toHaveProperty('RUNNING');
      expect(status.read).toHaveProperty('QUEUED');
      await limiter.stop();
    });
  });

  describe('Queue Management', () => {
    it('should queue requests when limit reached', async () => {
      const limiter = new RateLimiter({
        read: { maxRequests: 1, windowMs: 1000 },
        write: { maxRequests: 1, windowMs: 1000 },
      });

      // First request consumes the token
      await limiter.scheduleRead(async () => 'first');

      const start = Date.now();
      // Second request should be queued (approx 1000ms wait)
      const result = await limiter.scheduleRead(async () => 'second');
      const duration = Date.now() - start;

      expect(result).toBe('second');
      expect(duration).toBeGreaterThan(900);
      await limiter.stop();
    });

    it('should emit depleted warning when capacity exhausted', async () => {
      const { logger } = await import('../src/utils/logger');
      vi.mocked(logger.warn).mockClear();

      const limiter = new RateLimiter({
        read: { maxRequests: 1, windowMs: 1000 },
        write: { maxRequests: 1, windowMs: 1000 },
      });

      // Use the single token
      await limiter.scheduleRead(async () => 'done');

      // Depleted event should have fired
      const warnCalls = vi.mocked(logger.warn).mock.calls;
      const hasWarning = warnCalls.some(
        (call) => typeof call[0] === 'string' && call[0].includes('depleted')
      );
      expect(hasWarning).toBe(true);

      await limiter.stop();
    });

    it('should track queue depth in status', async () => {
      const limiter = new RateLimiter({
        read: { maxRequests: 100, windowMs: 1000 },
        write: { maxRequests: 100, windowMs: 1000 },
      });

      const status = limiter.getStatus();
      expect(status.read).toHaveProperty('QUEUED');
      expect(status.write).toHaveProperty('QUEUED');

      await limiter.stop();
    });
  });

  describe('Non-Blocking Behavior', () => {
    it('should not block event loop during scheduling', async () => {
      const limiter = new RateLimiter({
        read: { maxRequests: 1000, windowMs: 1000 }, // minTime = 1ms
        write: { maxRequests: 500, windowMs: 1000 },
      });

      // Track event loop
      let ticks = 0;
      const interval = setInterval(() => ticks++, 5);

      // Schedule multiple requests
      const promises: Promise<number>[] = [];
      for (let i = 0; i < 10; i++) {
        promises.push(limiter.scheduleRead(async () => i));
      }

      // Wait and check event loop ran
      await new Promise((resolve) => setTimeout(resolve, 50));
      clearInterval(interval);

      expect(ticks).toBeGreaterThan(5);

      await Promise.all(promises);
      await limiter.stop();
    });

    it('should allow other async work during rate limiting', async () => {
      const limiter = new RateLimiter({
        read: { maxRequests: 100, windowMs: 1000 },
        write: { maxRequests: 50, windowMs: 1000 },
      });

      // Start rate-limited work
      const promise = limiter.scheduleRead(async () => 'rate-limited');

      // Do other work immediately
      const otherStart = Date.now();
      const otherResult = await new Promise<string>((resolve) => {
        setTimeout(() => resolve('other'), 10);
      });
      const otherDuration = Date.now() - otherStart;

      // Other work should complete quickly (not blocked)
      expect(otherResult).toBe('other');
      expect(otherDuration).toBeLessThan(100);

      await promise;
      await limiter.stop();
    });
  });

  describe('Graceful Shutdown', () => {
    it('should stop cleanly', async () => {
      const limiter = new RateLimiter({
        read: { maxRequests: 100, windowMs: 1000 },
        write: { maxRequests: 100, windowMs: 1000 },
      });

      await limiter.scheduleRead(async () => 'test');
      await expect(limiter.stop()).resolves.not.toThrow();
    });
  });
});
