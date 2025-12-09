/**
 * Context Assembler - Aggregates upstream signals into unified ArchetypeContext
 * Story 2.10: Task 1, Subtask 1
 *
 * Responsibilities:
 * - Validate incoming decision signals
 * - Fetch and assemble enriched features from all pipelines
 * - Provide default fallbacks for missing/failed signals
 * - Ensure downstream never fails due to missing data
 */

import { logger } from '@/utils/logger';

import type {
  ArchetypeContext,
  CompetitorIntent,
  ConversationState,
  DecisionSignals,
  PersonaProfile,
  SemanticProfile,
} from '../types';
import {
  DEFAULT_COMPETITOR_INTENT,
  DEFAULT_CONVERSATION_STATE,
  DEFAULT_PERSONA_PROFILE,
  DEFAULT_SEMANTIC_PROFILE,
  decisionSignalsSchema,
} from '../types';

import { AuthorPersonaRefiner } from './author-persona-refiner';
import { CompetitorStrategyEngine } from './competitor-strategy-engine';
import { ConversationStateTracker } from './conversation-state-tracker';
import { SemanticProfilePipeline } from './semantic-profile-pipeline';

interface ContextAssemblerConfig {
  enableSemanticPipeline: boolean;
  enablePersonaRefiner: boolean;
  enableCompetitorEngine: boolean;
  enableConversationTracker: boolean;
  confidenceThreshold: number; // Minimum confidence to avoid fallback
}

const DEFAULT_CONFIG: ContextAssemblerConfig = {
  enableSemanticPipeline: true,
  enablePersonaRefiner: true,
  enableCompetitorEngine: true,
  enableConversationTracker: true,
  confidenceThreshold: 0.4,
};

/**
 * Assembles unified ArchetypeContext from multiple upstream signals
 */
export class ContextAssembler {
  private config: ContextAssemblerConfig;
  private semanticPipeline: SemanticProfilePipeline;
  private personaRefiner: AuthorPersonaRefiner;
  private competitorEngine: CompetitorStrategyEngine;
  private conversationTracker: ConversationStateTracker;

  constructor(config: Partial<ContextAssemblerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.semanticPipeline = new SemanticProfilePipeline();
    this.personaRefiner = new AuthorPersonaRefiner();
    this.competitorEngine = new CompetitorStrategyEngine();
    this.conversationTracker = new ConversationStateTracker();
    logger.info({ config: this.config }, 'ContextAssembler initialized');
  }

  /**
   * Build unified ArchetypeContext from decision signals
   *
   * @param signals - Input signals from upstream services
   * @returns ArchetypeContext with enriched features and confidence metadata
   * @throws Error if input signals are invalid
   */
  public async buildContext(signals: DecisionSignals): Promise<ArchetypeContext> {
    const startTime = Date.now();
    const requestId = `ctx-${signals.postId}-${startTime}`;

    // Validate input signals - this will throw if invalid
    const validatedSignals = this.validateSignals(signals);

    logger.debug({ requestId, signals: validatedSignals }, 'Building archetype context');

    // Fetch enriched features in parallel
    const [semanticProfile, personaProfile, competitorIntent, conversationState] =
      await Promise.allSettled([
        this.fetchSemanticProfile(validatedSignals),
        this.fetchPersonaProfile(validatedSignals),
        this.fetchCompetitorIntent(validatedSignals),
        this.fetchConversationState(validatedSignals),
      ]);

    // Extract results with fallbacks
    const semantic = this.extractResult(semanticProfile, DEFAULT_SEMANTIC_PROFILE, 'semantic');
    const persona = this.extractResult(personaProfile, DEFAULT_PERSONA_PROFILE, 'persona');
    const competitor = this.extractResult(
      competitorIntent,
      DEFAULT_COMPETITOR_INTENT,
      'competitor'
    );
    const conversation = this.extractResult(
      conversationState,
      DEFAULT_CONVERSATION_STATE,
      'conversation'
    );

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(
      semantic,
      persona,
      competitor,
      conversation
    );

    const context: ArchetypeContext = {
      postId: validatedSignals.postId,
      mode: validatedSignals.mode,
      modeConfidence: validatedSignals.modeConfidence,
      platform: validatedSignals.platform,
      timestamp: new Date(validatedSignals.timestamp),
      semanticProfile: semantic,
      personaProfile: persona,
      competitorIntent: competitor,
      conversationState: conversation,
      freshness: {
        semantic: semantic.timestamp,
        persona: persona.timestamp,
        competitor: competitor.timestamp,
        conversation: conversation.timestamp,
      },
      overallConfidence,
    };

    const duration = Date.now() - startTime;
    logger.info(
      {
        requestId,
        postId: signals.postId,
        overallConfidence,
        duration,
        cacheHits: {
          semantic: semantic.cacheHit,
        },
      },
      'Context assembled successfully'
    );

    return context;
  }

  /**
   * Validate and parse input signals
   */
  private validateSignals(signals: DecisionSignals): DecisionSignals {
    try {
      return decisionSignalsSchema.parse(signals);
    } catch (error) {
      logger.warn({ error, signals }, 'Signal validation failed, using defaults');
      throw new Error('Invalid decision signals');
    }
  }

  /**
   * Fetch semantic profile from SemanticProfilePipeline
   */
  private async fetchSemanticProfile(signals: DecisionSignals): Promise<SemanticProfile> {
    if (!this.config.enableSemanticPipeline) {
      logger.debug('Semantic pipeline disabled, using default');
      return DEFAULT_SEMANTIC_PROFILE;
    }

    try {
      // Call SemanticProfilePipeline with post content
      // Note: In production, we would fetch actual post content from database
      // For now, we use postId as a placeholder
      const profile = await this.semanticPipeline.run({
        postId: signals.postId,
        content: `Post ${signals.postId}`, // TODO: Fetch actual content
        platform: signals.platform,
      });

      return profile;
    } catch (error) {
      logger.warn({ error, postId: signals.postId }, 'Semantic profile fetch failed');
      return DEFAULT_SEMANTIC_PROFILE;
    }
  }

  /**
   * Fetch persona profile from AuthorPersonaRefiner
   */
  private async fetchPersonaProfile(signals: DecisionSignals): Promise<PersonaProfile> {
    if (!this.config.enablePersonaRefiner || !signals.authorId) {
      logger.debug('Persona refiner disabled or no author ID, using default');
      return DEFAULT_PERSONA_PROFILE;
    }

    try {
      const profile = await this.personaRefiner.derivePersona(signals.authorId, signals.platform);
      return profile;
    } catch (error) {
      logger.warn({ error, authorId: signals.authorId }, 'Persona profile fetch failed');
      return DEFAULT_PERSONA_PROFILE;
    }
  }

  /**
   * Fetch competitor intent from CompetitorStrategyEngine
   */
  private async fetchCompetitorIntent(signals: DecisionSignals): Promise<CompetitorIntent> {
    if (!this.config.enableCompetitorEngine || !signals.competitorSignals?.detected) {
      logger.debug('Competitor engine disabled or no competitors detected, using default');
      return DEFAULT_COMPETITOR_INTENT;
    }

    try {
      const intent = await this.competitorEngine.mapCompetitorSignals(
        {
          detected: signals.competitorSignals.detected,
          handles: signals.competitorSignals.handles,
          platform: signals.platform,
        },
        signals.postId
      );
      return intent;
    } catch (error) {
      logger.warn({ error, postId: signals.postId }, 'Competitor intent fetch failed');
      return DEFAULT_COMPETITOR_INTENT;
    }
  }

  /**
   * Fetch conversation state from ConversationStateTracker
   */
  private async fetchConversationState(signals: DecisionSignals): Promise<ConversationState> {
    if (!this.config.enableConversationTracker) {
      logger.debug('Conversation tracker disabled, using default');
      return DEFAULT_CONVERSATION_STATE;
    }

    try {
      const state = await this.conversationTracker.summarize(
        signals.threadContext || {},
        signals.platform
      );
      return state;
    } catch (error) {
      logger.warn({ error, postId: signals.postId }, 'Conversation state fetch failed');
      return DEFAULT_CONVERSATION_STATE;
    }
  }

  /**
   * Extract result from Promise.allSettled with fallback
   */
  private extractResult<T>(result: PromiseSettledResult<T>, fallback: T, name: string): T {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    logger.warn({ error: result.reason, pipeline: name }, 'Pipeline failed, using fallback');
    return fallback;
  }

  /**
   * Calculate overall confidence from all signals
   */
  private calculateOverallConfidence(
    semantic: SemanticProfile,
    persona: PersonaProfile,
    competitor: CompetitorIntent,
    conversation: ConversationState
  ): number {
    const weights = {
      semantic: 0.35,
      persona: 0.3,
      competitor: 0.15,
      conversation: 0.2,
    };

    const weightedConfidence =
      semantic.confidence * weights.semantic +
      persona.confidence * weights.persona +
      competitor.confidence * weights.competitor +
      conversation.confidence * weights.conversation;

    return Math.max(0.0, Math.min(1.0, weightedConfidence));
  }

  /**
   * Build fully degraded context when all enrichment fails
   */
  private buildDegradedContext(signals: DecisionSignals): ArchetypeContext {
    logger.warn({ postId: signals.postId }, 'Building fully degraded context');

    const now = new Date();
    return {
      postId: signals.postId,
      mode: signals.mode,
      modeConfidence: signals.modeConfidence,
      platform: signals.platform,
      timestamp: new Date(signals.timestamp),
      semanticProfile: { ...DEFAULT_SEMANTIC_PROFILE, timestamp: now },
      personaProfile: { ...DEFAULT_PERSONA_PROFILE, timestamp: now },
      competitorIntent: { ...DEFAULT_COMPETITOR_INTENT, timestamp: now },
      conversationState: { ...DEFAULT_CONVERSATION_STATE, timestamp: now },
      freshness: {
        semantic: now,
        persona: now,
        competitor: now,
        conversation: now,
      },
      overallConfidence: 0.2, // Low confidence for fully degraded
    };
  }
}
