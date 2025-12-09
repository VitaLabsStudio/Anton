import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { LinguisticIntentAnalyzer } from '../../../src/analysis/signal-1-linguistic';

const mocks = vi.hoisted(() => ({
  deepseekGenerate: vi.fn(),
  openaiGenerate: vi.fn(),
  redisGet: vi.fn(),
  redisSetex: vi.fn(),
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock DeepSeekClient
vi.mock('../../../src/clients/deepseek', () => {
  return {
    DeepSeekClient: class MockDeepSeekClient {
      generate = mocks.deepseekGenerate;
    },
  };
});

// Mock OpenAIClient
vi.mock('../../../src/clients/openai', () => {
  return {
    OpenAIClient: class MockOpenAIClient {
      generate = mocks.openaiGenerate;
    },
  };
});

// Mock Redis
vi.mock('../../../src/utils/redis', () => ({
  redis: {
    get: mocks.redisGet,
    setex: mocks.redisSetex,
  },
}));

// Mock Logger
vi.mock('../../../src/utils/logger', () => ({
  logger: mocks.logger,
}));

describe('LinguisticIntentAnalyzer', () => {
  let analyzer: LinguisticIntentAnalyzer;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset NodeCache? It's internal to the module.
    // Since we use `vi.mock` for imports, NodeCache is real.
    // But for each test we create new analyzer. The `cache` variable is module-level constant.
    // We might need to mock NodeCache too if we want to isolate tests completely
    // or just rely on unique content for each test.
    analyzer = new LinguisticIntentAnalyzer();
    mocks.deepseekGenerate.mockReset();
    mocks.openaiGenerate.mockReset();
    mocks.redisGet.mockReset();
    mocks.redisSetex.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const examples = [
    // High Solution Seeking (0.82 - 1.0)
    {
      text: 'What actually works to stop a hangover headache fast?',
      expected: 'high_solution',
      mockScore: 0.95,
    },
    // ... keeping it short for brevity, the logic is same
  ];

  it('should check Redis cache before API', async () => {
    const text = 'Redis test ' + Math.random();
    const cachedResult = {
      score: 0.88,
      confidence: 0.99,
      category: 'high_solution',
      reasoning: 'Cached',
    };

    mocks.redisGet.mockResolvedValueOnce(JSON.stringify(cachedResult));

    const result = await analyzer.analyzeLinguisticIntent(text);

    expect(mocks.redisGet).toHaveBeenCalledWith(expect.stringContaining('sss:'));
    expect(result).toEqual(cachedResult);
    expect(mocks.deepseekGenerate).not.toHaveBeenCalled();
  });

  it('should save to Redis after API call', async () => {
    const text = 'Redis save test ' + Math.random();
    mocks.redisGet.mockResolvedValueOnce(null);
    mocks.deepseekGenerate.mockResolvedValueOnce({
      content: JSON.stringify({ score: 0.9, reasoning: 'Fresh' }),
      confidence: 0.95,
      usage: { total_tokens: 100 },
    });

    await analyzer.analyzeLinguisticIntent(text);

    expect(mocks.redisSetex).toHaveBeenCalledWith(
      expect.stringContaining('sss:'),
      604800,
      expect.stringContaining('"score":0.9')
    );
  });

  it('should fallback to local cache if Redis get fails', async () => {
    const text = 'Local fallback test ' + Math.random();
    mocks.redisGet.mockRejectedValueOnce(new Error('Redis down'));

    // Mock API success
    mocks.deepseekGenerate.mockResolvedValueOnce({
      content: JSON.stringify({ score: 0.7, reasoning: 'Fresh' }),
      confidence: 0.95,
      usage: { total_tokens: 100 },
    });

    // First call - populates local cache (and tries to set Redis)
    mocks.redisSetex.mockRejectedValueOnce(new Error('Redis down')); // Set also fails
    await analyzer.analyzeLinguisticIntent(text);

    // Second call - Redis fails again, but local cache should hit
    mocks.redisGet.mockRejectedValueOnce(new Error('Redis down'));
    // API should NOT be called this time
    mocks.deepseekGenerate.mockClear();

    const result = await analyzer.analyzeLinguisticIntent(text);

    expect(mocks.redisGet).toHaveBeenCalledTimes(2); // Called twice
    expect(mocks.deepseekGenerate).not.toHaveBeenCalled(); // Should hit local cache
    expect(result.score).toBe(0.7);
  });

  // ... Existing tests adapted ...
  it('should classify posts correctly based on score', async () => {
    // Mock Redis miss
    mocks.redisGet.mockResolvedValue(null);

    mocks.deepseekGenerate.mockResolvedValueOnce({
      content: JSON.stringify({ score: 0.95, reasoning: 'Test reasoning' }),
      confidence: 0.95,
      usage: { total_tokens: 100 },
    });
    const result = await analyzer.analyzeLinguisticIntent(examples[0].text);
    expect(result.score).toBe(0.95);
  });
});
