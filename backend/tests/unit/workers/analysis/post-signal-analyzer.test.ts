import { describe, it, expect, vi, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  analyzeLinguisticIntent: vi.fn(),
  analyzeSemanticTopic: vi.fn(),
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../../src/analysis/signal-1-linguistic.js', () => ({
  analyzeLinguisticIntent: mocks.analyzeLinguisticIntent,
}));

vi.mock('../../../../src/analysis/signal-4-semantic.js', () => ({
  analyzeSemanticTopic: mocks.analyzeSemanticTopic,
}));

vi.mock('../../../../src/utils/logger.js', () => ({
  logger: mocks.logger,
}));

import { analyzePostSignals } from '../../../../src/workers/analysis/post-signal-analyzer.js';

describe('analyzePostSignals', () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.restoreAllMocks();
  });

  it('runs both signals in parallel and returns recorded duration', async () => {
    const linguistic = {
      score: 0.9,
      confidence: 0.92,
      category: 'high_solution' as const,
      reasoning: 'Need hydration',
    };

    const semantic = {
      score: 0.8,
      confidence: 0.9,
      context: 'actual_hangover' as const,
      reasoning: 'Physical drinking context',
    };

    mocks.analyzeLinguisticIntent.mockResolvedValue(linguistic);
    mocks.analyzeSemanticTopic.mockResolvedValue(semantic);

    const nowSpy = vi
      .spyOn(Date, 'now')
      .mockImplementationOnce(() => 1000)
      .mockImplementationOnce(() => 1125);

    const result = await analyzePostSignals('Drank too much tequila');

    expect(result.durationMs).toBe(125);
    expect(result.linguistic).toBe(linguistic);
    expect(result.semantic).toBe(semantic);
    expect(mocks.logger.warn).not.toHaveBeenCalled();
    expect(nowSpy).toHaveBeenCalledTimes(2);
  });

  it('warns when duration exceeds the 2s latency budget', async () => {
    const linguistic = {
      score: 0.2,
      confidence: 0.4,
      category: 'low_solution' as const,
      reasoning: 'Probably metaphor',
    };

    const semantic = {
      score: 0.0,
      confidence: 0.95,
      context: 'metaphor' as const,
      reasoning: 'Pop culture reference',
    };

    mocks.analyzeLinguisticIntent.mockResolvedValue(linguistic);
    mocks.analyzeSemanticTopic.mockResolvedValue(semantic);

    vi.spyOn(Date, 'now')
      .mockImplementationOnce(() => 50)
      .mockImplementationOnce(() => 2150);

    await analyzePostSignals('This movie hangover is brutal');

    expect(mocks.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ durationMs: 2100 }),
      'Signal analysis exceeded latency budget'
    );
  });
});
