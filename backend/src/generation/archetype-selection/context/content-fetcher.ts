/**
 * Content Fetcher - Retrieves post content from database
 * Story 2.10: Context Enrichment
 */

import { logger } from '@/utils/logger';
import { prisma } from '@/utils/prisma';

export interface PostContent {
  content: string;
  authorHandle?: string;
  createdAt: Date;
}

export class ContentFetcher {
  /**
   * Fetch post content by ID
   * @returns Post content or null if not found
   */
  public async fetchPostContent(
    postId: string,
    platform: 'twitter' | 'reddit' | 'threads'
  ): Promise<PostContent | null> {
    try {
      // Query database for post content
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: {
          content: true,
          author: {
            select: {
              handle: true,
            },
          },
          createdAt: true,
        },
      });

      if (!post) {
        logger.warn({ postId, platform }, 'Post not found in database');
        return null;
      }

      return {
        content: post.content,
        authorHandle: post.author?.handle,
        createdAt: post.createdAt,
      };
    } catch (error) {
      logger.error({ error, postId, platform }, 'Failed to fetch post content');
      return null;
    }
  }
}
