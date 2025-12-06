import type { Author } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { SafetyProtocol, SafetySeverity } from '../../../src/analysis/safety-protocol.js';

type MetricRecord = { name: string; tags?: Record<string, unknown>; value?: number };

class MetricsStub {
  increments: MetricRecord[] = [];
  records: MetricRecord[] = [];

  increment(name: string, tags?: Record<string, unknown>): void {
    this.increments.push({ name, tags });
  }

  record(name: string, value: number, tags?: Record<string, unknown>): void {
    this.records.push({ name, value, tags });
  }

  reset(): void {
    this.increments = [];
    this.records = [];
  }
}

class StubLlmClient {
  private readonly response: string;
  private readonly shouldThrow: boolean;

  constructor(response: string, shouldThrow = false) {
    this.response = response;
    this.shouldThrow = shouldThrow;
  }

  async generate(): Promise<{
    content: string;
    confidence: number;
    usage: Record<string, number>;
  }> {
    if (this.shouldThrow) {
      throw new Error('LLM unavailable');
    }
    return {
      content: this.response,
      confidence: 0.9,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }
}

function buildAuthor(overrides: Partial<Author> = {}): Author {
  const now = new Date();
  return {
    id: 'author-1',
    platform: 'TWITTER',
    platformId: 'platform-1',
    handle: 'test-user',
    displayName: 'Test User',
    followerCount: 10,
    isVerified: false,
    isPowerUser: false,
    powerTierId: null,
    archetypeTags: [],
    relationshipScore: 0.2,
    interactionHistory: [],
    firstSeenAt: now,
    lastSeenAt: now,
    createdAt: now,
    updatedAt: now,
    champions: null,
    powerTier: null,
    posts: [],
    ...overrides,
  } as Author;
}

describe('SafetyProtocol - HIGH/MEDIUM tier with LLM context', () => {
  const metrics = new MetricsStub();
  const buildProtocol = (response: string): SafetyProtocol =>
    new SafetyProtocol({
      deepseek: new StubLlmClient(response),
      openai: new StubLlmClient(response),
      metrics,
    });

  beforeEach(() => metrics.reset());

  const genuineConcernCases = [
    {
      content: "I'm pregnant and drank too much wine",
      category: 'PREGNANCY',
      severity: SafetySeverity.HIGH,
    },
    {
      content: 'Currently breastfeeding and feel dizzy',
      category: 'PREGNANCY',
      severity: SafetySeverity.HIGH,
    },
    {
      content: 'On warfarin and had several shots',
      category: 'MEDICATION_INTERACTION',
      severity: SafetySeverity.HIGH,
    },
    {
      content: 'Taking antidepressant and drank heavily',
      category: 'MEDICATION_INTERACTION',
      severity: SafetySeverity.HIGH,
    },
    {
      content: 'liver disease patient drank last night',
      category: 'CHRONIC_CONDITIONS',
      severity: SafetySeverity.HIGH,
    },
    {
      content: 'kidney problems and went hard on liquor',
      category: 'CHRONIC_CONDITIONS',
      severity: SafetySeverity.HIGH,
    },
    {
      content: '5 months sober but worried about relapse',
      category: 'ADDICTION_RECOVERY',
      severity: SafetySeverity.HIGH,
    },
    {
      content: 'going to AA meeting after binge',
      category: 'ADDICTION_RECOVERY',
      severity: SafetySeverity.HIGH,
    },
    {
      content: 'in the hospital because of this',
      category: 'HOSPITAL_MENTION',
      severity: SafetySeverity.MEDIUM,
    },
    {
      content: "I'm dying please help",
      category: 'DEATH_HYPERBOLE',
      severity: SafetySeverity.MEDIUM,
    },
  ];

  it.each(genuineConcernCases)(
    'disengages after LLM genuine classification: %s',
    async (scenario) => {
      const result = await buildProtocol('A genuine concern').checkSafetyProtocol(
        scenario.content,
        buildAuthor()
      );

      expect(result.shouldDisengage).toBe(true);
      expect(result.flags).toContain(scenario.category);
      expect(result.severity).toBe(scenario.severity);
      expect(result.contextCheckPerformed).toBe(true);
      expect(result.llmAssessment?.classification).toBe('GENUINE_CONCERN');
    }
  );

  const hyperboleCases = [
    { content: "I'm dying from this hangover lol", category: 'DEATH_HYPERBOLE' },
    { content: 'feel like death after last night', category: 'DEATH_HYPERBOLE' },
    { content: 'this is killing me slowly', category: 'DEATH_HYPERBOLE' },
    { content: 'funeral for my liver tomorrow', category: 'DEATH_HYPERBOLE' },
    { content: 'high school cafeteria food is killing me', category: 'HOSPITAL_MENTION' },
    { content: 'nurse said it was just dehydration', category: 'HOSPITAL_MENTION' },
    { content: 'doctor appointment next week, nothing urgent', category: 'HOSPITAL_MENTION' },
    { content: 'high school reunion hangover is rough', category: 'MINORS_UNCLEAR' },
    { content: 'college freshman dorm party jokes', category: 'MINORS_UNCLEAR' },
    { content: 'just a joke about killing my liver', category: 'DEATH_HYPERBOLE' },
  ];

  it.each(hyperboleCases)('allows engagement on hyperbole after LLM: %s', async (scenario) => {
    const result = await buildProtocol('B just venting').checkSafetyProtocol(
      scenario.content,
      buildAuthor()
    );

    expect(result.shouldDisengage).toBe(false);
    expect(result.contextCheckPerformed).toBe(true);
    expect(result.llmAssessment?.classification).toBe('HYPERBOLE');
    expect(result.distressProbability).toBeGreaterThanOrEqual(0);
    expect(result.flags).toEqual([]);
  });

  it('records suspected false positives when hyperbole detected', async () => {
    await buildProtocol('B hyperbole check').checkSafetyProtocol(
      "I'm dying from this hangover lol",
      buildAuthor()
    );
    const suspected = metrics.increments.find(
      (entry) => entry.name === 'safety.false_positive_suspected'
    );
    expect(suspected?.tags?.category).toBe('DEATH_HYPERBOLE');
  });

  const casualMentionCases = [
    { content: 'My wife is pregnant and enjoyed a mocktail', category: 'PREGNANCY' },
    {
      content: 'Brother on insulin years ago, I drank last night',
      category: 'MEDICATION_INTERACTION',
    },
    { content: 'Grandma had liver disease, miss her', category: 'CHRONIC_CONDITIONS' },
    { content: 'Friend in rehab years back, we celebrated him', category: 'ADDICTION_RECOVERY' },
    { content: 'Hospital cafeteria coffee is terrible', category: 'HOSPITAL_MENTION' },
    { content: 'doctor on TV said stay hydrated', category: 'HOSPITAL_MENTION' },
    { content: 'nurse costume party last night', category: 'HOSPITAL_MENTION' },
    { content: 'high school reunion last night, brutal hangover', category: 'MINORS_UNCLEAR' },
    { content: 'freshman year memories hit hard', category: 'MINORS_UNCLEAR' },
    { content: 'feels like death but just kidding', category: 'DEATH_HYPERBOLE' },
  ];

  it.each(casualMentionCases)('allows casual mentions after LLM: %s', async (scenario) => {
    const result = await buildProtocol('C casual mention').checkSafetyProtocol(
      scenario.content,
      buildAuthor()
    );

    expect(result.shouldDisengage).toBe(false);
    expect(result.contextCheckPerformed).toBe(true);
    expect(result.llmAssessment?.classification).toBe('CASUAL_MENTION');
    expect(result.flags).toEqual([]);
  });
});

describe('SafetyProtocol - LLM Fallback Scenarios', () => {
  const metrics = new MetricsStub();

  beforeEach(() => metrics.reset());

  it('falls back to OpenAI when DeepSeek fails', async () => {
    const protocol = new SafetyProtocol({
      deepseek: new StubLlmClient('', true), // DeepSeek fails
      openai: new StubLlmClient('B hyperbole detected', false), // OpenAI works
      metrics,
    });

    const result = await protocol.checkSafetyProtocol(
      "I'm dying from this hangover lol",
      buildAuthor()
    );

    expect(result.shouldDisengage).toBe(false); // Correctly identified as hyperbole via fallback
    expect(result.llmAssessment?.model).toBe('gpt-5-nano-2025-08-07');
    expect(result.llmAssessment?.classification).toBe('HYPERBOLE');
  });

  it('falls back to conservative default when BOTH LLMs fail', async () => {
    const protocol = new SafetyProtocol({
      deepseek: new StubLlmClient('', true), // Fails
      openai: new StubLlmClient('', true), // Fails
      metrics,
    });

    const result = await protocol.checkSafetyProtocol(
      "I'm dying from this hangover lol",
      buildAuthor()
    );

    expect(result.shouldDisengage).toBe(true); // Conservative default is TRUE
    expect(result.llmAssessment?.model).toBe('fallback');
    expect(result.llmAssessment?.classification).toBe('GENUINE_CONCERN');
    expect(result.llmAssessment?.reasoning).toContain('unavailable');
  });

  it('handles invalid LLM response format by falling back to conservative default', async () => {
    const protocol = new SafetyProtocol({
      deepseek: new StubLlmClient('Invalid response format here', false),
      openai: new StubLlmClient('Also invalid', false),
      metrics,
    });

    const result = await protocol.checkSafetyProtocol(
      "I'm dying from this hangover lol",
      buildAuthor()
    );

    expect(result.shouldDisengage).toBe(true); // Invalid parse -> Conservative default
    expect(result.llmAssessment?.classification).toBe('GENUINE_CONCERN');
    expect(result.llmAssessment?.reasoning).toContain('Failed to parse');
  });
});
