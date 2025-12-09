/**
 * Telemetry Sink - Captures decision outcomes for learning loop
 * Story 2.10: Task 5
 */

import { logger } from '@/utils/logger';

import type { DecisionOutcome } from '../types';

export class TelemetrySink {
  constructor() {
    logger.info('TelemetrySink initialized');
  }

  public async recordOutcome(outcome: DecisionOutcome): Promise<void> {
    try {
      // TODO: Store in analytics DB
      // TODO: Publish to Kafka topic 'decision.archetype.selected'
      logger.debug(
        {
          decisionId: outcome.decisionId,
          archetype: outcome.selectedArchetype,
          temperature: outcome.temperature,
        },
        'Decision outcome recorded'
      );
    } catch (error) {
      logger.error({ error, decisionId: outcome.decisionId }, 'Failed to record outcome');
    }
  }
}
