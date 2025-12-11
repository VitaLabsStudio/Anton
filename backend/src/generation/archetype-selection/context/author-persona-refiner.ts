/**
 * Author Persona Refiner - Derives PersonaProfile from Story 2.2 author signals + Story 2.11 power user data
 * Story 2.10: Task 1, Subtask 3
 *
 * Responsibilities:
 * - Ingest Story 2.2 author detection data (relationship score, archetypes, interaction history)
 * - Map archetypes to primary/secondary personas
 * - Calculate receptiveness from relationship score
 * - Determine relationship stage from interaction patterns
 * - Classify follower tier (if available)
 * - Integrate Story 2.11 power user signals (isPowerUser, topPerformingArchetype)
 * - Return PersonaProfile with confidence metadata
 */

import { AuthorContextAnalyzer } from '@/analysis/signal-2-author';
import type { Platform } from '@prisma/client';
import { logger } from '@/utils/logger';

import type { PersonaProfile, PersonaType, RelationshipStage, FollowerTier } from '../types';
import { DEFAULT_PERSONA_PROFILE } from '../types';

interface AuthorPersonaRefinerConfig {
  enableStory2_2Integration: boolean;
  enableStory2_11Integration: boolean;
}

const DEFAULT_CONFIG: AuthorPersonaRefinerConfig = {
  enableStory2_2Integration: true,
  enableStory2_11Integration: true, // Will be implemented when Story 2.11 is complete
};

/**
 * Refines author data into PersonaProfile
 */
export class AuthorPersonaRefiner {
  private config: AuthorPersonaRefinerConfig;
  private authorAnalyzer: AuthorContextAnalyzer;

  constructor(config: Partial<AuthorPersonaRefinerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.authorAnalyzer = new AuthorContextAnalyzer();
    logger.info({ config: this.config }, 'AuthorPersonaRefiner initialized');
  }

  /**
   * Derive PersonaProfile from author signals
   *
   * @param authorId - Author's platform-specific ID
   * @param platform - Platform (twitter, reddit, threads)
   * @param handle - Author's handle/username
   * @returns PersonaProfile with persona, receptiveness, relationship stage, etc.
   */
  public async derivePersona(
    authorId: string,
    platform: 'twitter' | 'reddit' | 'threads',
    handle?: string
  ): Promise<PersonaProfile> {
    const startTime = Date.now();

    try {
      if (!this.config.enableStory2_2Integration) {
        logger.debug('Story 2.2 integration disabled, using default persona');
        return DEFAULT_PERSONA_PROFILE;
      }

      // Convert platform string to Platform enum
      const platformEnum = platform.toUpperCase() as Platform;

      // Fetch author context from Story 2.2
      const authorContext = await this.authorAnalyzer.analyzeAuthorContext(
        platformEnum,
        authorId,
        handle || authorId
      );

      // Map to PersonaProfile
      const primaryPersona = this.mapArchetypeToPersona(authorContext.archetypes[0]);
      const secondaryPersona =
        authorContext.archetypes.length > 1
          ? this.mapArchetypeToPersona(authorContext.archetypes[1])
          : undefined;

      const receptiveness = this.calculateReceptiveness(
        authorContext.score,
        authorContext.interactionCount
      );

      const relationshipStage = this.determineRelationshipStage(
        authorContext.interactionCount,
        authorContext.score
      );

      const followerTier = await this.estimateFollowerTier(platformEnum, authorId);

      // TODO: Integrate Story 2.11 power user signals when available
      const isPowerUser = false;
      const topPerformingArchetype = undefined;

      const profile: PersonaProfile = {
        primaryPersona,
        secondaryPersona,
        receptiveness,
        relationshipStage,
        followerTier,
        isPowerUser,
        topPerformingArchetype,
        confidence: authorContext.confidence,
        timestamp: new Date(),
      };

      const duration = Date.now() - startTime;
      logger.info(
        {
          authorId,
          platform,
          primaryPersona,
          receptiveness,
          relationshipStage,
          duration,
        },
        'Persona profile derived'
      );

      return profile;
    } catch (error) {
      logger.error({ error, authorId, platform }, 'Persona derivation failed');
      return DEFAULT_PERSONA_PROFILE;
    }
  }

  /**
   * Map Story 2.2 archetypes to PersonaType
   */
  private mapArchetypeToPersona(archetype?: string): PersonaType {
    if (!archetype) {
      return 'unknown';
    }

    // Map common archetypes to persona types
    const archetypeLower = archetype.toLowerCase();

    if (archetypeLower.includes('healthcare') || archetypeLower.includes('medical')) {
      return 'healthcare_professional';
    }
    if (archetypeLower.includes('parent')) {
      return 'concerned_parent';
    }
    if (archetypeLower.includes('skeptic') || archetypeLower.includes('critical')) {
      return 'skeptic';
    }
    if (archetypeLower.includes('activist') || archetypeLower.includes('advocate')) {
      return 'activist';
    }
    if (archetypeLower.includes('researcher') || archetypeLower.includes('scientist')) {
      return 'researcher';
    }
    if (archetypeLower.includes('educator') || archetypeLower.includes('teacher')) {
      return 'educator';
    }
    if (archetypeLower.includes('learner') || archetypeLower.includes('curious')) {
      return 'curious_learner';
    }

    return 'unknown';
  }

  /**
   * Calculate receptiveness from relationship score and interaction count
   */
  private calculateReceptiveness(score: number, interactionCount: number): number {
    // Base receptiveness from relationship score (0-1)
    let receptiveness = score;

    // Boost receptiveness for users with positive interaction history
    if (interactionCount > 0) {
      receptiveness = Math.min(1.0, receptiveness * 1.1);
    }

    // High scores indicate receptive users
    if (score > 0.7) {
      receptiveness = Math.min(1.0, receptiveness * 1.05);
    }

    return Math.max(0.0, Math.min(1.0, receptiveness));
  }

  /**
   * Determine relationship stage from interaction patterns
   */
  private determineRelationshipStage(interactionCount: number, score: number): RelationshipStage {
    if (interactionCount === 0) {
      return 'first_contact';
    }

    if (interactionCount < 3) {
      return 'aware';
    }

    if (score > 0.7 && interactionCount >= 5) {
      return 'advocate';
    }

    if (score > 0.5 && interactionCount >= 3) {
      return 'engaged';
    }

    return 'aware';
  }

  /**
   * Estimate follower tier based on platform data
   * TODO: Integrate with actual follower count APIs
   */
  private async estimateFollowerTier(platform: Platform, authorId: string): Promise<FollowerTier> {
    // TODO: Fetch actual follower counts from platform APIs
    // For now, return default tier
    return 'nano'; // < 10k followers
  }

  /**
   * Integrate Story 2.11 power user signals
   * TODO: Implement when Story 2.11 is complete
   */
  private async fetchPowerUserSignals(authorId: string): Promise<{
    isPowerUser: boolean;
    topPerformingArchetype?: string;
  }> {
    // TODO: Query Story 2.11 power user detection
    return {
      isPowerUser: false,
      topPerformingArchetype: undefined,
    };
  }
}
