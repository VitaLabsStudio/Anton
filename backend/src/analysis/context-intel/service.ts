import type { Post } from '@prisma/client';

import { logger } from '../../utils/logger.js';
import type { DecisionResult } from '../decision-engine.js';

export type ContextRecommendation = 'PROCEED' | 'ABORT' | 'ADJUST_MODE' | 'DEFER';

export interface ContextResult {
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  adjustedScore?: number;
  recommendation: ContextRecommendation;
  abortReason?: string;
  contextSnapshotId?: string;
  contextCost?: number;
  adjustedMode?: string;
}

export class ContextEngine {
  /**
   * Evaluates the context of a post to refine the decision.
   * @param post The post to evaluate
   * @param initialDecision The initial decision from the DecisionEngine
   */
  async evaluate(post: Post, _initialDecision: DecisionResult): Promise<ContextResult> {
    // Stub implementation for Story 2.7
    // Full implementation will be provided in Story 2.13
    logger.debug({ postId: post.id }, 'ContextEngine stub called');

    // For now, just proceed with the initial decision
    return {
      status: 'SKIPPED',
      recommendation: 'PROCEED',
      contextCost: 0,
    };
  }
}

export const contextEngine = new ContextEngine();
