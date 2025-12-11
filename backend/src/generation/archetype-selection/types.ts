/**
 * Type definitions for the Context-Aware Probabilistic Archetype Selection Engine.
 * Story 2.10: Archetype Selection Engine
 */

import { z } from 'zod';

// ============================================================================
// Input Signal Schemas
// ============================================================================

/**
 * Operational mode from Mode Selector (Story 2.5)
 */
export const operationalModeSchema = z.enum(['HELPFUL', 'ENGAGEMENT', 'HYBRID', 'DISENGAGED']);

export type OperationalMode = z.infer<typeof operationalModeSchema>;

/**
 * Decision signals from upstream services (Mode Selector, Author Detection, etc.)
 */
export const decisionSignalsSchema = z.object({
  postId: z.string(),
  mode: operationalModeSchema,
  modeConfidence: z.number().min(0).max(1),
  platform: z.enum(['twitter', 'reddit', 'threads']),
  authorId: z.string().optional(),
  competitorSignals: z
    .object({
      detected: z.boolean(),
      handles: z.array(z.string()).optional(),
    })
    .optional(),
  threadContext: z
    .object({
      depth: z.number().optional(),
      participantCount: z.number().optional(),
    })
    .optional(),
  timestamp: z.string().datetime(),
});

export type DecisionSignals = z.infer<typeof decisionSignalsSchema>;

// ============================================================================
// Semantic Profile (from SemanticProfilePipeline)
// ============================================================================

/**
 * Emotion vector with confidence scores
 */
export interface EmotionVector {
  joy: number; // 0-1
  sadness: number; // 0-1
  anger: number; // 0-1
  fear: number; // 0-1
  surprise: number; // 0-1
  disgust: number; // 0-1
  neutral: number; // 0-1
}

/**
 * Semantic analysis output from hybrid LLM + ML classifiers
 */
export interface SemanticProfile {
  emotionVector: EmotionVector;
  urgency: number; // 0-1
  misinformationProbability: number; // 0-1
  humorDetected: boolean;
  stance: 'positive' | 'negative' | 'neutral' | 'questioning';
  rationale: string;
  confidence: number; // 0-1
  toxicity?: number; // 0-1, optional
  cacheHit: boolean;
  timestamp: Date;
}

// Default semantic profile for graceful degradation
export const DEFAULT_SEMANTIC_PROFILE: SemanticProfile = {
  emotionVector: {
    joy: 0,
    sadness: 0,
    anger: 0,
    fear: 0,
    surprise: 0,
    disgust: 0,
    neutral: 1.0,
  },
  urgency: 0.3,
  misinformationProbability: 0.0,
  humorDetected: false,
  stance: 'neutral',
  rationale: 'Default profile - semantic analysis unavailable',
  confidence: 0.2,
  cacheHit: false,
  timestamp: new Date(),
};

// ============================================================================
// Persona Profile (from AuthorPersonaRefiner)
// ============================================================================

export type PersonaType =
  | 'healthcare_professional'
  | 'concerned_parent'
  | 'skeptic'
  | 'activist'
  | 'researcher'
  | 'educator'
  | 'curious_learner'
  | 'unknown';

export type RelationshipStage = 'first_contact' | 'aware' | 'engaged' | 'advocate';

export type FollowerTier = 'nano' | 'micro' | 'mid' | 'macro' | 'mega';

/**
 * Author persona profile from Story 2.2 author detection
 */
export interface PersonaProfile {
  primaryPersona: PersonaType;
  secondaryPersona?: PersonaType;
  receptiveness: number; // 0-1
  relationshipStage: RelationshipStage;
  followerTier: FollowerTier;
  isPowerUser: boolean; // From Story 2.11
  topPerformingArchetype?: string; // From Story 2.11
  confidence: number; // 0-1
  timestamp: Date;
}

// Default persona profile for graceful degradation
export const DEFAULT_PERSONA_PROFILE: PersonaProfile = {
  primaryPersona: 'unknown',
  receptiveness: 0.5,
  relationshipStage: 'first_contact',
  followerTier: 'nano',
  isPowerUser: false,
  confidence: 0.2,
  timestamp: new Date(),
};

// ============================================================================
// Competitor Intent (from CompetitorStrategyEngine)
// ============================================================================

export type CompetitorArchetype =
  | 'fear_monger'
  | 'authority_challenger'
  | 'echo_chamber'
  | 'unknown';

export type AggressivenessLevel = 'low' | 'moderate' | 'high' | 'extreme';

/**
 * Competitor strategy analysis output
 */
export interface CompetitorIntent {
  detected: boolean;
  archetype: CompetitorArchetype;
  aggressiveness: AggressivenessLevel;
  recommendedCounterWeights: Map<string, number>; // archetype -> weight delta
  confidence: number; // 0-1
  timestamp: Date;
}

// Default competitor intent for graceful degradation
export const DEFAULT_COMPETITOR_INTENT: CompetitorIntent = {
  detected: false,
  archetype: 'unknown',
  aggressiveness: 'low',
  recommendedCounterWeights: new Map(),
  confidence: 0.0,
  timestamp: new Date(),
};

// ============================================================================
// Conversation State (from ConversationStateTracker)
// ============================================================================

/**
 * Conversation thread state summary
 */
export interface ConversationState {
  threadDepth: number; // Number of replies in thread
  cadence: 'rapid' | 'moderate' | 'slow' | 'stale'; // Reply frequency
  platformCultureBias: number; // -1 to +1, platform-specific adjustment
  cooldownHint: boolean; // True if we should reduce engagement
  lastReplyTimestamp?: Date;
  confidence: number; // 0-1
  timestamp: Date;
}

// Default conversation state for graceful degradation
export const DEFAULT_CONVERSATION_STATE: ConversationState = {
  threadDepth: 0,
  cadence: 'moderate',
  platformCultureBias: 0.0,
  cooldownHint: false,
  confidence: 0.3,
  timestamp: new Date(),
};

// ============================================================================
// Unified Archetype Context
// ============================================================================

/**
 * Unified context object assembled by ContextAssembler
 * Contains all enriched signals with confidence metadata
 */
export interface ArchetypeContext {
  // Input signals
  postId: string;
  mode: OperationalMode;
  modeConfidence: number;
  platform: 'twitter' | 'reddit' | 'threads';
  timestamp: Date;

  // Enriched features
  semanticProfile: SemanticProfile;
  personaProfile: PersonaProfile;
  competitorIntent: CompetitorIntent;
  conversationState: ConversationState;

  // Metadata
  freshness: {
    semantic: Date;
    persona: Date;
    competitor: Date;
    conversation: Date;
  };
  overallConfidence: number; // Aggregated confidence across all signals
}

// ============================================================================
// Scoring & Selection Types
// ============================================================================

/**
 * Factor breakdown for a single archetype
 */
export interface FactorBreakdown {
  F1_modeIntent: number;
  F2_semanticResonance: number;
  F3_authorPersonaFit: number;
  F4_competitorCounter: number;
  F5_conversationState: number;
  F6_performanceMemory: number;
  F7_safetyCompliance: number;
  F8_rotationNovelty: number;
  rotationPenalty: number;
  performanceBias: number;
  totalScore: number;
}

/**
 * Archetype score with factor breakdown
 */
export interface ArchetypeScore {
  archetype: string;
  score: number;
  confidence: number;
  factorBreakdown: FactorBreakdown;
  justification: string; // Top 3 factor contributions
}

/**
 * Multi-archetype scores output from MultiFactorScorer
 */
export interface ArchetypeScores {
  scores: ArchetypeScore[];
  variance: number; // Score variance metric
  timestamp: Date;
}

/**
 * Strategic envelope with policy adjustments
 */
export interface StrategicEnvelope {
  adjustedScores: ArchetypeScore[];
  overrides: Array<{
    type: 'safety' | 'competitor' | 'compliance' | 'rotation';
    reason: string;
    forcedArchetype?: string;
  }>;
  suppressedCandidates: string[];
  policyChain: string[];
  timestamp: Date;
}

/**
 * Final archetype selection with explainability
 */
export interface SelectionDetail {
  archetype: string;
  confidence: number;
  reason: string; // Top 3 factor contributions + overrides
  factorBreakdown: FactorBreakdown;
  alternatives: Array<{
    archetype: string;
    score: number;
    probability: number;
  }>;
  temperature: number; // Softmax temperature used
  fallbackMode: boolean; // True if deterministic fallback was used
  timestamp: Date;
}

// ============================================================================
// Learning Loop Types
// ============================================================================

/**
 * Decision outcome telemetry for learning loop
 */
export interface DecisionOutcome {
  decisionId: string;
  postId: string;
  selectedArchetype: string;
  alternatives: Array<{ archetype: string; score: number }>;
  factorScores: FactorBreakdown;
  overrides: string[];
  temperature: number;
  contextIds: {
    semanticProfileId?: string;
    personaProfileId?: string;
    competitorIntentId?: string;
  };
  engagementMetrics?: {
    upvotes: number;
    replies: number;
    shares: number;
  };
  timestamp: Date;
}
