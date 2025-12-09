import { z } from 'zod';

import type { Post } from '../IPlatformClient.js';

const ZodThreadsAuthor = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string().optional(),
});

const ZodThreadsPost = z.object({
  id: z.string(),
  text: z
    .string()
    .nullable()
    .transform((value) => value ?? ''),
  author: ZodThreadsAuthor,
  created_at: z.string().optional(),
});

export const ZodThreadsSearchResponse = z.object({
  data: z.array(ZodThreadsPost),
  meta: z
    .object({
      next_token: z.string().optional(),
    })
    .optional(),
});

export function toInternalPost(thread: z.infer<typeof ZodThreadsPost>): Post {
  return {
    id: thread.id,
    content: thread.text,
    author: {
      id: thread.author.id,
      name: thread.author.username,
    },
  };
}
