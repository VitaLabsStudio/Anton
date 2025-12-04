/**
 * Reddit Karma Gate: BUS-001 Mitigation
 *
 * CRITICAL: NO AUTOMATED KARMA FARMING.
 * This guard prevents the bot from posting on Reddit until:
 * 1. Account karma >= 100
 * 2. Account age >= 30 days
 *
 * If checks fail, logs warning and SKIPS posting.
 * Manual intervention required (see docs/manuals/reddit-karma.md).
 */

import type { RedditClient } from '../../platforms/reddit/client.js';
import { logger } from '../../utils/logger.js';

export interface KarmaGateResult {
  allowed: boolean;
  reason?: string;
  karma?: number;
  accountAge?: number;
}

export interface KarmaGateConfig {
  minKarma: number;
  minAccountAgeDays: number;
  cacheTtlMs: number; // TTL for cached karma check results
}

interface CachedKarmaResult {
  result: KarmaGateResult;
  timestamp: number;
  failed: boolean; // Whether the check encountered an error
}

export class KarmaGate {
  private readonly config: KarmaGateConfig;
  private cache: CachedKarmaResult | null = null;

  constructor(config?: Partial<KarmaGateConfig>) {
    this.config = {
      minKarma: config?.minKarma ?? 100,
      minAccountAgeDays: config?.minAccountAgeDays ?? 30,
      cacheTtlMs: config?.cacheTtlMs ?? 60_000, // Default: 1 minute TTL
    };

    logger.info(
      {
        minKarma: this.config.minKarma,
        minAccountAgeDays: this.config.minAccountAgeDays,
        cacheTtlMs: this.config.cacheTtlMs,
      },
      'KarmaGate initialized (BUS-001 protection)'
    );
  }

  /**
   * Check if Reddit client meets karma and account age requirements
   * @returns KarmaGateResult with allowed status and reason
   */
  async check(client: RedditClient): Promise<KarmaGateResult> {
    try {
      // Get current karma
      const karma = await client.getKarma();

      // Check karma threshold
      if (karma < this.config.minKarma) {
        const result = {
          allowed: false,
          reason: `Insufficient karma: ${karma} < ${this.config.minKarma}. Manual karma building required.`,
          karma,
        };

        logger.warn(
          result,
          'KarmaGate BLOCKED: Insufficient karma. See docs/manuals/reddit-karma.md'
        );

        return result;
      }

      // Get account info for age check
      const verifiedInfo = client.getLastVerifiedInfo();

      // Check account age threshold
      if (!verifiedInfo.createdUtc) {
        const result = {
          allowed: false,
          reason: 'Unable to determine account age. Manual verification required.',
          karma,
        };

        logger.warn(
          result,
          'KarmaGate BLOCKED: Missing account creation timestamp'
        );

        return result;
      }

      // Calculate account age in days
      const nowSeconds = Math.floor(Date.now() / 1000);
      const accountAgeSeconds = nowSeconds - verifiedInfo.createdUtc;
      const accountAgeDays = Math.floor(accountAgeSeconds / (60 * 60 * 24));

      if (accountAgeDays < this.config.minAccountAgeDays) {
        const result = {
          allowed: false,
          reason: `Account too new: ${accountAgeDays} days < ${this.config.minAccountAgeDays} days. Manual karma building required.`,
          karma,
          accountAge: accountAgeDays,
        };

        logger.warn(
          result,
          'KarmaGate BLOCKED: Account age insufficient. See docs/manuals/reddit-karma.md'
        );

        return result;
      }

      logger.info(
        {
          karma,
          accountAge: accountAgeDays,
          username: verifiedInfo.username,
          minKarma: this.config.minKarma,
          minAccountAge: this.config.minAccountAgeDays,
        },
        'KarmaGate PASSED: Reddit posting allowed'
      );

      return {
        allowed: true,
        karma,
        accountAge: accountAgeDays,
      };
    } catch (error) {
      logger.error({ error }, 'KarmaGate: Error checking karma status');

      return {
        allowed: false,
        reason: 'Unable to verify karma status - blocking as safety measure',
      };
    }
  }

  /**
   * Check with caching - returns cached result if within TTL and not stale
   * This should be called once per scan cycle, not per-post.
   *
   * Cache staleness conditions (force refresh):
   * - Cache is older than TTL
   * - Previous check failed (error occurred)
   * - No cache exists
   */
  async checkCached(client: RedditClient): Promise<KarmaGateResult> {
    const now = Date.now();

    // Check if cache is valid (exists, within TTL, and didn't fail)
    if (this.cache && !this.isCacheStale(now)) {
      logger.debug(
        {
          cacheAge: now - this.cache.timestamp,
          ttl: this.config.cacheTtlMs,
          allowed: this.cache.result.allowed,
        },
        'KarmaGate: Using cached result'
      );
      return this.cache.result;
    }

    // Cache miss or stale - perform fresh check
    logger.debug('KarmaGate: Cache miss or stale, performing fresh check');
    return this.refreshCache(client);
  }

  /**
   * Force refresh the cache regardless of TTL
   * Useful when we know the account status may have changed
   */
  async refreshCache(client: RedditClient): Promise<KarmaGateResult> {
    const now = Date.now();

    try {
      const result = await this.check(client);

      this.cache = {
        result,
        timestamp: now,
        failed: false,
      };

      logger.debug(
        {
          allowed: result.allowed,
          karma: result.karma,
          cacheTtlMs: this.config.cacheTtlMs,
        },
        'KarmaGate: Cache refreshed'
      );

      return result;
    } catch (error) {
      // On error, create a blocking result and mark cache as failed
      const errorResult: KarmaGateResult = {
        allowed: false,
        reason: 'Unable to verify karma status - blocking as safety measure',
      };

      this.cache = {
        result: errorResult,
        timestamp: now,
        failed: true, // Mark as failed so next check will refresh
      };

      logger.error({ error }, 'KarmaGate: Error during cache refresh');
      return errorResult;
    }
  }

  /**
   * Check if cache is stale and needs refresh
   */
  private isCacheStale(now: number): boolean {
    if (!this.cache) return true;

    // Stale if: TTL expired OR previous check failed
    const expired = now - this.cache.timestamp > this.config.cacheTtlMs;
    const previouslyFailed = this.cache.failed;

    if (expired || previouslyFailed) {
      logger.debug(
        {
          expired,
          previouslyFailed,
          cacheAge: now - this.cache.timestamp,
          ttl: this.config.cacheTtlMs,
        },
        'KarmaGate: Cache is stale'
      );
      return true;
    }

    return false;
  }

  /**
   * Get cache status for monitoring
   */
  getCacheStatus(): { hasCache: boolean; cacheAge?: number; isStale?: boolean; allowed?: boolean } {
    if (!this.cache) {
      return { hasCache: false };
    }

    const now = Date.now();
    return {
      hasCache: true,
      cacheAge: now - this.cache.timestamp,
      isStale: this.isCacheStale(now),
      allowed: this.cache.result.allowed,
    };
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache = null;
    logger.debug('KarmaGate: Cache cleared');
  }

  /**
   * Get current configuration
   */
  getConfig(): KarmaGateConfig {
    return { ...this.config };
  }

  /**
   * Log karma gate status for monitoring
   */
  async logStatus(client: RedditClient): Promise<void> {
    const result = await this.check(client);

    logger.info(
      {
        ...result,
        gate: 'karma-gate',
        status: result.allowed ? 'OPEN' : 'CLOSED',
      },
      'KarmaGate status check'
    );
  }
}

// Export singleton instance with default thresholds
export const karmaGate = new KarmaGate();
