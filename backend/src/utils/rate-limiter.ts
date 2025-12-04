import Bottleneck from 'bottleneck';

import { logger } from './logger.js';

interface RateLimiterConfig {
  read: {
    maxRequests: number;
    windowMs: number;
  };
  write: {
    maxRequests: number;
    windowMs: number;
  };
}

export class RateLimiter {
  private readLimiter: Bottleneck;
  private writeLimiter: Bottleneck;
  constructor(config: RateLimiterConfig) {
    // Read limiter
    this.readLimiter = new Bottleneck({
      reservoir: config.read.maxRequests,
      reservoirRefreshAmount: config.read.maxRequests,
      reservoirRefreshInterval: config.read.windowMs,
      maxConcurrent: 10,
      minTime: Math.floor(config.read.windowMs / config.read.maxRequests),
    });

    // Write limiter
    this.writeLimiter = new Bottleneck({
      reservoir: config.write.maxRequests,
      reservoirRefreshAmount: config.write.maxRequests,
      reservoirRefreshInterval: config.write.windowMs,
      maxConcurrent: 5,
      minTime: Math.floor(config.write.windowMs / config.write.maxRequests),
    });

    // Event monitoring
    this.readLimiter.on('depleted', () => {
      logger.warn('Read rate limit depleted, queuing requests');
    });

    this.writeLimiter.on('depleted', () => {
      logger.warn('Write rate limit depleted, queuing requests');
    });

    this.readLimiter.on('idle', () => {
      logger.info('Read rate limiter queue drained');
    });

    this.writeLimiter.on('idle', () => {
      logger.info('Write rate limiter queue drained');
    });
  }

  async scheduleRead<T>(fn: () => Promise<T>): Promise<T> {
    const queueSize = this.readLimiter.counts().QUEUED;
    if (queueSize > 50) {
      logger.warn(`Read queue growing large: ${queueSize} requests queued`);
    }

    return this.readLimiter.schedule(async () => {
      logger.debug('Executing rate-limited read operation');
      return await fn();
    });
  }

  async scheduleWrite<T>(fn: () => Promise<T>): Promise<T> {
    const queueSize = this.writeLimiter.counts().QUEUED;
    if (queueSize > 20) {
      logger.warn(`Write queue growing large: ${queueSize} requests queued`);
    }

    return this.writeLimiter.schedule(async () => {
      logger.debug('Executing rate-limited write operation');
      return await fn();
    });
  }

  getStatus(): { read: Bottleneck.Counts; write: Bottleneck.Counts } {
    return {
      read: this.readLimiter.counts(),
      write: this.writeLimiter.counts(),
    };
  }

  async stop(): Promise<void> {
    await Promise.all([this.readLimiter.stop(), this.writeLimiter.stop()]);
    logger.info('Rate limiters stopped');
  }
}

export const twitterRateLimiter = new RateLimiter({
  read: {
    maxRequests: 900,
    windowMs: 15 * 60 * 1000,
  },
  write: {
    maxRequests: 300,
    windowMs: 15 * 60 * 1000,
  },
});

export const redditRateLimiter = new RateLimiter({
  read: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 60 requests per minute
  },
  write: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 writes per minute (conservative)
  },
});

export const threadsRateLimiter = new RateLimiter({
  read: {
    maxRequests: 200,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  write: {
    maxRequests: 200,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
});
