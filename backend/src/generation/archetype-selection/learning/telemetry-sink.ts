/**
 * Telemetry Sink - Captures decision outcomes for learning loop
 * Story 2.10: Task 5
 */

import { kafka } from '@/utils/kafka';
import { logger } from '@/utils/logger';
import { prisma } from '@/utils/prisma';

import type { DecisionOutcome } from '../types';

export class TelemetrySink {
  private kafkaProducer: any;
  private kafkaTopic = 'decision.archetype.selected';

  constructor() {
    this.initKafka();
    logger.info('TelemetrySink initialized');
  }

  private async initKafka() {
    try {
      this.kafkaProducer = kafka.producer();
      await this.kafkaProducer.connect();
      logger.info({ topic: this.kafkaTopic }, 'Kafka producer connected');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Kafka producer');
      this.kafkaProducer = null; // Fail gracefully
    }
  }

  public async recordOutcome(outcome: DecisionOutcome): Promise<void> {
    try {
      logger.info({ decisionId: outcome.decisionId }, 'Recording decision outcome');

      // 1. Store in analytics DB
      await this.storeInDatabase(outcome);

      // 2. Publish to Kafka
      await this.publishToKafka(outcome);

    } catch (error) {
      logger.error({ error, decisionId: outcome.decisionId }, 'Failed to record decision outcome');
    }
  }

  private async storeInDatabase(outcome: DecisionOutcome): Promise<void> {
    try {
      await prisma.decisionOutcome.create({
        data: {
          decisionId: outcome.decisionId,
          postId: outcome.postId,
          selectedArchetype: outcome.selectedArchetype,
          engagementScore: 0.0, // Updated later by analytics pipeline
          timestamp: outcome.timestamp,
        },
      });
      logger.debug({ decisionId: outcome.decisionId }, 'Outcome stored in DB');
    } catch (error) {
      logger.error({ error }, 'Database storage failed');
      throw error;
    }
  }

  private async publishToKafka(outcome: DecisionOutcome): Promise<void> {
    if (!this.kafkaProducer) {
      logger.warn('Kafka producer not available, skipping publish');
      return;
    }

    try {
      await this.kafkaProducer.send({
        topic: this.kafkaTopic,
        messages: [
          {
            key: outcome.postId,
            value: JSON.stringify({
              decisionId: outcome.decisionId,
              postId: outcome.postId,
              selectedArchetype: outcome.selectedArchetype,
              alternatives: outcome.alternatives,
              factorScores: outcome.factorScores,
              overrides: outcome.overrides,
              temperature: outcome.temperature,
              contextIds: outcome.contextIds,
              timestamp: outcome.timestamp.toISOString(),
            }),
          },
        ],
      });
      logger.debug({ decisionId: outcome.decisionId }, 'Published to Kafka');
    } catch (error) {
      logger.error({ error }, 'Kafka publish failed');
      // Don't throw - non-critical for selection pipeline
    }
  }

  public async disconnect(): Promise<void> {
    if (this.kafkaProducer) {
      await this.kafkaProducer.disconnect();
      logger.info('Kafka producer disconnected');
    }
  }
}
