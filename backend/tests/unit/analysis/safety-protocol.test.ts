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

  constructor(response: string) {
    this.response = response;
  }

  async generate(): Promise<{
    content: string;
    confidence: number;
    usage: Record<string, number>;
  }> {
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

describe('SafetyProtocol - CRITICAL tier detection', () => {
  const metrics = new MetricsStub();
  const protocol = (): SafetyProtocol =>
    new SafetyProtocol({
      deepseek: new StubLlmClient('A genuine concern'),
      openai: new StubLlmClient('A genuine concern'),
      metrics,
    });

  beforeEach(() => {
    metrics.reset();
  });

  const suicideCases = [
    { content: 'I want to kill myself tonight', category: 'SUICIDE_SELF_HARM' },
    { content: 'Thinking about ending it all after this', category: 'SUICIDE_SELF_HARM' },
    { content: "I can't go on anymore", category: 'SUICIDE_SELF_HARM' },
    { content: 'better off dead than this', category: 'SUICIDE_SELF_HARM' },
    { content: 'no reason to live today', category: 'SUICIDE_SELF_HARM' },
    { content: 'going to harm myself if this continues', category: 'SUICIDE_SELF_HARM' },
    { content: 'ending it all seems easiest', category: 'SUICIDE_SELF_HARM' },
    { content: 'want to hurt myself over this', category: 'SUICIDE_SELF_HARM' },
    { content: 'my life is not worth living', category: 'SUICIDE_SELF_HARM' },
    { content: "can't go on, will kill myself", category: 'SUICIDE_SELF_HARM' },
  ];

  const alcoholPoisoningCases = [
    { content: "Can't stop vomiting after all the shots", category: 'ALCOHOL_POISONING' },
    { content: 'I vomited blood tonight and feel awful', category: 'ALCOHOL_POISONING' },
    { content: 'blacked out on the bathroom floor', category: 'ALCOHOL_POISONING' },
    { content: 'he passed out and is unconscious after drinking', category: 'ALCOHOL_POISONING' },
    { content: 'hands are cold and clammy right now', category: 'ALCOHOL_POISONING' },
    { content: 'slow shallow breathing after binge drinking', category: 'ALCOHOL_POISONING' },
    { content: 'showing signs of hypothermia from alcohol', category: 'ALCOHOL_POISONING' },
    { content: 'skin looks pale and I feel worse than ever', category: 'ALCOHOL_POISONING' },
    { content: "confused and can't stand up", category: 'ALCOHOL_POISONING' },
    { content: 'friend choked on vomit earlier tonight', category: 'ALCOHOL_POISONING' },
  ];

  const medicalEmergencyCases = [
    { content: 'calling 911 because of this pain', category: 'MEDICAL_EMERGENCY' },
    { content: 'headed to the emergency room now', category: 'MEDICAL_EMERGENCY' },
    { content: 'an ambulance is on the way', category: 'MEDICAL_EMERGENCY' },
    { content: 'severe chest pain after drinking', category: 'MEDICAL_EMERGENCY' },
    { content: "I can't breathe and feel faint", category: 'MEDICAL_EMERGENCY' },
    { content: 'think I am having a heart attack', category: 'MEDICAL_EMERGENCY' },
    { content: 'signs of a stroke right now', category: 'MEDICAL_EMERGENCY' },
    { content: 'worried about internal bleeding', category: 'MEDICAL_EMERGENCY' },
  ];

  const minorsCases = [
    { content: "I'm 16 and drank too much", category: 'MINORS_CLEAR' },
    { content: 'underage drinking party went wrong', category: 'MINORS_CLEAR' },
    { content: 'I am 15 years old and sick', category: 'MINORS_CLEAR' },
    { content: 'teenage party got out of hand', category: 'MINORS_CLEAR' },
    { content: 'drinking in middle school bathroom', category: 'MINORS_CLEAR' },
    { content: 'junior high students drinking', category: 'MINORS_CLEAR' },
  ];

  const abnormalSeverityCases = [
    { content: 'this hangover has been 4 days now', category: 'ABNORMAL_SEVERITY' },
    { content: 'third day and worse than ever', category: 'ABNORMAL_SEVERITY' },
    { content: "I can't walk or stand straight", category: 'ABNORMAL_SEVERITY' },
    { content: 'vision is blurry and seeing double', category: 'ABNORMAL_SEVERITY' },
    { content: 'hallucinating and shaking uncontrollably', category: 'ABNORMAL_SEVERITY' },
    { content: 'bad tremors in my hands', category: 'ABNORMAL_SEVERITY' },
    { content: 'going through withdrawal symptoms', category: 'ABNORMAL_SEVERITY' },
  ];

  it.each([
    ...suicideCases,
    ...alcoholPoisoningCases,
    ...medicalEmergencyCases,
    ...minorsCases,
    ...abnormalSeverityCases,
  ])('forces disengage for critical signal: %s', async ({ content, category }) => {
    const result = await protocol().checkSafetyProtocol(content, buildAuthor());

    expect(result.shouldDisengage).toBe(true);
    expect(result.severity).toBe(SafetySeverity.CRITICAL);
    expect(result.flags).toContain(category);
    expect(result.contextCheckPerformed).toBe(false);
    expect(result.distressProbability).toBeGreaterThanOrEqual(0.7);
  });

  it('logs metrics for critical triggers', async () => {
    await protocol().checkSafetyProtocol('calling 911 right now', buildAuthor());

    const triggerMetric = metrics.increments.find((entry) => entry.name === 'safety.trigger_total');
    expect(triggerMetric?.tags?.category).toBe('MEDICAL_EMERGENCY');
    expect(triggerMetric?.tags?.severity).toBe(SafetySeverity.CRITICAL);
  });

  it('returns escalation resources for suicide/self-harm', async () => {
    const result = await protocol().checkSafetyProtocol(
      'I want to kill myself tonight',
      buildAuthor()
    );
    expect(result.resources?.some((resource) => resource.resource.includes('988'))).toBe(true);
    expect(result.disclaimer).toBeDefined();
  });
});

describe('SafetyProtocol - distress probability factors', () => {
  const metrics = new MetricsStub();
  const protocol = (): SafetyProtocol =>
    new SafetyProtocol({
      deepseek: new StubLlmClient('A genuine concern'),
      openai: new StubLlmClient('A genuine concern'),
      metrics,
    });

  beforeEach(() => metrics.reset());

  it('raises probability when multiple critical flags appear', async () => {
    const content =
      "Can't stop vomiting blood and feel cold and clammy, it's been 3 days and getting worse";
    const result = await protocol().checkSafetyProtocol(content, buildAuthor());
    expect(result.distressProbability).toBeGreaterThanOrEqual(0.8);
  });

  it('includes author safety history in probability', async () => {
    const author = buildAuthor({
      interactionHistory: [{ type: 'safety_concern' }],
    } as unknown as Author);

    const lowResult = await protocol().checkSafetyProtocol(
      'hospital after bad night',
      buildAuthor()
    );
    const historyResult = await protocol().checkSafetyProtocol('hospital after bad night', author);

    expect(historyResult.distressProbability).toBeGreaterThan(lowResult.distressProbability);
  });

  it('clamps probability within [0,1]', async () => {
    const result = await protocol().checkSafetyProtocol(
      "I want to kill myself, please help me now, can't breathe",
      buildAuthor()
    );

    expect(result.distressProbability).toBeLessThanOrEqual(1);
    expect(result.distressProbability).toBeGreaterThanOrEqual(0);
  });

  it('applies intensifier bonus for desperate language', async () => {
    const result = await protocol().checkSafetyProtocol(
      "can't stop vomiting, please help me, I'm desperate",
      buildAuthor()
    );
    expect(result.distressProbability).toBeGreaterThan(0.7);
  });
});
