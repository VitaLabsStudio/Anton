import Snoowrap from 'snoowrap';

import { appConfig } from '../../config/app-config.js';
import { CircuitBreaker } from '../../utils/circuit-breaker.js';
import { logger } from '../../utils/logger.js';
import { redditRateLimiter } from '../../utils/rate-limiter.js';
import type { ClientStatus, IPlatformClient, Post, RequestOptions } from '../IPlatformClient.js';

import { getRedditCredentials } from './auth.js';
import { getApprovedSubredditConfigs, validateSubreddits } from './subreddit-config.js';

interface SubmissionAuthor {
  id?: string;
  name?: string;
}

interface Submission {
  id: string;
  title: string;
  selftext?: string | null;
  author?: SubmissionAuthor | string;
  author_fullname?: string;
  reply: (content: string) => Promise<{ id: string }>;
}

interface RedditProfileData {
  name?: string;
  comment_karma?: number;
  link_karma?: number;
  created_utc?: number;
}

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
    // Validate credentials on construction (will throw if missing)
    const credentials = getRedditCredentials();
    this.client = new Snoowrap({
      userAgent: credentials.userAgent,
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      refreshToken: credentials.refreshToken,
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

  private cacheVerification(me: RedditProfileData): void {
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
    const contentParts = [submission.title, submission.selftext?.trim()].filter(Boolean);
    const content = contentParts.join('\n').trim() || submission.title;

    const authorObj = typeof submission.author === 'string' ? undefined : submission.author;

    const authorName =
      authorObj?.name ??
      submission.author_fullname ??
      (typeof submission.author === 'string' ? submission.author : '') ??
      'unknown';

    const authorId = submission.author_fullname ?? authorObj?.id ?? submission.id;

    return {
      id: submission.id,
      content,
      author: {
        id: authorId,
        name: authorName,
      },
    };
  }

  async search(query: string, options?: RequestOptions): Promise<Post[]> {
    const subreddits = this.getDefaultSubreddits();
    if (subreddits.length === 0) {
      logger.warn(
        { requestId: options?.requestId },
        'No approved subreddits available for Reddit search'
      );
      return [];
    }

    const submissions = await this.searchSubreddits(subreddits, query, options);
    return this.toPostList(submissions);
  }

  async searchSubreddits(
    subreddits: string[],
    query: string,
    options?: RequestOptions
  ): Promise<Submission[]> {
    this.ensureEnabled();

    const approvedSubreddits = validateSubreddits(subreddits);
    if (approvedSubreddits.length === 0) {
      logger.error(
        { requested: subreddits, requestId: options?.requestId },
        'No approved subreddits available after validation'
      );
      return [];
    }

    if (approvedSubreddits.length < subreddits.length) {
      logger.warn(
        {
          requested: subreddits,
          approved: approvedSubreddits,
          requestId: options?.requestId,
        },
        'Some subreddits filtered out before search'
      );
    }

    try {
      return await redditRateLimiter.scheduleRead(async () => {
        return this.circuitBreaker.execute(async () => {
          const searchOptions: Snoowrap.SearchOptions = {
            query,
            time: 'day',
            sort: 'new',
            limit: 100,
          };

          const posts = await this.client
            .getSubreddit(approvedSubreddits.join('+'))
            .search(searchOptions);

          logger.info(
            {
              subreddits: approvedSubreddits,
              query,
              results: posts.length,
              requestId: options?.requestId,
            },
            'Reddit search completed'
          );

          return posts as unknown as Submission[];
        });
      });
    } catch (error) {
      return this.handleAuthError(error, options?.requestId);
    }
  }

  async reply(
    submissionId: string,
    content: string,
    options?: RequestOptions
  ): Promise<{ replyId: string }> {
    const replyId = await this.comment(submissionId, content, options);
    return { replyId };
  }

  async comment(submissionId: string, content: string, options?: RequestOptions): Promise<string> {
    this.ensureEnabled();

    if (appConfig.dryRun) {
      const dryRunId = `dry_run_reddit_${Date.now()}`;
      logger.info(
        { dryRunId, submissionId, content, requestId: options?.requestId },
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
          const submission = await (this.client.getSubmission(submissionId) as Promise<Submission>);
          const comment = await submission.reply(content);

          logger.info(
            {
              submissionId,
              commentId: comment.id,
              requestId: options?.requestId,
            },
            'Reddit comment posted successfully'
          );

          return comment.id;
        });
      });
    } catch (error) {
      return this.handleAuthError(error, options?.requestId);
    }
  }

  async verifyCredentials(): Promise<ClientStatus> {
    try {
      const me = await (this.client.getMe() as Promise<RedditProfileData>);
      this.cacheVerification(me);

      logger.info({ username: me.name }, 'Reddit credentials verified successfully');

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
          const me = await (this.client.getMe() as Promise<RedditProfileData>);
          this.cacheVerification(me);
          return (me.comment_karma ?? 0) + (me.link_karma ?? 0);
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

  private handleAuthError(error: unknown, requestId?: string): never {
    const err = error as { statusCode?: number; message?: string };

    if (err.statusCode === 401 || err.message?.includes('invalid_grant')) {
      logger.error(
        { error, requestId },
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
