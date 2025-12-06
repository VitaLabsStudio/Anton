/**
 * Health Check Service
 *
 * PERF-001: Background Refresh / Caching Pattern
 * - Runs checks every 60s in background
 * - Serves cached results to avoid request-time overhead
 * - First request awaits check if cache empty
 *
 * Component Checks:
 * - Database: SELECT 1 latency check
 * - Platforms: Auth validity (Twitter, Reddit, Threads)
 * - Worker: Heartbeat activity check (TECH-001)
 * - Pipeline: Data integrity check (TECH-002)
 */

import NodeCache from 'node-cache';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { TwitterClient } from '../platforms/twitter/client.js';
import { RedditClient } from '../platforms/reddit/client.js';
import { ThreadsClient } from '../platforms/threads/client.js';
import { decisionEngine } from '../analysis/decision-engine.js';

export interface ComponentStatus {
  healthy: boolean;
  latency?: number;
  message?: string;
  lastCheck?: Date;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  components: {
    database: ComponentStatus;
    twitter: ComponentStatus;
    reddit: ComponentStatus;
    threads: ComponentStatus;
    worker: ComponentStatus;
    pipeline: ComponentStatus;
    decisionEngine: ComponentStatus;
  };
  metadata?: {
    version: string;
    uptime: number;
  };
}

export class HealthCheckService {
  private lastResult: HealthCheckResult | null = null;
  private intervalHandle?: NodeJS.Timeout;
  private readonly checkIntervalMs: number;
  private readonly workerHeartbeatThresholdMs: number;
  private readonly pipelineThresholdMs: number;

  private twitterClient?: TwitterClient;
  private redditClient?: RedditClient;
  private threadsClient?: ThreadsClient;

  // Injection for testing
  private readonly injectedTwitterClient?: TwitterClient;
  private readonly injectedRedditClient?: RedditClient;
  private readonly injectedThreadsClient?: ThreadsClient;

  constructor(options?: {
    checkIntervalMs?: number;
    workerHeartbeatThresholdMs?: number;
    pipelineThresholdMs?: number;
    twitterClient?: TwitterClient;
    redditClient?: RedditClient;
    threadsClient?: ThreadsClient;
  }) {
    this.checkIntervalMs = options?.checkIntervalMs ?? 60_000; // 60s default
    this.workerHeartbeatThresholdMs = options?.workerHeartbeatThresholdMs ?? 300_000; // 5min default
    this.pipelineThresholdMs = options?.pipelineThresholdMs ?? 3_600_000; // 1hr default

    // Store injected clients for testing (lazy initialization for production)
    this.injectedTwitterClient = options?.twitterClient;
    this.injectedRedditClient = options?.redditClient;
    this.injectedThreadsClient = options?.threadsClient;

    // Start background refresh
    this.startBackgroundRefresh();

    logger.info(
      {
        checkIntervalMs: this.checkIntervalMs,
        workerHeartbeatThresholdMs: this.workerHeartbeatThresholdMs,
        pipelineThresholdMs: this.pipelineThresholdMs,
      },
      'HealthCheckService initialized'
    );
  }

  /**
   * Get cached health check result
   * If cache is empty (first run), runs check immediately
   */
  async getHealth(): Promise<HealthCheckResult> {
    if (!this.lastResult) {
      logger.info('HealthCheckService: Cache empty, running first check');
      await this.runChecks();
    }

    return this.lastResult!;
  }

  /**
   * Lazily initialize Twitter client (or return injected one)
   */
  private getTwitterClient(): TwitterClient | null {
    if (this.injectedTwitterClient) {
      return this.injectedTwitterClient;
    }

    if (!this.twitterClient) {
      try {
        this.twitterClient = new TwitterClient();
      } catch (error) {
        logger.warn({ error }, 'HealthCheckService: Failed to initialize Twitter client');
        return null;
      }
    }

    return this.twitterClient;
  }

  /**
   * Lazily initialize Reddit client (or return injected one)
   */
  private getRedditClient(): RedditClient | null {
    if (this.injectedRedditClient) {
      return this.injectedRedditClient;
    }

    if (!this.redditClient) {
      try {
        this.redditClient = new RedditClient();
      } catch (error) {
        logger.warn({ error }, 'HealthCheckService: Failed to initialize Reddit client');
        return null;
      }
    }

    return this.redditClient;
  }

  /**
   * Lazily initialize Threads client (or return injected one)
   */
  private getThreadsClient(): ThreadsClient | null {
    if (this.injectedThreadsClient) {
      return this.injectedThreadsClient;
    }

    if (!this.threadsClient) {
      try {
        this.threadsClient = new ThreadsClient();
      } catch (error) {
        logger.warn({ error }, 'HealthCheckService: Failed to initialize Threads client');
        return null;
      }
    }

    return this.threadsClient;
  }

  /**
   * Start background refresh interval
   */
  private startBackgroundRefresh(): void {
    this.intervalHandle = setInterval(() => {
      this.runChecks().catch((error) => {
        logger.error({ error }, 'HealthCheckService: Background check failed');
      });
    }, this.checkIntervalMs);

    logger.info('HealthCheckService: Background refresh started');
  }

  /**
   * Stop background refresh
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
      logger.info('HealthCheckService: Background refresh stopped');
    }
  }

  /**
   * Run all health checks and update cache
   */
  private async runChecks(): Promise<HealthCheckResult> {
    const timestamp = new Date();

    logger.debug('HealthCheckService: Running health checks');

    // Run all checks in parallel for efficiency
    const [database, twitter, reddit, threads, worker, pipeline] = await Promise.all([
      this.checkDatabase(),
      this.checkTwitter(),
      this.checkReddit(),
      this.checkThreads(),
      this.checkWorker(),
      this.checkPipeline(),
      this.checkDecisionEngine(),
    ]);

    // Determine overall status
    const components = { database, twitter, reddit, threads, worker, pipeline, decisionEngine };
    const unhealthyCount = Object.values(components).filter((c) => !c.healthy).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount === 0) {
      status = 'healthy';
    } else if (unhealthyCount <= 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    const result: HealthCheckResult = {
      status,
      timestamp,
      components,
      metadata: {
        version: '1.0.0',
        uptime: process.uptime(),
      },
    };

    this.lastResult = result;

    logger.info(
      {
        status,
        unhealthyCount,
        components: Object.entries(components).map(([name, comp]) => ({
          name,
          healthy: comp.healthy,
        })),
      },
      'HealthCheckService: Checks complete'
    );

    return result;
  }

  /**
   * Check database connectivity and latency
   */
  private async checkDatabase(): Promise<ComponentStatus> {
    const start = Date.now();

    try {
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        healthy: true,
        latency,
        message: 'Database connected',
        lastCheck: new Date(),
      };
    } catch (error) {
      const latency = Date.now() - start;
      logger.error({ error }, 'HealthCheckService: Database check failed');

      return {
        healthy: false,
        latency,
        message: `Database error: ${(error as Error).message}`,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Check Twitter auth validity
   */
  private async checkTwitter(): Promise<ComponentStatus> {
    const start = Date.now();

    try {
      const client = this.getTwitterClient();
      if (!client) {
        const latency = Date.now() - start;
        return {
          healthy: false,
          latency,
          message: 'Twitter client unavailable (missing env vars)',
          lastCheck: new Date(),
        };
      }

      const verification = await client.verifyCredentials();
      const latency = Date.now() - start;

      return {
        healthy: verification.available,
        latency,
        message: verification.message,
        lastCheck: new Date(),
      };
    } catch (error) {
      const latency = Date.now() - start;
      logger.error({ error }, 'HealthCheckService: Twitter check failed');

      return {
        healthy: false,
        latency,
        message: `Twitter error: ${(error as Error).message}`,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Check Reddit auth validity
   */
  private async checkReddit(): Promise<ComponentStatus> {
    const start = Date.now();

    try {
      const client = this.getRedditClient();
      if (!client) {
        const latency = Date.now() - start;
        return {
          healthy: false,
          latency,
          message: 'Reddit client unavailable (missing env vars)',
          lastCheck: new Date(),
        };
      }

      const verification = await client.verifyCredentials();
      const latency = Date.now() - start;

      return {
        healthy: verification.available,
        latency,
        message: verification.message,
        lastCheck: new Date(),
      };
    } catch (error) {
      const latency = Date.now() - start;
      logger.error({ error }, 'HealthCheckService: Reddit check failed');

      return {
        healthy: false,
        latency,
        message: `Reddit error: ${(error as Error).message}`,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Check Threads auth validity
   */
  private async checkThreads(): Promise<ComponentStatus> {
    const start = Date.now();

    try {
      const client = this.getThreadsClient();
      if (!client) {
        const latency = Date.now() - start;
        return {
          healthy: false,
          latency,
          message: 'Threads client unavailable (missing env vars)',
          lastCheck: new Date(),
        };
      }

      const verification = await client.verifyCredentials();
      const latency = Date.now() - start;

      return {
        healthy: verification.available,
        latency,
        message: verification.message,
        lastCheck: new Date(),
      };
    } catch (error) {
      const latency = Date.now() - start;
      logger.error({ error }, 'HealthCheckService: Threads check failed');

      return {
        healthy: false,
        latency,
        message: `Threads error: ${(error as Error).message}`,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Check worker heartbeat (TECH-001: Activity-based, not just process existence)
   * Validates that worker has processed posts recently
   *
   * Requirements:
   * 1. Heartbeat must exist
   * 2. lastActivityAt must be within threshold (worker has processed posts recently)
   * 3. postsProcessedCount must be > 0 (actual work was done)
   */
  private async checkWorker(): Promise<ComponentStatus> {
    const start = Date.now();

    try {
      const heartbeat = await prisma.workerHeartbeat.findUnique({
        where: { workerName: 'stream-monitor' },
      });

      const latency = Date.now() - start;

      if (!heartbeat) {
        return {
          healthy: false,
          latency,
          message: 'No worker heartbeat found',
          lastCheck: new Date(),
        };
      }

      const timeSinceActivity = Date.now() - heartbeat.lastActivityAt.getTime();
      const timestampRecent = timeSinceActivity < this.workerHeartbeatThresholdMs;
      const hasProcessedPosts = heartbeat.postsProcessedCount > 0;

      // TECH-001: Worker is only healthy if BOTH conditions are true:
      // 1. Recent activity timestamp (worker has run recently and processed posts)
      // 2. Non-zero posts processed (actual work was done, not just idle cycles)
      const isHealthy = timestampRecent && hasProcessedPosts;

      // Determine appropriate message based on failure reason
      let message: string;
      if (!timestampRecent && !hasProcessedPosts) {
        message = `Worker inactive for ${Math.floor(timeSinceActivity / 60000)}min with no posts processed`;
      } else if (!timestampRecent) {
        message = `Worker inactive for ${Math.floor(timeSinceActivity / 60000)}min`;
      } else if (!hasProcessedPosts) {
        message = `Worker running but no posts processed (count: ${heartbeat.postsProcessedCount})`;
      } else {
        message = `Worker active (${heartbeat.postsProcessedCount} posts processed)`;
      }

      return {
        healthy: isHealthy,
        latency,
        message,
        lastCheck: new Date(),
      };
    } catch (error) {
      const latency = Date.now() - start;
      logger.error({ error }, 'HealthCheckService: Worker check failed');

      return {
        healthy: false,
        latency,
        message: `Worker check error: ${(error as Error).message}`,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Check data pipeline integrity (TECH-002: Simple data flow check)
   * Validates that posts are being saved to the database
   */
  private async checkPipeline(): Promise<ComponentStatus> {
    const start = Date.now();

    try {
      const threshold = new Date(Date.now() - this.pipelineThresholdMs);

      const recentPostCount = await prisma.post.count({
        where: {
          createdAt: {
            gte: threshold,
          },
        },
      });

      const latency = Date.now() - start;
      const isHealthy = recentPostCount > 0;

      return {
        healthy: isHealthy,
        latency,
        message: isHealthy
          ? `Pipeline active (${recentPostCount} posts in last hour)`
          : 'No posts saved in last hour',
        lastCheck: new Date(),
      };
    } catch (error) {
      const latency = Date.now() - start;
      logger.error({ error }, 'HealthCheckService: Pipeline check failed');

      return {
        healthy: false,
        latency,
        message: `Pipeline check error: ${(error as Error).message}`,
        lastCheck: new Date(),
      };
    }
  }

  private async checkDecisionEngine(): Promise<ComponentStatus> {
    const start = Date.now();
    try {
      const snapshot = decisionEngine.getHealthSnapshot();
      const unhealthyBreaker = snapshot.breakers.some((breaker) => breaker.state === 'open');

      const latency = Date.now() - start;
      return {
        healthy: !unhealthyBreaker,
        latency,
        message: unhealthyBreaker ? 'Decision engine has open breakers' : 'Decision engine healthy',
        metadata: {
          cache: snapshot.cache,
          breakers: snapshot.breakers,
          latency: snapshot.latency,
        },
        lastCheck: new Date(),
      };
    } catch (error) {
      const latency = Date.now() - start;
      logger.error({ error }, 'HealthCheckService: Decision engine check failed');

      return {
        healthy: false,
        latency,
        message: `Decision engine check error: ${(error as Error).message}`,
        lastCheck: new Date(),
      };
    }
  }
}
