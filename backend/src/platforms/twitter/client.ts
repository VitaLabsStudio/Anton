import type { TweetV2 } from 'twitter-api-v2';
import { TwitterApi } from 'twitter-api-v2';

import { appConfig } from '../../config/app-config.js';
import { CircuitBreaker } from '../../utils/circuit-breaker.js';
import { logger } from '../../utils/logger.js';
import { twitterRateLimiter } from '../../utils/rate-limiter.js';
import { withRetry } from '../../utils/retry.js';

import { twitterCredentials } from './auth.js';
import type { ClientStatus, IPlatformClient, Post } from '../IPlatformClient.js';

interface SearchOptions {
  maxResults?: number;
  sinceId?: string;
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

  constructor() {
    this.client = new TwitterApi(twitterCredentials);

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
      return withRetry(
        async () => {
          return this.circuitBreaker.execute(async () => {
            const result = await this.client.v2.search(query, {
              max_results: options.maxResults || 10,
              since_id: options.sinceId,
              'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
              'user.fields': ['verified', 'public_metrics'],
              expansions: ['author_id'],
            });

            this.logRateLimit(result.rateLimit);

            const authors = result.data.includes?.users ?? [];

            return (result.data.data || []).map((tweet) =>
              this.mapToPost(tweet, authors)
            );
          });
        },
        retryContext
      );
    });
  }

  async reply(tweetId: string, content: string): Promise<{ replyId: string }> {
    // DRY RUN MODE
    if (appConfig.dryRun) {
      const dryRunId = `dry_run_${Date.now()}`;
      logger.info(
        {
          dryRunId,
          tweetId,
          content,
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
      return withRetry(
        async () => {
          return this.circuitBreaker.execute(async () => {
            try {
              const result = await this.client.v2.reply(content, tweetId);

              logger.info(
                {
                  replyId: result.data.id,
                  inReplyTo: tweetId,
                },
                'Reply posted successfully'
              );

              return { replyId: result.data.id };
            } catch (error: unknown) {
              const err = error as { code?: number; statusCode?: number };
              if (err.code === 403 || err.statusCode === 403) {
                logger.error(
                  { error, tweetId, content },
                  'CRITICAL: Twitter API returned 403 - possible policy violation'
                );
              }
              throw error;
            }
          });
        },
        retryContext
      );
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

    logger.info(
      {
        remaining: rateLimit.remaining,
        limit: rateLimit.limit,
        reset: new Date(rateLimit.reset * 1000),
      },
      'Twitter API rate limit status'
    );
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
