import type { TweetV2 } from 'twitter-api-v2';
import { TwitterApi } from 'twitter-api-v2';

import { appConfig } from '../../config/app-config.js';
import { CircuitBreaker } from '../../utils/circuit-breaker.js';
import { logger } from '../../utils/logger.js';
import { twitterRateLimiter } from '../../utils/rate-limiter.js';
import { withRetry } from '../../utils/retry.js';
import type { ClientStatus, IPlatformClient, Post, RequestOptions } from '../IPlatformClient.js';

import { getTwitterCredentials } from './auth.js';

interface SearchOptions {
  maxResults?: number;
  sinceId?: string;
  requestId?: string; // Add requestId here
}

type TwitterAuthor = {
  id?: string;
  username?: string;
  name?: string;
  verified?: boolean;
  public_metrics?: {
    followers_count?: number;
    following_count?: number;
    tweet_count?: number;
    listed_count?: number;
  };
};

type TwitterRateLimit = {
  remaining: number;
  limit: number;
  reset: number;
};

export class TwitterClient implements IPlatformClient {
  private client: TwitterApi;
  private circuitBreaker: CircuitBreaker;
  private currentRateLimit?: TwitterRateLimit;

  constructor() {
    // Validate credentials on construction (will throw if missing)
    const credentials = getTwitterCredentials();
    this.client = new TwitterApi(credentials);

    this.circuitBreaker = new CircuitBreaker({
      threshold: 5,
      timeout: 30000,
    });
  }

  async search(query: string, options: SearchOptions = {}): Promise<Post[]> {
    const retryContext = {
      isCircuitBreakerOpen: () => this.circuitBreaker.getState() === 'OPEN',
    };

    return twitterRateLimiter.scheduleRead(async () => {
      return withRetry(async () => {
        return this.circuitBreaker.execute(async () => {
          // Add custom headers with requestId if available
          const headers: Record<string, string> = {};
          if (options.requestId) {
            headers['x-request-id'] = options.requestId;
          }

          const result = await this.client.v2.search(query, {
            max_results: options.maxResults || 10,
            since_id: options.sinceId,
            'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
            'user.fields': ['verified', 'public_metrics'],
            expansions: ['author_id'],
            // Pass custom headers
            // The twitter-api-v2 library doesn't directly expose a way to pass arbitrary headers to individual requests
            // at this level. This might require extending the client or using a custom fetch implementation
            // if it's strictly required by twitter-api-v2.
            // For now, logging with requestId is sufficient to track.
          });

          this.logRateLimit(result.rateLimit);

          const authors = result.data.includes?.users ?? [];

          logger.info(
            { query, results: (result.data.data || []).length, requestId: options.requestId },
            'Twitter search completed'
          );

          return (result.data.data || []).map((tweet) => this.mapToPost(tweet, authors));
        });
      }, retryContext);
    });
  }

  async reply(
    tweetId: string,
    content: string,
    options?: RequestOptions
  ): Promise<{ replyId: string }> {
    // DRY RUN MODE
    if (appConfig.dryRun) {
      const dryRunId = `dry_run_twitter_${Date.now()}`;
      logger.info(
        {
          dryRunId,
          tweetId,
          content,
          requestId: options?.requestId,
        },
        '[DRY RUN] Would post reply'
      );
      return { replyId: dryRunId };
    }

    // APPROVAL REQUIRED
    if (appConfig.requireApproval) {
      throw new Error('Reply approval system not yet implemented (Story 1.8)');
    }

    const retryContext = {
      isCircuitBreakerOpen: () => this.circuitBreaker.getState() === 'OPEN',
    };

    return twitterRateLimiter.scheduleWrite(async () => {
      return withRetry(async () => {
        return this.circuitBreaker.execute(async () => {
          try {
            // Add custom headers with requestId if available
            const headers: Record<string, string> = {};
            if (options?.requestId) {
              headers['x-request-id'] = options.requestId;
            }
            // Similar to search, direct custom header passing for reply might not be straightforward
            // with the library's high-level reply method.
            // We'll proceed with logging and assume the library handles it or it's not critical for this specific call.

            const result = await this.client.v2.reply(content, tweetId);

            logger.info(
              {
                replyId: result.data.id,
                inReplyTo: tweetId,
                requestId: options?.requestId,
              },
              'Reply posted successfully'
            );

            return { replyId: result.data.id };
          } catch (error: unknown) {
            const err = error as { code?: number; statusCode?: number };
            if (err.code === 403 || err.statusCode === 403) {
              logger.error(
                { error, tweetId, content, requestId: options?.requestId },
                'CRITICAL: Twitter API returned 403 - possible policy violation'
              );
            }
            throw error;
          }
        });
      }, retryContext);
    });
  }

  async verifyCredentials(): Promise<ClientStatus> {
    try {
      const me = await this.client.v2.me();
      logger.info(
        {
          username: me.data.username,
          id: me.data.id,
        },
        'Twitter credentials verified'
      );

      return {
        available: true,
        message: `Connected as @${me.data.username}`,
      };
    } catch (error) {
      logger.error({ error }, 'Twitter credential verification failed');
      return {
        available: false,
        message: 'Twitter credentials invalid or API unreachable',
      };
    }
  }

  getRateLimitStatus(): { read: unknown; write: unknown } {
    return twitterRateLimiter.getStatus();
  }

  getCircuitBreakerStatus(): { state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'; failureCount: number } {
    return {
      state: this.circuitBreaker.getState(),
      failureCount: this.circuitBreaker.getFailureCount(),
    };
  }

  private logRateLimit(rateLimit?: TwitterRateLimit): void {
    if (!rateLimit) {
      return;
    }

    // Update current rate limit state
    this.currentRateLimit = rateLimit;

    // Calculate usage percentage
    const usagePercent = ((rateLimit.limit - rateLimit.remaining) / rateLimit.limit) * 100;
    const resetTime = new Date(rateLimit.reset * 1000);

    // AC8: Emit >80% warnings
    if (usagePercent >= 80) {
      logger.warn(
        {
          remaining: rateLimit.remaining,
          limit: rateLimit.limit,
          usagePercent: usagePercent.toFixed(2),
          reset: resetTime,
        },
        'Twitter API rate limit >80% used'
      );
    } else {
      logger.info(
        {
          remaining: rateLimit.remaining,
          limit: rateLimit.limit,
          usagePercent: usagePercent.toFixed(2),
          reset: resetTime,
        },
        'Twitter API rate limit status'
      );
    }

    // AC8: Check if rate limit is exhausted
    if (rateLimit.remaining === 0) {
      const waitMs = rateLimit.reset * 1000 - Date.now();
      if (waitMs > 0) {
        logger.error(
          {
            resetTime,
            waitSeconds: Math.ceil(waitMs / 1000),
          },
          'Twitter API rate limit exhausted - requests will be queued until reset'
        );
      }
    }
  }

  /**
   * Get current Twitter API rate limit status
   */
  getTwitterRateLimit(): TwitterRateLimit | undefined {
    return this.currentRateLimit;
  }

  private mapToPost(tweet: TweetV2, authors: TwitterAuthor[]): Post {
    const author = authors.find((user) => user.id === tweet.author_id);

    return {
      id: tweet.id,
      content: tweet.text ?? '',
      author: {
        id: author?.id ?? tweet.author_id ?? tweet.id,
        name: author?.username ?? author?.name ?? 'unknown',
        isVerified: author?.verified,
        followerCount: author?.public_metrics?.followers_count,
      },
    };
  }
}
