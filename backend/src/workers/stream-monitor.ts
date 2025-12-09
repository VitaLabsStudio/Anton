/**
 * Stream Monitor Worker
 *
 * Core pipeline: Fetch → KeywordMatcher → SpamFilter → KarmaGate → Prisma upsert
 *
 * Features:
 * - PM2-managed worker process
 * - Temporal intelligence (adaptive polling based on time-of-week)
 * - Idempotent upserts (DATA-001)
 * - Comprehensive telemetry logging
 * - Graceful degradation for platform failures
 */

import type { Platform, Prisma } from '@prisma/client';

import { RedditClient } from '../platforms/reddit/client.js';
import { RedditMonitor } from '../platforms/reddit/monitor.js';
import { ThreadsMonitor } from '../platforms/threads/monitor.js';
import { TwitterMonitor } from '../platforms/twitter/monitor.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../utils/prisma.js';

import { analyzePostSignals, type SignalAnalysisResult } from './analysis/post-signal-analyzer.js';
import { getTemporalContext } from '../analysis/temporal-migration.js';
import { karmaGate, type KarmaGateResult } from './guards/karma-gate.js';
import { keywordMatcher } from './keyword-matcher.js';
import { spamFilter } from './spam-filter.js';
import type { DetectedPost } from './types.js';

interface FunnelMetrics {
  scanned: number;
  matched: number;
  passedSpamFilter: number;
  saved: number;
  errors: number;
  karmaGateBlocked: number;
  semanticFiltered: number;
  analysisRuns: number;
  totalAnalysisTimeMs: number;
}

interface WorkerConfig {
  baseInterval: number; // milliseconds
  enabled: boolean;
}

export class StreamMonitorWorker {
  private twitterMonitor: TwitterMonitor;
  private redditMonitor: RedditMonitor;
  private threadsMonitor: ThreadsMonitor;
  private redditClient: RedditClient;

  private config: WorkerConfig;
  private isRunning = false;
  private loopHandle?: NodeJS.Timeout;
  private funnelMetrics: FunnelMetrics = {
    scanned: 0,
    matched: 0,
    passedSpamFilter: 0,
    saved: 0,
    errors: 0,
    karmaGateBlocked: 0,
    semanticFiltered: 0,
    analysisRuns: 0,
    totalAnalysisTimeMs: 0,
  };

  constructor(config?: Partial<WorkerConfig>) {
    this.config = {
      baseInterval: config?.baseInterval ?? 60_000, // 1 minute default
      enabled: config?.enabled ?? true,
    };

    // Initialize monitors
    this.twitterMonitor = new TwitterMonitor();
    this.redditMonitor = new RedditMonitor();
    this.threadsMonitor = new ThreadsMonitor();
    this.redditClient = new RedditClient();

    logger.info(
      {
        baseInterval: this.config.baseInterval,
        enabled: this.config.enabled,
      },
      'StreamMonitorWorker initialized'
    );
  }

  /**
   * Start the monitoring loop
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      logger.warn('StreamMonitorWorker is disabled');
      return;
    }

    if (this.isRunning) {
      logger.warn('StreamMonitorWorker already running');
      return;
    }

    this.isRunning = true;

    logger.info('StreamMonitorWorker starting...');

    // Log keyword matcher stats
    const matcherStats = keywordMatcher.getStats();
    logger.info(matcherStats, 'KeywordMatcher configuration');

    // Log karma gate status
    await karmaGate.logStatus(this.redditClient);

    // Start monitoring loop
    await this.loop();
  }

  /**
   * Stop the monitoring loop
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('StreamMonitorWorker not running');
      return;
    }

    this.isRunning = false;

    if (this.loopHandle) {
      clearTimeout(this.loopHandle);
      this.loopHandle = undefined;
    }

    logger.info('StreamMonitorWorker stopped');
    this.logFunnelMetrics();
  }

  /**
   * Main monitoring loop
   */
  private async loop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.scanCycle();
    } catch (error) {
      logger.error({ error }, 'StreamMonitorWorker: Scan cycle failed');
      this.funnelMetrics.errors++;
    }

    // Calculate next interval using temporal context
    const temporalContext = getTemporalContext(new Date());
    const monitoringMultiplier = temporalContext.monitoringMultiplier ?? 1.0;
    
    // Safety check: ensure multiplier is positive
    const safeMultiplier = Math.max(0.1, monitoringMultiplier);
    const adjustedInterval = Math.floor(this.config.baseInterval / safeMultiplier);

    logger.info(
      {
        baseInterval: this.config.baseInterval,
        adjustedInterval,
        monitoringMultiplier: safeMultiplier,
        temporalPhase: temporalContext.phase,
      },
      'temporal_monitoring_adjusted'
    );

    // Schedule next cycle
    this.loopHandle = setTimeout(() => this.loop(), adjustedInterval);
  }

  /**
   * Execute one scan cycle across all platforms
   */
  private async scanCycle(): Promise<void> {
    const cycleStart = Date.now();

    // Reset metrics at the start of each cycle to track per-cycle counts
    this.resetMetrics();

    logger.info('StreamMonitorWorker: Starting scan cycle');

    // Get all keywords from matcher
    const allKeywords = Object.values(keywordMatcher['config'].categories).flatMap(
      (cat) => cat.terms
    );

    // Scan all platforms in parallel
    const [twitterPosts, redditPosts, threadsPosts] = await Promise.allSettled([
      this.twitterMonitor.scan(allKeywords),
      this.redditMonitor.scan(allKeywords),
      this.threadsMonitor.scan(allKeywords),
    ]);

    const allPosts: DetectedPost[] = [
      ...(twitterPosts.status === 'fulfilled' ? twitterPosts.value : []),
      ...(redditPosts.status === 'fulfilled' ? redditPosts.value : []),
      ...(threadsPosts.status === 'fulfilled' ? threadsPosts.value : []),
    ];

    this.funnelMetrics.scanned += allPosts.length;

    const redditPostCount = redditPosts.status === 'fulfilled' ? redditPosts.value.length : 0;

    logger.info(
      {
        total: allPosts.length,
        twitter: twitterPosts.status === 'fulfilled' ? twitterPosts.value.length : 0,
        reddit: redditPostCount,
        threads: threadsPosts.status === 'fulfilled' ? threadsPosts.value.length : 0,
      },
      'StreamMonitorWorker: Posts fetched'
    );

    // Pre-fetch karma gate result ONCE for this cycle (avoids per-post API calls)
    // Only fetch if there are Reddit posts to process
    let cachedKarmaResult: KarmaGateResult | null = null;
    if (redditPostCount > 0) {
      cachedKarmaResult = await karmaGate.checkCached(this.redditClient);

      logger.info(
        {
          allowed: cachedKarmaResult.allowed,
          karma: cachedKarmaResult.karma,
          accountAge: cachedKarmaResult.accountAge,
          redditPostCount,
          cacheStatus: karmaGate.getCacheStatus(),
        },
        'StreamMonitorWorker: KarmaGate pre-check for cycle'
      );
    }

    // Process pipeline: Match → SpamFilter → KarmaGate → Upsert
    for (const post of allPosts) {
      try {
        await this.processPost(post, cachedKarmaResult);
      } catch (error) {
        logger.error(
          { error, post: post.platformPostId },
          'StreamMonitorWorker: Failed to process post'
        );
        this.funnelMetrics.errors++;
      }
    }

    const cycleDuration = Date.now() - cycleStart;

    // Update worker heartbeat (TECH-001: Activity-based health check)
    await this.updateHeartbeat(this.funnelMetrics.saved);

    logger.info(
      {
        duration: cycleDuration,
        ...this.funnelMetrics,
      },
      'StreamMonitorWorker: Scan cycle complete'
    );
  }

  /**
   * Process individual post through pipeline
   * @param post - The detected post to process
   * @param cachedKarmaResult - Pre-fetched karma gate result for this scan cycle (Reddit only)
   */
  private async processPost(
    post: DetectedPost,
    cachedKarmaResult: KarmaGateResult | null
  ): Promise<void> {
    // Step 1: Keyword Matching (already done by monitors, but verify)
    const matchResult = keywordMatcher.getMatches(post.content);

    if (!matchResult.matched) {
      // Post didn't match keywords (shouldn't happen from monitors)
      return;
    }

    this.funnelMetrics.matched++;

    // Step 2: Spam Filter
    const spamCheck = spamFilter.check(post.content, {
      isVerified: post.isVerified,
      followerCount: post.followerCount,
    });

    if (spamCheck.isSpam) {
      logger.debug(
        {
          postId: post.platformPostId,
          reason: spamCheck.reason,
        },
        'StreamMonitorWorker: Post filtered as spam'
      );
      return;
    }

    this.funnelMetrics.passedSpamFilter++;

    const analysisResult = await this.runSignalAnalysis(post);

    if (analysisResult && this.shouldSkipDueToSemantic(analysisResult.semantic)) {
      this.funnelMetrics.semanticFiltered++;
      logger.info(
        {
          postId: post.platformPostId,
          semanticScore: analysisResult.semantic.score,
          semanticContext: analysisResult.semantic.context,
          pattern: analysisResult.semantic.detectedPattern,
        },
        'StreamMonitorWorker: Post excluded by semantic topic filter'
      );
      return;
    }

    // Step 3: Karma Gate (Reddit only) - uses cached result from cycle pre-fetch
    if (post.platform === 'REDDIT' && cachedKarmaResult) {
      if (!cachedKarmaResult.allowed) {
        logger.warn(
          {
            postId: post.platformPostId,
            reason: cachedKarmaResult.reason,
          },
          'StreamMonitorWorker: Reddit post blocked by KarmaGate (cached)'
        );
        this.funnelMetrics.karmaGateBlocked++;
        // Continue to save post, but mark that we can't interact
      }
    }

    // Step 4: Upsert to database (DATA-001: Idempotent)
    await this.upsertPost(post, matchResult.categories, matchResult.matches);

    this.funnelMetrics.saved++;
  }

  /**
   * Upsert post to database with idempotency
   */
  private async upsertPost(
    post: DetectedPost,
    categories: string[],
    matches: string[]
  ): Promise<void> {
    // First, ensure author exists
    const author = await prisma.author.upsert({
      where: {
        platform_platformId: {
          platform: post.platform as Platform,
          platformId: post.authorId,
        },
      },
      create: {
        platform: post.platform as Platform,
        platformId: post.authorId,
        handle: post.authorHandle,
        displayName: post.authorDisplayName,
        followerCount: post.followerCount ?? 0,
        isVerified: post.isVerified ?? false,
      },
      update: {
        handle: post.authorHandle,
        displayName: post.authorDisplayName,
        followerCount: post.followerCount ?? 0,
        isVerified: post.isVerified ?? false,
        lastSeenAt: new Date(),
      },
    });

    // Upsert post (idempotent due to unique constraint)
    await prisma.post.upsert({
      where: {
        platform_platformPostId: {
          platform: post.platform as Platform,
          platformPostId: post.platformPostId,
        },
      },
      create: {
        platform: post.platform as Platform,
        platformPostId: post.platformPostId,
        authorId: author.id,
        content: post.content,
        detectedAt: post.detectedAt,
        keywordMatches: matches,
        keywordCategories: categories,
        rawMetrics: (post.rawMetrics ?? {}) as Prisma.JsonObject,
      },
      update: {
        // Update content and metrics if post was re-fetched
        content: post.content,
        keywordMatches: matches,
        keywordCategories: categories,
        rawMetrics: (post.rawMetrics ?? {}) as Prisma.JsonObject,
      },
    });

    logger.debug(
      {
        platform: post.platform,
        postId: post.platformPostId,
        author: post.authorHandle,
        categories,
      },
      'StreamMonitorWorker: Post upserted'
    );
  }

  private async runSignalAnalysis(post: DetectedPost): Promise<SignalAnalysisResult | null> {
    try {
      const result = await analyzePostSignals(post.content);
      this.funnelMetrics.analysisRuns++;
      this.funnelMetrics.totalAnalysisTimeMs += result.durationMs;

      logger.debug(
        {
          postId: post.platformPostId,
          durationMs: result.durationMs,
          semanticScore: result.semantic.score,
          semanticContext: result.semantic.context,
          linguisticScore: result.linguistic.score,
        },
        'StreamMonitorWorker: Signal analysis results'
      );

      return result;
    } catch (error) {
      logger.error(
        {
          postId: post.platformPostId,
          error,
        },
        'StreamMonitorWorker: Signal analysis failed'
      );
      return null;
    }
  }

  private shouldSkipDueToSemantic(semantic: SignalAnalysisResult['semantic']): boolean {
    return semantic.context === 'metaphor' && semantic.score <= 0.2;
  }

  /**
   * Log funnel metrics summary
   */
  private logFunnelMetrics(): void {
    const conversionRate =
      this.funnelMetrics.scanned > 0
        ? ((this.funnelMetrics.saved / this.funnelMetrics.scanned) * 100).toFixed(2)
        : '0.00';
    const averageAnalysisMs =
      this.funnelMetrics.analysisRuns > 0
        ? (this.funnelMetrics.totalAnalysisTimeMs / this.funnelMetrics.analysisRuns).toFixed(1)
        : '0';

    logger.info(
      {
        ...this.funnelMetrics,
        conversionRate: `${conversionRate}%`,
        averageAnalysisMs,
      },
      'StreamMonitorWorker: Funnel metrics'
    );
  }

  /**
   * Update worker heartbeat in database
   * TECH-001: Activity-based heartbeat (tracks posts processed, not just alive status)
   * Only updates lastActivityAt when posts are actually processed to prevent false positives
   */
  private async updateHeartbeat(postsProcessedInCycle: number): Promise<void> {
    try {
      // Only update lastActivityAt when actual work is done (posts processed)
      // This ensures health check can detect idle workers vs active workers
      const updateData: {
        postsProcessedCount: number;
        lastActivityAt?: Date;
      } = {
        postsProcessedCount: postsProcessedInCycle,
      };

      if (postsProcessedInCycle > 0) {
        updateData.lastActivityAt = new Date();
      }

      await prisma.workerHeartbeat.upsert({
        where: { workerName: 'stream-monitor' },
        create: {
          workerName: 'stream-monitor',
          postsProcessedCount: postsProcessedInCycle,
          lastActivityAt: new Date(),
          metadata: {
            version: '1.0.0',
            baseInterval: this.config.baseInterval,
          },
        },
        update: updateData,
      });

      logger.debug(
        { postsProcessedInCycle, activityUpdated: postsProcessedInCycle > 0 },
        'StreamMonitorWorker: Heartbeat updated'
      );
    } catch (error) {
      logger.error({ error }, 'StreamMonitorWorker: Failed to update heartbeat');
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): FunnelMetrics {
    return { ...this.funnelMetrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.funnelMetrics = {
      scanned: 0,
      matched: 0,
      passedSpamFilter: 0,
      saved: 0,
      errors: 0,
      karmaGateBlocked: 0,
      semanticFiltered: 0,
      analysisRuns: 0,
      totalAnalysisTimeMs: 0,
    };
  }
}

// Main entry point when run as PM2 process
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new StreamMonitorWorker();

  // Graceful shutdown handlers
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully');
    worker.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    worker.stop();
    process.exit(0);
  });

  // Start worker
  worker.start().catch((error) => {
    logger.error({ error }, 'Failed to start StreamMonitorWorker');
    process.exit(1);
  });
}
