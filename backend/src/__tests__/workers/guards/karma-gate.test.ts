/**
 * Tests for KarmaGate (BUS-001 validation)
 *
 * Validates:
 * - Karma threshold enforcement
 * - Account age enforcement (30-day minimum)
 * - Proper blocking and logging behavior
 * - Combined karma + age requirements
 */

import { describe, it, expect, vi } from 'vitest';

import type { RedditClient } from '../../../platforms/reddit/client.js';
import { KarmaGate } from '../../../workers/guards/karma-gate.js';

describe('KarmaGate', () => {
  const createMockClient = (karma: number, createdUtc?: number): RedditClient => {
    const mockClient = {
      getKarma: vi.fn().mockResolvedValue(karma),
      getLastVerifiedInfo: vi.fn().mockReturnValue({
        username: 'test_user',
        karma,
        createdUtc,
      }),
    };

    return mockClient as unknown as RedditClient;
  };

  describe('Karma Threshold', () => {
    it('should block when karma is below threshold', async () => {
      const gate = new KarmaGate({ minKarma: 100, minAccountAgeDays: 30 });
      const client = createMockClient(50, Date.now() / 1000 - 60 * 60 * 24 * 60); // 60 days old

      const result = await gate.check(client);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Insufficient karma');
      expect(result.karma).toBe(50);
    });

    it('should allow when karma meets threshold and account is old enough', async () => {
      const gate = new KarmaGate({ minKarma: 100, minAccountAgeDays: 30 });
      const client = createMockClient(150, Date.now() / 1000 - 60 * 60 * 24 * 60); // 60 days old

      const result = await gate.check(client);

      expect(result.allowed).toBe(true);
      expect(result.karma).toBe(150);
      expect(result.accountAge).toBeGreaterThanOrEqual(59); // Account age in days
    });

    it('should use default threshold of 100 karma', async () => {
      const gate = new KarmaGate();
      const client = createMockClient(99, Date.now() / 1000 - 60 * 60 * 24 * 60); // 60 days old

      const result = await gate.check(client);

      expect(result.allowed).toBe(false);
    });
  });

  describe('Account Age Enforcement', () => {
    it('should block accounts younger than 30 days even with high karma', async () => {
      const gate = new KarmaGate({ minKarma: 100, minAccountAgeDays: 30 });
      const nowSeconds = Math.floor(Date.now() / 1000);
      const twentyDaysAgo = nowSeconds - 20 * 24 * 60 * 60; // 20 days old
      const client = createMockClient(500, twentyDaysAgo);

      const result = await gate.check(client);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Account too new');
      expect(result.accountAge).toBeLessThan(30);
      expect(result.karma).toBe(500);
    });

    it('should allow accounts exactly 30 days old with sufficient karma', async () => {
      const gate = new KarmaGate({ minKarma: 100, minAccountAgeDays: 30 });
      const nowSeconds = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = nowSeconds - 30 * 24 * 60 * 60; // Exactly 30 days
      const client = createMockClient(150, thirtyDaysAgo);

      const result = await gate.check(client);

      expect(result.allowed).toBe(true);
      expect(result.accountAge).toBeGreaterThanOrEqual(30);
    });

    it('should block when createdUtc is missing', async () => {
      const gate = new KarmaGate({ minKarma: 100, minAccountAgeDays: 30 });
      const client = createMockClient(150, undefined);

      const result = await gate.check(client);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Unable to determine account age');
    });

    it('should use default threshold of 30 days', async () => {
      const gate = new KarmaGate();
      const nowSeconds = Math.floor(Date.now() / 1000);
      const twentyDaysAgo = nowSeconds - 20 * 24 * 60 * 60;
      const client = createMockClient(150, twentyDaysAgo);

      const result = await gate.check(client);

      expect(result.allowed).toBe(false);
      expect(result.accountAge).toBeLessThan(30);
    });
  });

  describe('Combined Requirements', () => {
    it('should require BOTH karma and account age to pass', async () => {
      const gate = new KarmaGate({ minKarma: 100, minAccountAgeDays: 30 });

      // Test: Low karma, old account → BLOCKED
      const oldAccountLowKarma = createMockClient(
        50,
        Date.now() / 1000 - 60 * 60 * 24 * 60 // 60 days
      );
      const result1 = await gate.check(oldAccountLowKarma);
      expect(result1.allowed).toBe(false);
      expect(result1.reason).toContain('karma');

      // Test: High karma, new account → BLOCKED
      const newAccountHighKarma = createMockClient(
        500,
        Date.now() / 1000 - 60 * 60 * 24 * 20 // 20 days
      );
      const result2 = await gate.check(newAccountHighKarma);
      expect(result2.allowed).toBe(false);
      expect(result2.reason).toContain('Account too new');

      // Test: High karma, old account → ALLOWED
      const oldAccountHighKarma = createMockClient(
        500,
        Date.now() / 1000 - 60 * 60 * 24 * 60 // 60 days
      );
      const result3 = await gate.check(oldAccountHighKarma);
      expect(result3.allowed).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle API errors gracefully', async () => {
      const gate = new KarmaGate();
      const client = {
        getKarma: vi.fn().mockRejectedValue(new Error('API Error')),
        getLastVerifiedInfo: vi.fn(),
      } as unknown as RedditClient;

      const result = await gate.check(client);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Unable to verify karma status');
    });

    it('should handle very old accounts', async () => {
      const gate = new KarmaGate({ minKarma: 100, minAccountAgeDays: 30 });
      const fiveYearsAgo = Date.now() / 1000 - 5 * 365 * 24 * 60 * 60;
      const client = createMockClient(200, fiveYearsAgo);

      const result = await gate.check(client);

      expect(result.allowed).toBe(true);
      expect(result.accountAge).toBeGreaterThan(1800); // ~5 years in days
    });

    it('should handle zero karma with old account', async () => {
      const gate = new KarmaGate({ minKarma: 100, minAccountAgeDays: 30 });
      const client = createMockClient(0, Date.now() / 1000 - 60 * 60 * 24 * 60);

      const result = await gate.check(client);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('karma');
    });
  });

  describe('Configuration', () => {
    it('should allow custom thresholds', async () => {
      const gate = new KarmaGate({ minKarma: 50, minAccountAgeDays: 15 });
      const config = gate.getConfig();

      expect(config.minKarma).toBe(50);
      expect(config.minAccountAgeDays).toBe(15);
    });

    it('should return configuration without modifying internal state', () => {
      const gate = new KarmaGate({ minKarma: 100, minAccountAgeDays: 30 });
      const config1 = gate.getConfig();
      const config2 = gate.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different objects
    });
  });
});
