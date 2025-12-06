import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SemanticTopicAnalyzer } from '../../../src/analysis/signal-4-semantic';

const mocks = vi.hoisted(() => ({
  deepseekGenerate: vi.fn(),
  openaiGenerate: vi.fn(),
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../src/clients/deepseek.js', () => {
  return {
    DeepSeekClient: class {
      generate = mocks.deepseekGenerate;
    },
  };
});

vi.mock('../../../src/clients/openai.js', () => {
  return {
    OpenAIClient: class {
      generate = mocks.openaiGenerate;
    },
  };
});

vi.mock('../../../src/utils/logger.js', () => ({
  logger: mocks.logger,
}));

describe('SemanticTopicAnalyzer', () => {
  let analyzer: SemanticTopicAnalyzer;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new SemanticTopicAnalyzer();
  });

  it('flags a wide range of metaphors before invoking DeepSeek', async () => {
    const metaphorExamples = [
      'Inbox hangover after vacation',
      'Crypto hangover following the crash',
      'Meeting nausea after four back-to-back calls',
      'Election hangover is still hanging over me',
      'Emotional hangover from that breakup',
      'Movie hangover from John Wick is real',
      'The Hangover Part 2 marathon hangover',
      'Binge watching hangover after the new season',
      'Song hangover from that catchy chorus',
      'Album hangover after listening to 1989',
      'Startup hangover after a brutal sprint',
      'Trading hangover still haunting me',
      'Market hangover from yesterday’s crash',
      'Exam hangover from finals week',
      'Bitcoin hangover after the pump and dump',
      'Ethereum hangover from constant gas fees',
      'Work hangover from the all-hands',
      'Team hangover after the release party',
      'Project hangover from the merger calls',
      'Crypto nausea following the volatility',
      'Poker hangover after losing the big bet',
      'Drinking hangover from the virtual happy hour',
      'Movie marathon hangover even without alcohol',
      'Hangover playlist stuck in my head',
      'Soundtrack hangover after watching the series',
      'Film hangover from the cliffhanger ending',
      'Series hangover from the finale binge',
      'Show hangover after the Broadway revival',
      'Album hangover from that late-night listening',
      'Meeting hangover after strategic planning',
      'Inbox hangover from reopening that thread',
      'Crypto hangover with every price update',
      'Market hangover after earnings reports',
    ];

    for (const example of metaphorExamples) {
      const result = await analyzer.analyzeSemanticTopic(example);
      expect(result.score).toBeCloseTo(0, 3);
      expect(result.context).toBe('metaphor');
    }

    expect(mocks.deepseekGenerate).not.toHaveBeenCalled();
    expect(mocks.openaiGenerate).not.toHaveBeenCalled();
  });

  it('returns actual hangover when DeepSeek is confident and score is high', async () => {
    mocks.deepseekGenerate.mockResolvedValueOnce({
      content: JSON.stringify({
        score: 1.0,
        isActualHangover: true,
        confidence: 0.95,
        ambiguity: 0.05,
        reasoning: 'Physical symptoms after a night out',
      }),
      confidence: 0.95,
      usage: { completion_tokens: 10, prompt_tokens: 30, total_tokens: 40 },
    });

    const result = await analyzer.analyzeSemanticTopic('Headache from last night’s tequila');

    expect(result.score).toBe(1.0);
    expect(result.context).toBe('actual_hangover');
    expect(mocks.openaiGenerate).not.toHaveBeenCalled();
  });

  it('falls back to GPT-5.1 when DeepSeek confidence is low', async () => {
    mocks.deepseekGenerate.mockResolvedValueOnce({
      content: JSON.stringify({
        score: 0.2,
        isActualHangover: false,
        confidence: 0.6,
        ambiguity: 0.5,
        reasoning: 'Probably metaphorical',
      }),
      confidence: 0.6,
      usage: { completion_tokens: 2, prompt_tokens: 5, total_tokens: 7 },
    });

    mocks.openaiGenerate.mockResolvedValueOnce({
      content: JSON.stringify({
        score: 0.1,
        isActualHangover: false,
        confidence: 0.9,
        ambiguity: 0.3,
        reasoning: 'GPT confirmed metaphor context',
      }),
      confidence: 0.9,
      usage: { completion_tokens: 3, prompt_tokens: 6, total_tokens: 9 },
    });

    const result = await analyzer.analyzeSemanticTopic('My inbox hangover is endless');

    expect(result.score).toBeCloseTo(0.1, 3);
    expect(result.context).toBe('metaphor');
    expect(mocks.openaiGenerate).toHaveBeenCalled();
  });

  it('treats ambiguous scores as ambiguous context and logs the case', async () => {
    mocks.deepseekGenerate.mockResolvedValueOnce({
      content: JSON.stringify({
        score: 0.5,
        isActualHangover: false,
        confidence: 0.9,
        ambiguity: 0.5,
        reasoning: 'Could be real or metaphor',
      }),
      confidence: 0.9,
      usage: { completion_tokens: 5, prompt_tokens: 8, total_tokens: 13 },
    });

    const result = await analyzer.analyzeSemanticTopic('I have that meeting nausea after the retreat');

    expect(result.context).toBe('ambiguous');
    expect(mocks.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        ambiguity: 0.5,
        contentSnippet: expect.any(String),
      }),
      'Ambiguous semantic topic detected'
    );
  });

  it('uses named entity detection for movie or album references', async () => {
    const reference = 'The Hangover soundtrack is giving me a hangover';

    const result = await analyzer.analyzeSemanticTopic(reference);

    expect(result.context).toBe('metaphor');
    expect(result.score).toBeCloseTo(0, 3);
    expect(result.detectedPattern).toContain('Hangover');
    expect(mocks.deepseekGenerate).not.toHaveBeenCalled();
  });
});
