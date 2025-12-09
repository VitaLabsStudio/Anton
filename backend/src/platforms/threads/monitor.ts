/**
 * Threads Monitor: Hashtag-based search monitoring.
 * Uses Threads API hashtag search functionality.
 */

import { logger } from '../../utils/logger.js';
import type { DetectedPost } from '../../workers/types.js';

import { ThreadsClient } from './client.js';

export class ThreadsMonitor {
  private client: ThreadsClient;
  private processedIds: Set<string> = new Set();
  private readonly MAX_PROCESSED_IDS = 1000;

  constructor(client?: ThreadsClient) {
    this.client = client ?? new ThreadsClient();
  }

  /**
   * Build hashtag queries from keywords
   * Threads search works best with hashtags
   */
  private buildHashtagQuery(keywords: string[]): string {
    // Convert top keywords to hashtag format
    const hashtags = keywords
      .slice(0, 20)
      .map((kw) => `#${kw.replace(/\s+/g, '')}`)
      .join(' OR ');

    return hashtags;
  }

  /**
   * Monitor Threads for posts matching keyword hashtags
   */
  async scan(keywords: string[]): Promise<DetectedPost[]> {
    try {
      if (!this.client.isOperational()) {
        logger.warn('Threads monitor: Client not operational, skipping scan');
        return [];
      }

      // Build hashtag query
      const query = this.buildHashtagQuery(keywords);

      logger.debug(
        {
          query,
        },
        'Threads monitor: Starting scan'
      );

      const posts = await this.client.search(query);

      // Filter out already processed posts
      const newPosts = posts.filter((post) => !this.processedIds.has(post.id));

      const detected: DetectedPost[] = newPosts.map((post) => ({
        platform: 'THREADS' as const,
        platformPostId: post.id,
        authorId: post.author.id,
        authorHandle: post.author.name,
        content: post.content,
        detectedAt: new Date(),
      }));

      // Track processed IDs
      detected.forEach((post) => {
        this.processedIds.add(post.platformPostId);
      });

      // Limit memory usage
      if (this.processedIds.size > this.MAX_PROCESSED_IDS) {
        const idsArray = Array.from(this.processedIds);
        this.processedIds = new Set(idsArray.slice(idsArray.length - this.MAX_PROCESSED_IDS / 2));
      }

      logger.info(
        {
          scanned: posts.length,
          new: detected.length,
          processed: this.processedIds.size,
        },
        'Threads monitor: Scan complete'
      );

      return detected;
    } catch (error) {
      logger.error({ error }, 'Threads monitor: Scan failed');
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
