/**
 * Competitor Strategy Engine - Detects and analyzes competitor strategies
 * Story 2.10: Task 1, Subtask 4
 *
 * Responsibilities:
 * - Detect competitor presence from upstream signals
 * - Map competitor tactics to archetype taxonomy
 * - Determine aggressiveness level
 * - Calculate recommended counter-weight deltas
 * - Cache results with 30-minute TTL
 */

import { logger } from '@/utils/logger';
import { redis } from '@/utils/redis';

import type { CompetitorIntent, AggressivenessLevel, CompetitorArchetype } from '../types';
import { DEFAULT_COMPETITOR_INTENT } from '../types';

interface CompetitorStrategyEngineConfig {
  enableCaching: boolean;
  cacheTTL: number; // seconds
  enableTaxonomyMapping: boolean;
}

const DEFAULT_CONFIG: CompetitorStrategyEngineConfig = {
  enableCaching: true,
  cacheTTL: 1800, // 30 minutes
  enableTaxonomyMapping: true,
};

interface CompetitorSignals {
  detected: boolean;
  handles?: string[];
  content?: string;
  platform: 'twitter' | 'reddit' | 'threads';
}

/**
 * Analyzes competitor strategies and recommends counter-tactics
 */
export class CompetitorStrategyEngine {
  private config: CompetitorStrategyEngineConfig;
  private cacheKeyPrefix = 'competitor-intent';

  constructor(config: Partial<CompetitorStrategyEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.info({ config: this.config }, 'CompetitorStrategyEngine initialized');
  }

  /**
   * Map competitor signals to CompetitorIntent with counter-strategy
   *
   * @param signals - Competitor detection signals
   * @param postId - Post ID for caching
   * @returns CompetitorIntent with archetype, aggressiveness, and counter-weights
   */
  public async mapCompetitorSignals(
    signals: CompetitorSignals,
    postId: string
  ): Promise<CompetitorIntent> {
    const startTime = Date.now();

    try {
      // If no competitor detected, return neutral intent
      if (!signals.detected || !signals.handles || signals.handles.length === 0) {
        return DEFAULT_COMPETITOR_INTENT;
      }

      // Check cache first
      const cached = await this.getCachedIntent(postId);
      if (cached) {
        logger.debug({ postId }, 'Competitor intent cache hit');
        return cached;
      }

      logger.debug({ postId, handles: signals.handles }, 'Analyzing competitor strategy');

      // Detect competitor archetype from content/handles
      const archetype = await this.detectCompetitorArchetype(signals);

      // Determine aggressiveness level
      const aggressiveness = this.assessAggressiveness(signals, archetype);

      // Calculate counter-weight deltas
      const recommendedCounterWeights = this.calculateCounterWeights(archetype, aggressiveness);

      const intent: CompetitorIntent = {
        detected: true,
        archetype,
        aggressiveness,
        recommendedCounterWeights,
        confidence: 0.7, // Base confidence for competitor detection
        timestamp: new Date(),
      };

      // Cache the result
      await this.cacheIntent(postId, intent);

      const duration = Date.now() - startTime;
      logger.info(
        {
          postId,
          archetype,
          aggressiveness,
          counterWeightsCount: recommendedCounterWeights.size,
          duration,
        },
        'Competitor strategy mapped'
      );

      return intent;
    } catch (error) {
      logger.error({ error, postId }, 'Competitor strategy mapping failed');
      return DEFAULT_COMPETITOR_INTENT;
    }
  }

  /**
   * Detect competitor archetype from signals
   * TODO: Implement ML-based detection or pattern matching
   */
  private async detectCompetitorArchetype(
    signals: CompetitorSignals
  ): Promise<CompetitorArchetype> {
    // TODO: Implement archetype detection using:
    // - Content analysis (fear-mongering, authority-challenging, echo chamber patterns)
    // - Handle pattern matching
    // - Historical behavior analysis
    //
    // For now, use simple keyword-based detection
    const content = signals.content?.toLowerCase() || '';
    const handles = signals.handles?.map((h) => h.toLowerCase()) || [];

    // Fear-mongering patterns
    if (
      content.includes('danger') ||
      content.includes('warning') ||
      content.includes('unsafe') ||
      content.includes('risk')
    ) {
      return 'fear_monger';
    }

    // Authority-challenging patterns
    if (
      content.includes('corrupt') ||
      content.includes('conspiracy') ||
      content.includes('lies') ||
      content.includes('cover-up')
    ) {
      return 'authority_challenger';
    }

    // Echo chamber patterns
    const hasGroupKeywords =
      content.includes('they') || content.includes('them') || content.includes('mainstream');
    const hasReinforcementKeywords =
      content.includes('agree') || content.includes('exactly') || content.includes('truth');
    if (hasGroupKeywords && hasReinforcementKeywords) {
      return 'echo_chamber';
    }

    return 'unknown';
  }

  /**
   * Assess aggressiveness level of competitor tactics
   */
  private assessAggressiveness(
    signals: CompetitorSignals,
    archetype: CompetitorArchetype
  ): AggressivenessLevel {
    const content = signals.content?.toLowerCase() || '';

    // Count aggressive indicators
    let aggressiveScore = 0;

    // Exclamation marks and all-caps
    const exclamationCount = (content.match(/!/g) || []).length;
    const capsWords = content.split(' ').filter((word) => word === word.toUpperCase());
    aggressiveScore += exclamationCount * 0.1;
    aggressiveScore += capsWords.length * 0.15;

    // Aggressive keywords
    const aggressiveKeywords = ['attack', 'destroy', 'never', 'always', 'evil', 'scam', 'fraud'];
    aggressiveKeywords.forEach((keyword) => {
      if (content.includes(keyword)) {
        aggressiveScore += 0.2;
      }
    });

    // Archetype-based baseline
    if (archetype === 'fear_monger') {
      aggressiveScore += 0.3;
    } else if (archetype === 'authority_challenger') {
      aggressiveScore += 0.2;
    }

    // Map score to level
    if (aggressiveScore >= 1.5) {
      return 'extreme';
    } else if (aggressiveScore >= 0.8) {
      return 'high';
    } else if (aggressiveScore >= 0.4) {
      return 'moderate';
    }
    return 'low';
  }

  /**
   * Calculate recommended counter-weight deltas for archetypes
   */
  private calculateCounterWeights(
    archetype: CompetitorArchetype,
    aggressiveness: AggressivenessLevel
  ): Map<string, number> {
    const counterWeights = new Map<string, number>();

    // Base multiplier from aggressiveness
    const aggMultiplier = this.getAggressivenessMultiplier(aggressiveness);

    // Counter-strategy based on competitor archetype
    switch (archetype) {
      case 'fear_monger':
        // Counter with calm, evidence-based archetypes
        counterWeights.set('CREDIBILITY_ANCHOR', 0.08 * aggMultiplier);
        counterWeights.set('MYTH_BUST', 0.06 * aggMultiplier);
        counterWeights.set('COACH', 0.04 * aggMultiplier);
        break;

      case 'authority_challenger':
        // Counter with transparent, authority-building archetypes
        counterWeights.set('CREDIBILITY_ANCHOR', 0.1 * aggMultiplier);
        counterWeights.set('EVIDENCE_ANCHOR', 0.08 * aggMultiplier);
        counterWeights.set('TRANSPARENCY_ADVOCATE', 0.05 * aggMultiplier);
        break;

      case 'echo_chamber':
        // Counter with diverse perspective archetypes
        counterWeights.set('PERSPECTIVE_SHIFTER', 0.07 * aggMultiplier);
        counterWeights.set('NUANCE_SPECIALIST', 0.06 * aggMultiplier);
        counterWeights.set('CURIOSITY_CATALYST', 0.04 * aggMultiplier);
        break;

      case 'unknown':
      default:
        // Neutral counter-strategy
        counterWeights.set('COACH', 0.03 * aggMultiplier);
        break;
    }

    return counterWeights;
  }

  /**
   * Get multiplier based on aggressiveness level
   */
  private getAggressivenessMultiplier(aggressiveness: AggressivenessLevel): number {
    switch (aggressiveness) {
      case 'extreme':
        return 2.0;
      case 'high':
        return 1.5;
      case 'moderate':
        return 1.0;
      case 'low':
      default:
        return 0.5;
    }
  }

  /**
   * Get cached competitor intent
   */
  private async getCachedIntent(postId: string): Promise<CompetitorIntent | null> {
    if (!this.config.enableCaching) {
      return null;
    }

    try {
      const cacheKey = `${this.cacheKeyPrefix}:${postId}`;
      const cached = await redis.get(cacheKey);

      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached) as CompetitorIntent;
      // Convert timestamp string back to Date
      parsed.timestamp = new Date(parsed.timestamp);
      // Convert recommendedCounterWeights object back to Map
      parsed.recommendedCounterWeights = new Map(
        Object.entries(parsed.recommendedCounterWeights as any)
      );
      return parsed;
    } catch (error) {
      logger.warn({ error, postId }, 'Competitor intent cache retrieval failed');
      return null;
    }
  }

  /**
   * Cache competitor intent with TTL
   */
  private async cacheIntent(postId: string, intent: CompetitorIntent): Promise<void> {
    if (!this.config.enableCaching) {
      return;
    }

    try {
      const cacheKey = `${this.cacheKeyPrefix}:${postId}`;
      // Convert Map to object for JSON serialization
      const intentToCache = {
        ...intent,
        recommendedCounterWeights: Object.fromEntries(intent.recommendedCounterWeights),
      };
      await redis.setex(cacheKey, this.config.cacheTTL, JSON.stringify(intentToCache));
      logger.debug({ postId, ttl: this.config.cacheTTL }, 'Competitor intent cached');
    } catch (error) {
      logger.warn({ error, postId }, 'Competitor intent cache storage failed');
    }
  }

  /**
   * Clear cache for a specific post
   */
  public async clearCache(postId: string): Promise<void> {
    try {
      const cacheKey = `${this.cacheKeyPrefix}:${postId}`;
      await redis.del(cacheKey);
      logger.debug({ postId }, 'Competitor intent cache cleared');
    } catch (error) {
      logger.warn({ error, postId }, 'Competitor intent cache clear failed');
    }
  }
}
