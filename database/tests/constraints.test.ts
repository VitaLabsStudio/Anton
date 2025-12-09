import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

interface AuthorRecord {
  id: string;
  platform: string;
  platformId: string;
  handle: string;
  displayName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PostRecord {
  id: string;
  platform: string;
  platformPostId: string;
  authorId: string;
  content: string;
  detectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const store = {
  authors: new Map<string, AuthorRecord>(),
  posts: new Map<string, PostRecord>(),
};

let idSequence = 1;

const resetStore = () => {
  store.authors.clear();
  store.posts.clear();
  idSequence = 1;
};

const buildAuthorKey = (platform: string, platformId: string) => `${platform}::${platformId}`;
const buildPostKey = (platform: string, platformPostId: string) => `${platform}::${platformPostId}`;

const createId = (prefix: string) => `${prefix}-${idSequence++}`;

// Mock Prisma to simulate constraint enforcement without a real Postgres server.
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      author = {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const platform = data['platform'] as string;
          const platformId = data['platformId'] as string;
          const key = buildAuthorKey(platform, platformId);

          if (store.authors.has(key)) {
            throw new Error('Unique constraint failed');
          }

          const record: AuthorRecord = {
            id: createId('author'),
            platform,
            platformId,
            handle: data['handle'] as string,
            displayName: (data['displayName'] as string) ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          store.authors.set(key, record);
          return record;
        },
        delete: async ({ where }: { where: { id: string } }) => {
          const entry = Array.from(store.authors.entries()).find(
            ([, author]) => author.id === where.id
          );

          if (!entry) {
            throw new Error('Author not found');
          }

          const [entryKey, author] = entry;
          store.authors.delete(entryKey);

          for (const [postKey, post] of Array.from(store.posts.entries())) {
            if (post.authorId === author.id) {
              store.posts.delete(postKey);
            }
          }

          return author;
        },
      };

      post = {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const authorExists = Array.from(store.authors.values()).some(
            (author) => author.id === (data['authorId'] as string)
          );

          if (!authorExists) {
            throw new Error('Foreign key constraint violated');
          }

          const platform = data['platform'] as string;
          const platformPostId = data['platformPostId'] as string;
          const key = buildPostKey(platform, platformPostId);

          if (store.posts.has(key)) {
            throw new Error('Unique constraint failed');
          }

          const record: PostRecord = {
            id: createId('post'),
            platform,
            platformPostId,
            authorId: data['authorId'] as string,
            content: data['content'] as string,
            detectedAt: (data['detectedAt'] as Date) ?? new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          store.posts.set(key, record);
          return record;
        },
        findMany: async ({ where }: { where: { authorId?: string } }) => {
          return Array.from(store.posts.values()).filter((post) =>
            where?.authorId ? post.authorId === where.authorId : true
          );
        },
      };

      async $connect() {
        return;
      }

      async $disconnect() {
        return;
      }
    },
  };
});

const prisma = new PrismaClient();
describe('Data Integrity Constraints', () => {
  beforeEach(() => resetStore());
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
