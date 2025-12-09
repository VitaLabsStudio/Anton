import { Redis } from 'ioredis';

import { logger } from './logger.js';

const REDIS_URL = process.env['REDIS_URL'] || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 1,
  connectTimeout: 2000, // 2s timeout for initial connection
  lazyConnect: true,
  retryStrategy: (times: number): number | null => {
    // Exponential backoff but give up after 3 tries if connection refused
    if (times > 3) {
      logger.warn('Redis connection retries exhausted, stopping reconnection');
      return null;
    }
    return Math.min(times * 100, 2000);
  },
});

redis.on('error', (err: Error) => {
  // Log error but don't crash
  logger.error({ err: err.message }, 'Redis connection error');
});

redis.on('connect', () => {
  logger.info('Redis connected');
});
