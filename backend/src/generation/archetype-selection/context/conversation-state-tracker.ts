/**
 * Conversation State Tracker - Tracks thread depth, cadence, platform culture
 * Story 2.10: Task 1, Subtask 5
 */

import { logger } from '@/utils/logger';

import type { ConversationState } from '../types';
import { DEFAULT_CONVERSATION_STATE } from '../types';

interface ThreadContext {
  depth?: number;
  participantCount?: number;
}

export class ConversationStateTracker {
  constructor() {
    logger.info('ConversationStateTracker initialized');
  }

  public async summarize(
    threadContext: ThreadContext,
    platform: 'twitter' | 'reddit' | 'threads'
  ): Promise<ConversationState> {
    try {
      const threadDepth = threadContext.depth || 0;
      const cadence = this.determineCadence(threadDepth);
      const platformCultureBias = this.getPlatformCultureBias(platform);

      return {
        threadDepth,
        cadence,
        platformCultureBias,
        cooldownHint: threadDepth > 10,
        confidence: threadDepth > 0 ? 0.8 : 0.3,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error({ error }, 'Conversation state tracking failed');
      return DEFAULT_CONVERSATION_STATE;
    }
  }

  private determineCadence(depth: number): 'rapid' | 'moderate' | 'slow' | 'stale' {
    if (depth > 20) return 'rapid';
    if (depth > 10) return 'moderate';
    if (depth > 3) return 'slow';
    return 'stale';
  }

  private getPlatformCultureBias(platform: string): number {
    const biases: Record<string, number> = {
      twitter: 0.2, // More confrontational
      reddit: -0.1, // More discussion-oriented
      threads: 0.0, // Neutral
    };
    return biases[platform] || 0.0;
  }
}
