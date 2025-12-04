import { z } from 'zod';

export const PostContentSchema = z.object({
  content: z
    .string()
    .min(1, 'Post content cannot be empty')
    .max(5000, 'Post content exceeds maximum length'),
  platform: z.enum(['TWITTER', 'REDDIT', 'THREADS']),
  platformPostId: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid post ID format'),
  authorHandle: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Invalid handle format'),
  keywordMatches: z
    .array(z.string())
    .min(1, 'Must match at least one keyword')
    .max(50, 'Too many keyword matches'),
});
