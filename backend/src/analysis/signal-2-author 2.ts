import type { Author, Platform } from '@prisma/client';

import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';

export interface SignalResult {
  score: number;
  confidence: number;
  archetypes: string[];
  interactionCount: number;
}

export interface InteractionEvent {
  type: 'thanks' | 'click' | 'purchase' | 'block' | 'report' | 'hostile_reply';
  timestamp: string;
  context?: Record<string, unknown>;
}

const INTERACTION_WEIGHTS: Record<string, number> = {
  thanks: 0.15,
  click: 0.10,
  purchase: 0.25,
  block: -0.30,
  report: -0.40,
  hostile_reply: -0.20,
};

const BASE_SCORE = 0.50;

export class AuthorContextAnalyzer {
  /**
   * Analyzes the author context to determine the relationship score and archetypes.
   *
   * @param platform - The social platform (TWITTER, REDDIT, THREADS)
   * @param platformId - The unique ID of the author on the platform
   * @param handle - The author's handle/username
   * @returns A SignalResult containing the score and detected archetypes
   */
  async analyzeAuthorContext(
    platform: Platform,
    platformId: string,
    handle: string
  ): Promise<SignalResult> {
    try {
      // Task 4: Create author if not exists (using upsert to prevent race conditions)
      const author = await this.ensureAuthor(platform, platformId, handle);

      // Task 2: Parse interaction history and calculate score
      const interactions = this.parseInteractionHistory(author.interactionHistory);
      const score = this.calculateRelationshipScore(interactions);

      // Task 3: Detect archetypes
      const archetypes = await this.detectArchetypes(author);

      return {
        score,
        confidence: interactions.length > 0 ? 0.9 : 0.5, // Higher confidence with history
        archetypes,
        interactionCount: interactions.length,
      };
    } catch (error) {
      logger.error('Author context analysis failed', { error, platform, platformId });
      // Return neutral score on error
      return {
        score: BASE_SCORE,
        confidence: 0.0,
        archetypes: [],
        interactionCount: 0,
      };
    }
  }

  /**
   * Ensures the author exists in the database, creating it if necessary.
   * Uses upsert to handle race conditions.
   */
  private async ensureAuthor(
    platform: Platform,
    platformId: string,
    handle: string
  ): Promise<Author> {
    return prisma.author.upsert({
      where: {
        platform_platformId: {
          platform,
          platformId,
        },
      },
      update: {
        // Update handle if it changed
        handle,
        lastSeenAt: new Date(),
      },
      create: {
        platform,
        platformId,
        handle,
        relationshipScore: BASE_SCORE,
        interactionHistory: [], // Initial empty history
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
    });
  }

  /**
   * Parses the interaction history from the JSON field.
   */
  private parseInteractionHistory(history: unknown): InteractionEvent[] {
    if (!Array.isArray(history)) return [];
    // Basic validation could be added here if needed
    return history as InteractionEvent[];
  }

  /**
   * Calculates the relationship score based on interaction history.
   * Task 2 logic.
   */
  private calculateRelationshipScore(interactions: InteractionEvent[]): number {
    let score = BASE_SCORE;

    for (const interaction of interactions) {
      const weight = INTERACTION_WEIGHTS[interaction.type];
      if (weight) {
        score += weight;
      }
    }

    // Cap between 0.0 and 1.0
    return Math.max(0.0, Math.min(1.0, score));
  }

  /**
   * Detects archetypes based on author's display name (acting as bio/context).
   * Task 3 logic.
   */
  private async detectArchetypes(author: Author): Promise<string[]> {
    const archetypes: string[] = [];
    const bio = author.displayName?.toLowerCase() || '';

    // Healthcare professional
    if (/(nurse|doctor|pharmacist|physician|md|rn)/i.test(bio)) {
      archetypes.push('healthcare_pro');
    }

    // Comedian
    if (/(comedian|comic|funny|humor)/i.test(bio)) {
      archetypes.push('comedian');
    }

    // Parent
    if (/(mom|dad|parent|mother|father)/i.test(bio)) {
      archetypes.push('parent');
    }

    // Only update if we found new archetypes and they are different from existing ones
    // Note: author.archetypeTags might already contain these.
    const existingTags = new Set(author.archetypeTags);
    const newTags = archetypes.filter((tag) => !existingTags.has(tag));

    if (newTags.length > 0) {
      const updatedTags = [...author.archetypeTags, ...newTags];
      await this.updateArchetypeTags(author.id, updatedTags).catch((err) =>
        logger.error('Failed to update archetype tags', { err })
      );
      return updatedTags;
    }

    return author.archetypeTags;
  }

  private async updateArchetypeTags(authorId: string, tags: string[]): Promise<void> {
    await prisma.author.update({
      where: { id: authorId },
      data: { archetypeTags: tags },
    });
  }
}

// Export singleton
export const authorContextAnalyzer = new AuthorContextAnalyzer();
export const analyzeAuthorContext = (
  platform: Platform,
  platformId: string,
  handle: string
): Promise<SignalResult> => authorContextAnalyzer.analyzeAuthorContext(platform, platformId, handle);
