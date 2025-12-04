import { z } from 'zod';

export const AuthorSchema = z.object({
  platform: z.enum(['TWITTER', 'REDDIT', 'THREADS']),
  platformId: z.string().min(1),
  handle: z.string().min(1),
  displayName: z.string().optional(),
  followerCount: z.number().int().min(0),
  isVerified: z.boolean(),
});
