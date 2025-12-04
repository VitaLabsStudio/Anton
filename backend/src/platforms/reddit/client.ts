import Snoowrap from 'snoowrap';

import { appConfig } from '../../config/app-config.js';
import { CircuitBreaker } from '../../utils/circuit-breaker.js';
import { logger } from '../../utils/logger.js';
import { redditRateLimiter } from '../../utils/rate-limiter.js';

import { redditCredentials } from './auth.js';
import {
  getApprovedSubredditConfigs,
  validateSubreddits,
} from './subreddit-config.js';
import type { ClientStatus, IPlatformClient, Post } from '../IPlatformClient.js';

type Submission = Snoowrap.Submission;
type RedditProfile = Snoowrap.RedditUser | Snoowrap.RedditUserSummary;

interface VerificationCache {
  username: string;
  karma: number;
  createdUtc?: number;
}

export class RedditClient implements IPlatformClient {
  private client: Snoowrap;
  private circuitBreaker: CircuitBreaker;
  private verificationCache: VerificationCache = {
    username: '',
    karma: 0,
    createdUtc: undefined,
  };

  constructor() {
    this.client = new Snoowrap({
      userAgent: redditCredentials.userAgent,
      clientId: redditCredentials.clientId,
      clientSecret: redditCredentials.clientSecret,
      refreshToken: redditCredentials.refreshToken,
    });

    this.circuitBreaker = new CircuitBreaker({
      threshold: 5,
      timeout: 30_000,
    });
  }

  private ensureEnabled(): void {
    if (process.env['REDDIT_ENABLED'] === 'false') {
      throw new Error('Reddit integration disabled by REDDIT_ENABLED flag');
    }
  }

  private getDefaultSubreddits(): string[] {
    const approvedConfigs = getApprovedSubredditConfigs();
    return validateSubreddits(approvedConfigs.map((config) => config.name));
  }

  private cacheVerification(me: RedditProfile): void {
    this.verificationCache = {
      username: me.name ?? '',
      karma: (me.comment_karma ?? 0) + (me.link_karma ?? 0),
      createdUtc: me.created_utc,
    };
  }

  private toPostList(submissions: Submission[]): Post[] {
    return submissions.map((submission) => this.toPost(submission));
  }

  private toPost(submission: Submission): Post {
    const contentParts = [
      submission.title,
      submission.selftext?.trim(),
    ].filter(Boolean);
    const content = contentParts.join('\n').trim() || submission.title;

    const authorName =
      submission.author?.name ??
      submission.author_fullname ??
      (typeof submission.author === 'string' ? submission.author : '') ??
      'unknown';

    const authorId =
      submission.author_fullname ??
      submission.author?.id ??
      submission.id;

    return {
      id: submission.id,
      content,
      author: {
        id: authorId,
        name: authorName,
      },
    };
  }

  async search(query: string): Promise<Post[]> {
    const subreddits = this.getDefaultSubreddits();
    if (subreddits.length === 0) {
      logger.warn('No approved subreddits available for Reddit search');
      return [];
    }

    const submissions = await this.searchSubreddits(subreddits, query);
    return this.toPostList(submissions);
  }

  async searchSubreddits(subreddits: string[], query: string): Promise<Submission[]> {
    this.ensureEnabled();

    const approvedSubreddits = validateSubreddits(subreddits);
    if (approvedSubreddits.length === 0) {
      logger.error('No approved subreddits available after validation', {
        requested: subreddits,
      });
      return [];
    }

    if (approvedSubreddits.length < subreddits.length) {
      logger.warn('Some subreddits filtered out before search', {
        requested: subreddits,
        approved: approvedSubreddits,
      });
    }

    try {
      return await redditRateLimiter.scheduleRead(async () => {
        return this.circuitBreaker.execute(async () => {
          const posts = await this.client
            .getSubreddit(approvedSubreddits.join('+'))
            .search({
              query,
              time: 'day',
              sort: 'new',
              limit: 100,
            });

          logger.info(
            {
              subreddits: approvedSubreddits,
              query,
              results: posts.length,
            },
            'Reddit search completed'
          );

          return posts as unknown as Submission[];
        });
      });
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  async reply(submissionId: string, content: string): Promise<{ replyId: string }> {
    const replyId = await this.comment(submissionId, content);
    return { replyId };
  }

  async comment(submissionId: string, content: string): Promise<string> {
    this.ensureEnabled();

    if (appConfig.dryRun) {
      const dryRunId = `dry_run_reddit_${Date.now()}`;
      logger.info(
        { dryRunId, submissionId, content },
        '[DRY RUN] Reddit comment suppressed'
      );
      return dryRunId;
    }

    if (appConfig.requireApproval) {
      throw new Error('Reddit comment approval workflow not yet implemented (Story 1.8)');
    }

    try {
      return await redditRateLimiter.scheduleWrite(async () => {
        return this.circuitBreaker.execute(async () => {
          const submission = await this.client.getSubmission(submissionId);
          const comment = await submission.reply(content);

          logger.info(
            {
              submissionId,
              commentId: comment.id,
            },
            'Reddit comment posted successfully'
          );

          return comment.id;
        });
      });
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  async verifyCredentials(): Promise<ClientStatus> {
    try {
      const me = await this.client.getMe();
      this.cacheVerification(me);

      logger.info(
        { username: me.name },
        'Reddit credentials verified successfully'
      );

      return {
        available: true,
        message: `Reddit connected as u/${me.name}`,
      };
    } catch (error) {
      logger.error({ error }, 'Reddit credential verification failed');
      return {
        available: false,
        message: 'Reddit credentials invalid or Reddit service unavailable',
      };
    }
  }

  async getKarma(): Promise<number> {
    this.ensureEnabled();

    try {
      return await redditRateLimiter.scheduleRead(async () => {
        return this.circuitBreaker.execute(async () => {
          const me = await this.client.getMe();
          this.cacheVerification(me);
          return me.comment_karma + me.link_karma;
        });
      });
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  getLastVerifiedInfo(): VerificationCache {
    return this.verificationCache;
  }

  getRateLimitStatus(): { read: unknown; write: unknown } {
    return redditRateLimiter.getStatus();
  }

  getCircuitBreakerStatus(): { state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'; failureCount: number } {
    return {
      state: this.circuitBreaker.getState(),
      failureCount: this.circuitBreaker.getFailureCount(),
    };
  }

  private handleAuthError(error: unknown): never {
    const err = error as { statusCode?: number; message?: string };

    if (err.statusCode === 401 || err.message?.includes('invalid_grant')) {
      logger.error(
        { error },
        'CRITICAL: Reddit refresh token invalid or expired – disabling integration'
      );
      process.env['REDDIT_ENABLED'] = 'false';
      throw new Error(
        'Reddit authentication failed - service disabled. Manual re-authentication required.'
      );
    }

    throw error as Error;
  }
}
