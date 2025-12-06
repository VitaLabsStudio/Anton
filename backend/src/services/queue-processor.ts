import type { Post, Author, OperationalMode } from '@prisma/client';

import { contextEngine, type ContextResult } from '../analysis/context-intel/service.js';
import { decisionEngine } from '../analysis/decision-engine.js';
import { CircuitBreaker } from '../utils/circuit-breaker.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../utils/prisma.js';
import { withRetry } from '../utils/retry.js';

export class QueueProcessor {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private readonly POLLING_INTERVAL_MS = 30000;
  private contextBreaker: CircuitBreaker;

  constructor() {
    this.contextBreaker = new CircuitBreaker({
        threshold: 5,
        timeout: 30000
    });
  }

  /**
   * Starts the polling loop
   */
  public start(): void {
    if (this.intervalId) {
      logger.warn('QueueProcessor already started');
      return;
    }

    logger.info('Starting QueueProcessor with 30s polling interval');
    
    // Run immediately
    void this.processBatch();
    
    // Schedule periodic run
    this.intervalId = setInterval(() => {
      void this.processBatch();
    }, this.POLLING_INTERVAL_MS);
  }

  /**
   * Stops the polling loop
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('QueueProcessor stopped');
    }
  }

  /**
   * Processes a batch of posts
   * @private
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing) {
      logger.debug('QueueProcessor still processing previous batch, skipping');
      return;
    }

    this.isProcessing = true;

    try {
      // Step 0: Fetch Batch
      const posts = await prisma.post.findMany({
        where: { processedAt: null },
        take: 20,
        orderBy: { detectedAt: 'asc' },
        include: { author: true },
      });

      if (posts.length === 0) {
        logger.debug('No unprocessed posts found');
        return;
      }

      logger.info({ count: posts.length }, 'Processing batch of posts');

      // Step 1: Initial Signal Analysis
      await Promise.allSettled(posts.map((post) => this.processPost(post as Post & { author: Author })));

    } catch (error) {
      logger.error({ error }, 'Error in QueueProcessor processing loop');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual post
   */
  private async processPost(post: Post & { author: Author }): Promise<void> {
    const startTime = Date.now();
    try {
      logger.debug({ postId: post.id }, 'Running Initial Signal Analysis');
      
      // Step 1: Initial Signal Analysis
      // analyzePost calculates signals, makes a decision, and SAVES it (setting processedAt)
      const decision = await decisionEngine.analyzePost(post, post.author);
      
      // Step 2: Context Enrichment Gate
      // Trigger if score >= 0.65 OR power_user OR competitor_detected
      const shouldEnrich = 
        decision.compositeScore >= 0.65 || 
        decision.isPowerUser || 
        !!decision.competitorDetected;

      if (shouldEnrich) {
        logger.info({ postId: post.id }, 'Triggering Context Enrichment');
        
        let contextResult: ContextResult;
        const TIMEOUT_MS = 6000;

        try {
           // Wrap with retry and breaker
           contextResult = await withRetry(
             () => this.contextBreaker.execute(async () => {
                 const contextPromise = contextEngine.evaluate(post, decision);
                 const timeoutPromise = new Promise<ContextResult>((_, reject) => 
                     setTimeout(() => reject(new Error('ContextEngine timeout')), TIMEOUT_MS)
                 );
                 return Promise.race([contextPromise, timeoutPromise]);
             }),
             { isCircuitBreakerOpen: () => this.contextBreaker.getState() === 'OPEN' },
             { maxRetries: 3, baseDelayMs: 1000 }
           );
        } catch (error) {
            logger.warn({ error, postId: post.id }, 'ContextEngine failed or timed out after retries, proceeding with initial decision');
            contextResult = { status: 'FAILED', recommendation: 'PROCEED' };
        }

        // Step 3: Re-Evaluation logic
        if (contextResult.recommendation === 'ABORT') {
            logger.info({ postId: post.id, reason: contextResult.abortReason }, 'Aborting engagement based on context');
            
            await prisma.decision.updateMany({
                where: { postId: post.id },
                data: {
                    mode: 'DISENGAGED',
                    reviewReason: contextResult.abortReason || 'Context Abort',
                }
            });
            
            logger.info({ postId: post.id, durationMs: Date.now() - startTime, outcome: 'ABORTED' }, 'Post processing complete');
            return; 
        } else if (contextResult.recommendation === 'ADJUST_MODE' && contextResult.adjustedMode) {
            logger.info({ postId: post.id, newMode: contextResult.adjustedMode }, 'Adjusting decision mode based on context');
             await prisma.decision.updateMany({
                where: { postId: post.id },
                data: {
                    mode: contextResult.adjustedMode as OperationalMode,
                }
            });
        }

        if (contextResult.contextCost) {
             logger.info({ postId: post.id, contextCost: contextResult.contextCost }, 'Context budget consumed');
        }
        
        logger.info({ postId: post.id, durationMs: Date.now() - startTime, outcome: 'STEP2_COMPLETE' }, 'Post processing complete (With Context)');

      } else {
         logger.info({ postId: post.id, durationMs: Date.now() - startTime, outcome: 'STEP1_COMPLETE' }, 'Post processing complete (No Context)');
      }

    } catch (error) {
      logger.error({ error, postId: post.id }, 'Failed to process post');
    }
  }
}