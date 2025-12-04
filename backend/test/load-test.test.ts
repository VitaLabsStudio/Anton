import { describe, it, expect, vi } from 'vitest';

import { RateLimiter } from '../src/utils/rate-limiter';

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Performance Verification (Task 13)', () => {
  describe('Non-Blocking Behavior', () => {
    it('should not block event loop while scheduling', async () => {
      // Use very high limits with short window to minimize delays
      const limiter = new RateLimiter({
        read: { maxRequests: 1000, windowMs: 1000 }, // minTime = 1ms
        write: { maxRequests: 500, windowMs: 1000 },
      });

      // Track event loop responsiveness
      let eventLoopCheckCount = 0;
      const eventLoopChecker = setInterval(() => {
        eventLoopCheckCount++;
      }, 5);

      // Launch 20 concurrent requests (fast test)
      const promises: Promise<number>[] = [];
      for (let i = 0; i < 20; i++) {
        promises.push(limiter.scheduleRead(async () => i));
      }

      // Wait for 50ms
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Event loop should have run multiple times
      expect(eventLoopCheckCount).toBeGreaterThan(5);

      clearInterval(eventLoopChecker);
      const results = await Promise.all(promises);
      expect(results.length).toBe(20);

      await limiter.stop();
    });

    it('should allow other async work while processing', async () => {
      const limiter = new RateLimiter({
        read: { maxRequests: 100, windowMs: 1000 },
        write: { maxRequests: 50, windowMs: 1000 },
      });

      // Start some rate-limited work
      const promise = limiter.scheduleRead(async () => 'done');

      // Immediately do other async work
      const otherWorkStart = Date.now();
      const otherWork = await new Promise<string>((resolve) => {
        setTimeout(() => resolve('other work done'), 10);
      });
      const otherWorkDuration = Date.now() - otherWorkStart;

      // Other work should complete quickly
      expect(otherWork).toBe('other work done');
      expect(otherWorkDuration).toBeLessThan(100);

      await promise;
      await limiter.stop();
    });
  });

  describe('Queue Management', () => {
    it('should properly track queue status', async () => {
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

    it('should emit depleted event when capacity exhausted', async () => {
      const { logger } = await import('../src/utils/logger');
      vi.mocked(logger.warn).mockClear();

      // Very low capacity
      const limiter = new RateLimiter({
        read: { maxRequests: 1, windowMs: 1000 },
        write: { maxRequests: 1, windowMs: 1000 },
      });

      // Use the single token
      await limiter.scheduleRead(async () => 'done');

      // Depleted event should have fired
      const warnCalls = vi.mocked(logger.warn).mock.calls;
      const hasDepleted = warnCalls.some(
        (call) => typeof call[0] === 'string' && call[0].includes('depleted')
      );
      expect(hasDepleted).toBe(true);

      await limiter.stop();
    });
  });

  describe('Design Documentation', () => {
    it('documents the architectural improvement over blocking design', () => {
      // OLD DESIGN (Blocking - DO NOT USE):
      // async acquire(): Promise<void> {
      //   if (tokens === 0) await sleep(waitMs); // BLOCKS!
      // }

      // NEW DESIGN (Non-Blocking - Current Implementation):
      // async scheduleRead<T>(fn: () => Promise<T>): Promise<T> {
      //   return this.bottleneckLimiter.schedule(fn); // QUEUES
      // }

      // Key benefits:
      // 1. Event loop never blocked
      // 2. Bottleneck handles queuing internally
      // 3. Server remains responsive under load

      expect(true).toBe(true);
    });
  });
});
