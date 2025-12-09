/**
 * Twitter Monitor: Uses API-level OR queries to reduce data fetch.
 * Optimized for PERF-001 - pushes filtering to platform API where possible.
 */

import { logger } from '../../utils/logger.js';
import type { DetectedPost } from '../../workers/types.js';

import { TwitterClient } from './client.js';

export class TwitterMonitor {
  private client: TwitterClient;
  private lastScanId?: string;

  constructor(client?: TwitterClient) {
    this.client = client ?? new TwitterClient();
  }

  /**
   * Build optimized OR query from keyword categories
   * Twitter API supports complex boolean queries
   */
  private buildORQuery(keywords: string[]): string {
    // Twitter search syntax: (term1 OR term2 OR term3)
    // Limit to top priority terms to stay within query length limits
    const topTerms = keywords.slice(0, 50); // Twitter query length limit
    return topTerms.join(' OR ');
  }

  /**
   * Monitor Twitter for posts matching keywords
   * Uses OR query to let Twitter API do the filtering
   */
  async scan(keywords: string[]): Promise<DetectedPost[]> {
    try {
      const query = this.buildORQuery(keywords);

      logger.debug(
        {
          query,
          sinceId: this.lastScanId,
        },
        'Twitter monitor: Starting scan'
      );

      const posts = await this.client.search(query, {
        maxResults: 100,
        sinceId: this.lastScanId,
      });

      const detected: DetectedPost[] = posts.map((post) => ({
        platform: 'TWITTER' as const,
        platformPostId: post.id,
        authorId: post.author.id,
        authorHandle: post.author.name,
        content: post.content,
        isVerified: post.author.isVerified,
        followerCount: post.author.followerCount,
        detectedAt: new Date(),
      }));

      // Update lastScanId to avoid reprocessing
      if (detected.length > 0 && detected[0]) {
        this.lastScanId = detected[0].platformPostId;
      }

      logger.info(
        {
          scanned: posts.length,
          detected: detected.length,
        },
        'Twitter monitor: Scan complete'
      );

      return detected;
    } catch (error) {
      logger.error({ error }, 'Twitter monitor: Scan failed');
      return [];
    }
  }

  /**
   * Reset scan cursor
   */
  reset(): void {
    this.lastScanId = undefined;
  }
}
