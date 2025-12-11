/**
 * Archetype Selector - Main orchestrator for context-aware probabilistic selection
 * Story 2.10: Integration Layer
 */

import { logger } from '@/utils/logger';
import { redis } from '@/utils/redis';

import { ContextAssembler } from './context/context-assembler';
import { TelemetrySink } from './learning/telemetry-sink';
import { MultiFactorScorer } from './scoring/multi-factor-scorer';
import { ProbabilisticSelector } from './selection/probabilistic-selector';
import { StrategicDecisionLayer } from './strategy/strategic-decision-layer';
import type { DecisionSignals, SelectionDetail, DecisionOutcome } from './types';

/**
 * Main archetype selection engine
 * Integrates all 5 subsystems: Context, Scoring, Strategy, Selection, Learning
 */
export class ArchetypeSelector {
  private contextAssembler: ContextAssembler;
  private scorer: MultiFactorScorer;
  private strategyLayer: StrategicDecisionLayer;
  private selector: ProbabilisticSelector;
  private telemetrySink: TelemetrySink;

  constructor() {
    this.contextAssembler = new ContextAssembler();
    this.scorer = new MultiFactorScorer();
    this.strategyLayer = new StrategicDecisionLayer();
    this.selector = new ProbabilisticSelector();
    this.telemetrySink = new TelemetrySink();
    logger.info('ArchetypeSelector initialized');
  }

  /**
   * Select optimal archetype for a given post using full pipeline
   */
  public async selectArchetype(signals: DecisionSignals): Promise<SelectionDetail> {
    const startTime = Date.now();
    const requestId = `select-${signals.postId}-${startTime}`;

    try {
      logger.info(
        { requestId, postId: signals.postId, mode: signals.mode },
        'Starting archetype selection'
      );

      // Step 1: Assemble context
      const context = await this.contextAssembler.buildContext(signals);
      logger.debug(
        { requestId, overallConfidence: context.overallConfidence },
        'Context assembled'
      );

      // Step 2: Calculate multi-factor scores
      const scores = await this.scorer.score(context);
      logger.debug(
        {
          requestId,
          topArchetype: scores.scores[0]?.archetype,
          topScore: scores.scores[0]?.score,
          variance: scores.variance,
        },
        'Scores calculated'
      );

      // Step 3: Apply strategic policies
      const envelope = this.strategyLayer.applyPolicies(scores);
      logger.debug(
        {
          requestId,
          overrideCount: envelope.overrides.length,
          candidateCount: envelope.adjustedScores.length,
        },
        'Policies applied'
      );

      // Step 4: Probabilistic selection
      const selection = this.selector.select(envelope);
      logger.info(
        {
          requestId,
          selectedArchetype: selection.archetype,
          confidence: selection.confidence,
          temperature: selection.temperature,
          fallback: selection.fallbackMode,
        },
        'Archetype selected'
      );

      // Step 5: Record telemetry
      await this.recordTelemetry(signals, selection);

      const duration = Date.now() - startTime;
      logger.info({ requestId, duration }, 'Archetype selection complete');

      return selection;
    } catch (error) {
      logger.error({ error, requestId, postId: signals.postId }, 'Archetype selection failed');

      // Return safe fallback
      return {
        archetype: 'COACH',
        confidence: 0.2,
        reason: 'Selection failed, using safe fallback',
        factorBreakdown: {} as any,
        alternatives: [],
        temperature: 1.0,
        fallbackMode: true,
        timestamp: new Date(),
      };
    }
  }

  private async recordTelemetry(
    signals: DecisionSignals,
    selection: SelectionDetail
  ): Promise<void> {
    try {
      const outcome: DecisionOutcome = {
        decisionId: `${signals.postId}-${Date.now()}`,
        postId: signals.postId,
        selectedArchetype: selection.archetype,
        alternatives: selection.alternatives.map((a) => ({
          archetype: a.archetype,
          score: a.score,
        })),
        factorScores: selection.factorBreakdown,
        overrides: [],
        temperature: selection.temperature,
        contextIds: {},
        timestamp: new Date(),
      };

      await this.telemetrySink.recordOutcome(outcome);

      // Update rotation store
      const cacheKey = `rotation:${selection.archetype}:${signals.postId.split('-')[0]}`;
      await redis.set(cacheKey, new Date().toISOString(), 'EX', 86400 * 7); // 7 day TTL

    } catch (error) {
      logger.warn({ error }, 'Telemetry recording failed');
    }
  }
}