/**
 * Reddit Monitor: Monitors target subreddits (r/hangover, r/hangovercures).
 * Uses approved subreddit configs for safe operation.
 */

import { RedditClient } from './client.js';
import { getApprovedSubredditConfigs } from './subreddit-config.js';
import { logger } from '../../utils/logger.js';
import type { DetectedPost } from '../../workers/types.js';

export class RedditMonitor {
  private client: RedditClient;
  private processedIds: Set<string> = new Set();
  private readonly MAX_PROCESSED_IDS = 1000;

  constructor(client?: RedditClient) {
    this.client = client ?? new RedditClient();
  }

  /**
   * Monitor approved subreddits for new posts
   * Uses subreddit search to filter by keywords
   */
  async scan(keywords: string[]): Promise<DetectedPost[]> {
    try {
      const approvedSubreddits = getApprovedSubredditConfigs();

      if (approvedSubreddits.length === 0) {
        logger.warn('Reddit monitor: No approved subreddits available');
        return [];
      }

      const subredditNames = approvedSubreddits.map((config) => config.name);

      // Build simple query (Reddit search is less sophisticated than Twitter)
      const query = keywords.slice(0, 10).join(' OR ');

      logger.debug(
        {
          subreddits: subredditNames,
          query,
        },
        'Reddit monitor: Starting scan'
      );

      const submissions = await this.client.searchSubreddits(
        subredditNames,
        query
      );

      // Filter out already processed posts
      const newSubmissions = submissions.filter(
        (sub) => !this.processedIds.has(sub.id)
      );

      const detected: DetectedPost[] = newSubmissions.map((sub) => {
        const authorObj =
          typeof sub.author === 'string' ? undefined : sub.author;

        const authorName =
          authorObj?.name ?? (typeof sub.author === 'string' ? sub.author : '') ?? 'unknown';

        const authorId =
          sub.author_fullname ?? authorObj?.id ?? sub.id;

        const contentParts = [sub.title, sub.selftext?.trim()].filter(Boolean);
        const content = contentParts.join('\n').trim() || sub.title;

        return {
          platform: 'REDDIT' as const,
          platformPostId: sub.id,
          authorId,
          authorHandle: authorName,
          content,
          detectedAt: new Date(),
        };
      });

      // Track processed IDs to avoid duplicates
      detected.forEach((post) => {
        this.processedIds.add(post.platformPostId);
      });

      // Limit memory usage by pruning old IDs
      if (this.processedIds.size > this.MAX_PROCESSED_IDS) {
        const idsArray = Array.from(this.processedIds);
        this.processedIds = new Set(
          idsArray.slice(idsArray.length - this.MAX_PROCESSED_IDS / 2)
        );
      }

      logger.info(
        {
          scanned: submissions.length,
          new: detected.length,
          processed: this.processedIds.size,
        },
        'Reddit monitor: Scan complete'
      );

      return detected;
    } catch (error) {
      logger.error({ error }, 'Reddit monitor: Scan failed');
      return [];
    }
  }

  /**
   * Reset processed IDs cache
   */
  reset(): void {
    this.processedIds.clear();
  }
}
