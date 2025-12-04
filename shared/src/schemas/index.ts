/**
 * Shared Zod schemas for validation
 */

export * from './post.js';
export * from './reply.js';
export * from './author.js';

import { z } from 'zod';

// Platform schema
export const platformSchema = z.enum(['twitter', 'reddit', 'threads']);

// Decision mode schema
export const decisionModeSchema = z.enum(['AUTO_POST', 'APPROVE', 'SKIP', 'ESCALATE']);

// Health check response schema
export const healthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string(),
  version: z.string(),
  services: z.record(z.boolean()).optional(),
});

// API response schema factory
export function createApiResponseSchema<T extends z.ZodTypeAny>(
  dataSchema: T
): z.ZodObject<{
  success: z.ZodBoolean;
  data: z.ZodOptional<T>;
  error: z.ZodOptional<
    z.ZodObject<{
      code: z.ZodString;
      message: z.ZodString;
    }>
  >;
}> {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .optional(),
  });
}
