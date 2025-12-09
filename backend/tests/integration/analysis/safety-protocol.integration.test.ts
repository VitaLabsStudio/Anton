import type { Author } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SafetyProtocol, SafetySeverity } from '../../../src/analysis/safety-protocol.js';
import { logger } from '../../../src/utils/logger.js';

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
      throw new Error('LLM failure');
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
    id: 'author-int-1',
    platform: 'TWITTER',
    platformId: 'platform-int-1',
    handle: 'integration-user',
    displayName: 'Integration User',
    followerCount: 50,
    isVerified: false,
    isPowerUser: false,
    powerTierId: null,
    archetypeTags: [],
    relationshipScore: 0.3,
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

describe('SafetyProtocol integration', () => {
  const metrics = new MetricsStub();

  beforeEach(() => {
    metrics.reset();
  });

  it('falls back conservatively when all LLM providers fail', async () => {
    const protocol = new SafetyProtocol({
      deepseek: new StubLlmClient('', true),
      openai: new StubLlmClient('', true),
      metrics,
    });

    const result = await protocol.checkSafetyProtocol(
      "I'm dying from this hangover",
      buildAuthor()
    );

    expect(result.shouldDisengage).toBe(true);
    expect(result.llmAssessment?.model).toBe('fallback');
    expect(result.contextCheckPerformed).toBe(true);
    expect(result.distressProbability).toBeGreaterThan(0);

    const assessmentMetric = metrics.increments.find(
      (entry) => entry.name === 'safety.llm_assessment_total'
    );
    expect(assessmentMetric?.tags?.model).toBe('fallback');
  });

  it('logs audit entries with context and reasoning', async () => {
    const infoSpy = vi.spyOn(logger, 'info');
    const protocol = new SafetyProtocol({
      deepseek: new StubLlmClient('A genuine concern'),
      openai: new StubLlmClient('A genuine concern'),
      metrics,
    });

    await protocol.checkSafetyProtocol('calling 911 for my friend after overdose', buildAuthor());

    expect(infoSpy).toHaveBeenCalled();
    const payload = infoSpy.mock.calls[0]?.[0] as {
      safetyAudit?: { flags: string[]; content: string };
    };
    expect(payload?.safetyAudit?.flags?.[0]).toBe('MEDICAL_EMERGENCY');
    expect(payload?.safetyAudit?.content.length).toBeLessThanOrEqual(200);
    infoSpy.mockRestore();
  });

  it('returns resources and disclaimer for disengage decisions', async () => {
    const protocol = new SafetyProtocol({
      deepseek: new StubLlmClient('A genuine concern'),
      openai: new StubLlmClient('A genuine concern'),
      metrics,
    });

    const result = await protocol.checkSafetyProtocol('I want to kill myself', buildAuthor());

    expect(result.resources?.length).toBeGreaterThan(0);
    expect(result.disclaimer).toBeTruthy();
    expect(result.severity).toBe(SafetySeverity.CRITICAL);
  });

  it('uses highest severity when multiple contextual categories are present', async () => {
    const protocol = new SafetyProtocol({
      deepseek: new StubLlmClient('A genuine concern'),
      openai: new StubLlmClient('A genuine concern'),
      metrics,
    });

    const content = "I'm pregnant and feel like dying after the hospital visit";
    const result = await protocol.checkSafetyProtocol(content, buildAuthor());

    expect(result.severity).toBe(SafetySeverity.HIGH);
    expect(result.flags).toContain('PREGNANCY');
  });
});
