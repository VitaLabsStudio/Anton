/**
 * Integration tests for upsert idempotency (DATA-001 validation)
 *
 * Validates:
 * - Duplicate prevention on repeated upserts
 * - Unique constraint enforcement
 * - Worker restart safety
 */

import { PrismaClient, Platform } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();

describe('Upsert Idempotency (DATA-001)', () => {
  const testAuthorData = {
    platform: Platform.TWITTER,
    platformId: 'test_author_123',
    handle: 'test_user',
    displayName: 'Test User',
  };

  const testPostData = {
    platform: Platform.TWITTER,
    platformPostId: 'test_post_456',
    content: 'I am so hungover right now',
    keywordMatches: ['hungover'],
    keywordCategories: ['direct_hangover'],
  };

  beforeAll(async () => {
    // Clean up test data
    await prisma.post.deleteMany({
      where: {
        platformPostId: testPostData.platformPostId,
      },
    });
    await prisma.author.deleteMany({
      where: {
        platformId: testAuthorData.platformId,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.post.deleteMany({
      where: {
        platformPostId: testPostData.platformPostId,
      },
    });
    await prisma.author.deleteMany({
      where: {
        platformId: testAuthorData.platformId,
      },
    });
    await prisma.$disconnect();
  });

  describe('Author Upsert', () => {
    it('should create author on first upsert', async () => {
      const author = await prisma.author.upsert({
        where: {
          platform_platformId: {
            platform: testAuthorData.platform,
            platformId: testAuthorData.platformId,
          },
        },
        create: testAuthorData,
        update: {},
      });

      expect(author).toBeDefined();
      expect(author.platformId).toBe(testAuthorData.platformId);
      expect(author.handle).toBe(testAuthorData.handle);
    });

    it('should update author on subsequent upsert', async () => {
      const updatedHandle = 'updated_test_user';

      const author = await prisma.author.upsert({
        where: {
          platform_platformId: {
            platform: testAuthorData.platform,
            platformId: testAuthorData.platformId,
          },
        },
        create: testAuthorData,
        update: {
          handle: updatedHandle,
        },
      });

      expect(author.handle).toBe(updatedHandle);
    });

    it('should not create duplicate authors', async () => {
      // Perform multiple upserts
      await Promise.all([
        prisma.author.upsert({
          where: {
            platform_platformId: {
              platform: testAuthorData.platform,
              platformId: testAuthorData.platformId,
            },
          },
          create: testAuthorData,
          update: {},
        }),
        prisma.author.upsert({
          where: {
            platform_platformId: {
              platform: testAuthorData.platform,
              platformId: testAuthorData.platformId,
            },
          },
          create: testAuthorData,
          update: {},
        }),
      ]);

      // Count authors with this platformId
      const count = await prisma.author.count({
        where: {
          platform: testAuthorData.platform,
          platformId: testAuthorData.platformId,
        },
      });

      expect(count).toBe(1);
    });
  });

  describe('Post Upsert', () => {
    let authorId: string;

    beforeAll(async () => {
      // Ensure author exists
      const author = await prisma.author.upsert({
        where: {
          platform_platformId: {
            platform: testAuthorData.platform,
            platformId: testAuthorData.platformId,
          },
        },
        create: testAuthorData,
        update: {},
      });
      authorId = author.id;
    });

    it('should create post on first upsert', async () => {
      const post = await prisma.post.upsert({
        where: {
          platform_platformPostId: {
            platform: testPostData.platform,
            platformPostId: testPostData.platformPostId,
          },
        },
        create: {
          ...testPostData,
          authorId,
          detectedAt: new Date(),
        },
        update: {},
      });

      expect(post).toBeDefined();
      expect(post.platformPostId).toBe(testPostData.platformPostId);
      expect(post.content).toBe(testPostData.content);
    });

    it('should update post on subsequent upsert', async () => {
      const updatedContent = 'Updated: I am still hungover';

      const post = await prisma.post.upsert({
        where: {
          platform_platformPostId: {
            platform: testPostData.platform,
            platformPostId: testPostData.platformPostId,
          },
        },
        create: {
          ...testPostData,
          authorId,
          detectedAt: new Date(),
        },
        update: {
          content: updatedContent,
        },
      });

      expect(post.content).toBe(updatedContent);
    });

    it('should not create duplicate posts', async () => {
      // Simulate worker restart: multiple upserts of same post
      await Promise.all([
        prisma.post.upsert({
          where: {
            platform_platformPostId: {
              platform: testPostData.platform,
              platformPostId: testPostData.platformPostId,
            },
          },
          create: {
            ...testPostData,
            authorId,
            detectedAt: new Date(),
          },
          update: {},
        }),
        prisma.post.upsert({
          where: {
            platform_platformPostId: {
              platform: testPostData.platform,
              platformPostId: testPostData.platformPostId,
            },
          },
          create: {
            ...testPostData,
            authorId,
            detectedAt: new Date(),
          },
          update: {},
        }),
        prisma.post.upsert({
          where: {
            platform_platformPostId: {
              platform: testPostData.platform,
              platformPostId: testPostData.platformPostId,
            },
          },
          create: {
            ...testPostData,
            authorId,
            detectedAt: new Date(),
          },
          update: {},
        }),
      ]);

      // Count posts with this platformPostId
      const count = await prisma.post.count({
        where: {
          platform: testPostData.platform,
          platformPostId: testPostData.platformPostId,
        },
      });

      expect(count).toBe(1);
    });
  });

  describe('Worker Restart Simulation', () => {
    it('should handle repeated scans without duplicates', async () => {
      const author = await prisma.author.upsert({
        where: {
          platform_platformId: {
            platform: testAuthorData.platform,
            platformId: testAuthorData.platformId,
          },
        },
        create: testAuthorData,
        update: {},
      });

      // Simulate 10 worker restarts scanning the same post
      for (let i = 0; i < 10; i++) {
        await prisma.post.upsert({
          where: {
            platform_platformPostId: {
              platform: testPostData.platform,
              platformPostId: testPostData.platformPostId,
            },
          },
          create: {
            ...testPostData,
            authorId: author.id,
            detectedAt: new Date(),
          },
          update: {
            content: testPostData.content,
          },
        });
      }

      // Verify only one post exists
      const count = await prisma.post.count({
        where: {
          platform: testPostData.platform,
          platformPostId: testPostData.platformPostId,
        },
      });

      expect(count).toBe(1);
    });
  });
});
