import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();

describe('Data Integrity Constraints', () => {
  beforeAll(async () => {
    // Setup test data if needed
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Unique Constraints', () => {
    it('should prevent duplicate (platform, platform_id) for authors', async () => {
      const uniqueId = `test_unique_${Date.now()}`;
      await prisma.author.create({
        data: {
          platform: 'TWITTER',
          platformId: uniqueId,
          handle: `handle_${uniqueId}`,
        },
      });

      // Attempt duplicate
      await expect(
        prisma.author.create({
          data: {
            platform: 'TWITTER',
            platformId: uniqueId, // Duplicate!
            handle: 'different_handle',
          },
        })
      ).rejects.toThrow(/Unique constraint failed/);
    });

    it('should prevent duplicate (platform, platform_post_id) for posts', async () => {
      const uniqueId = `test_unique_post_${Date.now()}`;
      const author = await prisma.author.create({
        data: {
          platform: 'TWITTER',
          platformId: `author_${uniqueId}`,
          handle: `author_${uniqueId}`,
        },
      });

      await prisma.post.create({
        data: {
          platform: 'TWITTER',
          platformPostId: uniqueId,
          authorId: author.id,
          content: 'Test post',
          detectedAt: new Date(),
        },
      });

      // Attempt duplicate
      await expect(
        prisma.post.create({
          data: {
            platform: 'TWITTER',
            platformPostId: uniqueId, // Duplicate!
            authorId: author.id,
            content: 'Different content',
            detectedAt: new Date(),
          },
        })
      ).rejects.toThrow(/Unique constraint failed/);
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should prevent orphaned posts (invalid author_id)', async () => {
      await expect(
        prisma.post.create({
          data: {
            platform: 'TWITTER',
            platformPostId: `orphan_${Date.now()}`,
            authorId: '00000000-0000-0000-0000-000000000000', // Non-existent
            content: 'Orphan post',
            detectedAt: new Date(),
          },
        })
      ).rejects.toThrow(/Foreign key constraint violated/);
    });
  });

  describe('Cascade Behaviors', () => {
    it('should cascade delete posts when author is deleted', async () => {
      const uniqueId = `cascade_${Date.now()}`;
      const author = await prisma.author.create({
        data: {
          platform: 'TWITTER',
          platformId: uniqueId,
          handle: `cascade_user_${uniqueId}`,
        },
      });

      await prisma.post.create({
        data: {
          platform: 'TWITTER',
          platformPostId: uniqueId,
          authorId: author.id,
          content: 'Will be deleted',
          detectedAt: new Date(),
        },
      });

      await prisma.author.delete({ where: { id: author.id } });

      const posts = await prisma.post.findMany({
        where: { authorId: author.id },
      });

      expect(posts).toHaveLength(0);
    });
  });
});
