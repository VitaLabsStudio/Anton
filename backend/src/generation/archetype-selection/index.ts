/**
 * Archetype Selection Engine - Main exports
 * Story 2.10: Context-Aware Probabilistic Archetype Selector
 */

export { ArchetypeSelector } from './archetype-selector';
export { ContextAssembler } from './context/context-assembler';
export { MultiFactorScorer } from './scoring/multi-factor-scorer';
export { StrategicDecisionLayer } from './strategy/strategic-decision-layer';
export { ProbabilisticSelector } from './selection/probabilistic-selector';
export { TelemetrySink } from './learning/telemetry-sink';

export type {
  DecisionSignals,
  ArchetypeContext,
  SemanticProfile,
  PersonaProfile,
  CompetitorIntent,
  ConversationState,
  ArchetypeScore,
  ArchetypeScores,
  FactorBreakdown,
  StrategicEnvelope,
  SelectionDetail,
  DecisionOutcome,
  OperationalMode,
  PersonaType,
  RelationshipStage,
  FollowerTier,
  CompetitorArchetype,
  AggressivenessLevel,
} from './types';
