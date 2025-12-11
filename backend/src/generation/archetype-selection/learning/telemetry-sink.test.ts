/**
 * Tests for TelemetrySink
 * Story 2.10: Learning Loop Integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Hoist mocks
const mocks = vi.hoisted(() => ({
  kafka: {
    producer: vi.fn(),
  },
  prisma: {
    decisionOutcome: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/kafka', () => ({
  kafka: mocks.kafka,
}));

vi.mock('../../../utils/prisma', () => ({
  prisma: mocks.prisma,
}));

import { TelemetrySink } from './telemetry-sink';
import type { DecisionOutcome } from '../types';

describe('TelemetrySink', () => {
  let sink: TelemetrySink;
  let mockProducer: any;

  const mockOutcome: DecisionOutcome = {
    decisionId: 'dec-123',
    postId: 'post-456',
    selectedArchetype: 'COACH',
    alternatives: [{ archetype: 'CHECKLIST', score: 0.8 }],
    factorScores: {
        F1_modeIntent: 0.5,
        F2_semanticResonance: 0.5,
        F3_authorPersonaFit: 0.5,
        F4_competitorCounter: 0.5,
        F5_conversationState: 0.5,
        F6_performanceMemory: 0.5,
        F7_safetyCompliance: 0.5,
        F8_rotationNovelty: 0.5,
        rotationPenalty: 0,
        performanceBias: 0,
        totalScore: 0.8,
    },
    overrides: [],
    temperature: 0.5,
    contextIds: {},
    timestamp: new Date(),
  };

  beforeEach(() => {
    mockProducer = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockResolvedValue([{}]),
    };
    mocks.kafka.producer.mockReturnValue(mockProducer);
    vi.clearAllMocks();
    sink = new TelemetrySink();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize Kafka producer on construction', async () => {
    // Wait for async init (it's fire-and-forget in constructor, but mocked here)
    // We can't await constructor, but we can verify producer creation
    expect(mocks.kafka.producer).toHaveBeenCalled();
  });

  it('should store outcome in database', async () => {
    await sink.recordOutcome(mockOutcome);
    expect(mocks.prisma.decisionOutcome.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          decisionId: mockOutcome.decisionId,
          postId: mockOutcome.postId,
          selectedArchetype: mockOutcome.selectedArchetype,
        }),
      })
    );
  });

  it('should publish to Kafka topic', async () => {
    // Ensure init is "done" (mock is sync)
    await sink.recordOutcome(mockOutcome);

    expect(mockProducer.connect).toHaveBeenCalled();
    expect(mockProducer.send).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'decision.archetype.selected',
        messages: expect.arrayContaining([
          expect.objectContaining({
            key: mockOutcome.postId,
          }),
        ]),
      })
    );
  });

  it('should handle database errors gracefully (log only)', async () => {
    mocks.prisma.decisionOutcome.create.mockRejectedValue(new Error('DB Error'));
    await expect(sink.recordOutcome(mockOutcome)).resolves.not.toThrow();
  });

  it('should handle Kafka errors gracefully', async () => {
    mockProducer.send.mockRejectedValue(new Error('Kafka Error'));
    await expect(sink.recordOutcome(mockOutcome)).resolves.not.toThrow();
  });
});
