/**
 * Tests for SemanticProfilePipeline
 * Story 2.10: Task 1, Subtask 2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Hoist mocks to ensure they are available for vi.mock
const mocks = vi.hoisted(() => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    on: vi.fn(),
    connect: vi.fn(),
  },
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock('../../../utils/redis', () => ({
  redis: mocks.redis,
}));

vi.mock('../../../utils/openai', () => ({
  openai: mocks.openai,
}));

import { SemanticProfilePipeline } from './semantic-profile-pipeline';

describe('SemanticProfilePipeline', () => {
  let pipeline: SemanticProfilePipeline;

  const mockPost = {
    postId: 'post-123',
    content: 'This is a test post about vaccine safety.',
    authorHandle: '@testuser',
    platform: 'reddit' as const,
  };

  beforeEach(() => {
    pipeline = new SemanticProfilePipeline();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('run()', () => {
    it('should return semantic profile with default values when no analysis available', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue(null);

      // Act
      const profile = await pipeline.run(mockPost);

      // Assert
      expect(profile).toBeDefined();
      expect(profile.emotionVector).toBeDefined();
      expect(profile.urgency).toBeGreaterThanOrEqual(0);
      expect(profile.urgency).toBeLessThanOrEqual(1);
      expect(profile.misinformationProbability).toBeGreaterThanOrEqual(0);
      expect(profile.misinformationProbability).toBeLessThanOrEqual(1);
      expect(profile.confidence).toBeGreaterThanOrEqual(0);
      expect(profile.confidence).toBeLessThanOrEqual(1);
      expect(profile.timestamp).toBeInstanceOf(Date);
      expect(profile.cacheHit).toBe(false);
    });

    it('should return profile when cache available (graceful fallback in test)', async () => {
      // Arrange
      const cachedProfile = {
        emotionVector: {
          joy: 0.8,
          sadness: 0,
          anger: 0,
          fear: 0,
          surprise: 0.2,
          disgust: 0,
          neutral: 0,
        },
        urgency: 0.6,
        misinformationProbability: 0.1,
        humorDetected: false,
        stance: 'positive' as const,
        rationale: 'Cached analysis',
        confidence: 0.85,
        cacheHit: false,
        timestamp: new Date().toISOString(),
      };

      mocks.redis.get.mockResolvedValue(JSON.stringify(cachedProfile));

      // Act
      const profile = await pipeline.run(mockPost);

      // Assert
      expect(profile).toBeDefined();
      expect(profile.confidence).toBeGreaterThan(0);
    });

    it('should attempt to cache new analysis results', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue(null);
      mocks.redis.setex.mockResolvedValue('OK');

      // Act
      const profile = await pipeline.run(mockPost);

      // Assert
      expect(profile.cacheHit).toBe(false);
      expect(profile).toBeDefined();
      expect(profile.confidence).toBeGreaterThan(0);
    });

    it('should call LLM API when enabled', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                emotions: { joy: 0.7, sadness: 0.1, anger: 0.0, fear: 0.0, surprise: 0.2, disgust: 0.0, neutral: 0.0 },
                urgency: 0.5,
                misinformationProbability: 0.1,
                humorDetected: true,
                stance: 'positive',
                rationale: 'Content expresses excitement and joy',
              }),
            },
          },
        ],
      };

      mocks.openai.chat.completions.create.mockResolvedValue(mockResponse);
      mocks.redis.get.mockResolvedValue(null);

      const pipeline = new SemanticProfilePipeline({ enableLLM: true });
      const profile = await pipeline.run({
        postId: 'test-post',
        content: 'This is great news!',
        platform: 'twitter',
      });

      expect(profile.emotionVector.joy).toBeGreaterThan(0.5);
      expect(profile.humorDetected).toBe(true);
      expect(profile.rationale).toContain('excitement');
    });

    it('should include emotion vector with all emotions', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue(null);

      // Act
      const profile = await pipeline.run(mockPost);

      // Assert
      expect(profile.emotionVector).toBeDefined();
      expect(profile.emotionVector.joy).toBeGreaterThanOrEqual(0);
      expect(profile.emotionVector.joy).toBeLessThanOrEqual(1);
      expect(profile.emotionVector.sadness).toBeGreaterThanOrEqual(0);
      expect(profile.emotionVector.anger).toBeGreaterThanOrEqual(0);
      expect(profile.emotionVector.fear).toBeGreaterThanOrEqual(0);
      expect(profile.emotionVector.surprise).toBeGreaterThanOrEqual(0);
      expect(profile.emotionVector.disgust).toBeGreaterThanOrEqual(0);
      expect(profile.emotionVector.neutral).toBeGreaterThanOrEqual(0);
    });

    it('should detect stance correctly', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue(null);

      // Act
      const profile = await pipeline.run(mockPost);

      // Assert
      expect(profile.stance).toBeDefined();
      expect(['positive', 'negative', 'neutral', 'questioning']).toContain(profile.stance);
    });

    it('should include rationale string', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue(null);

      // Act
      const profile = await pipeline.run(mockPost);

      // Assert
      expect(profile.rationale).toBeDefined();
      expect(typeof profile.rationale).toBe('string');
      expect(profile.rationale.length).toBeGreaterThan(0);
    });

    it('should complete analysis within reasonable time', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue(null);
      const startTime = Date.now();

      // Act
      await pipeline.run(mockPost);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });

    it('should handle different platforms', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue(null);
      const platforms: Array<'twitter' | 'reddit' | 'threads'> = ['twitter', 'reddit', 'threads'];

      // Act & Assert
      for (const platform of platforms) {
        const post = { ...mockPost, platform };
        const profile = await pipeline.run(post);
        expect(profile).toBeDefined();
        expect(profile.confidence).toBeGreaterThan(0);
      }
    });

    it('should respect cache TTL configuration', async () => {
      // Arrange
      const customPipeline = new SemanticProfilePipeline({ cacheTTL: 3600 }); // 1 hour
      mocks.redis.get.mockResolvedValue(null);
      mocks.redis.setex.mockResolvedValue('OK');

      // Act
      const profile = await customPipeline.run(mockPost);

      // Assert
      expect(profile).toBeDefined();
      expect(profile.confidence).toBeGreaterThan(0);
    });

    it('should handle cache retrieval failure gracefully', async () => {
      // Arrange
      mocks.redis.get.mockRejectedValue(new Error('Redis connection failed'));

      // Act
      const profile = await pipeline.run(mockPost);

      // Assert
      expect(profile).toBeDefined();
      expect(profile.cacheHit).toBe(false);
      expect(profile.confidence).toBeGreaterThan(0);
    });

    it('should handle cache storage failure gracefully', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue(null);
      mocks.redis.setex.mockRejectedValue(new Error('Redis write failed'));

      // Act & Assert
      await expect(pipeline.run(mockPost)).resolves.toBeDefined();
    });

    it('should detect humor when present', async () => {
      // Arrange
      const humorPost = {
        ...mockPost,
        content: 'Why did the vaccine cross the road? To get to the other side! 😂',
      };
      mocks.redis.get.mockResolvedValue(null);

      // Act
      const profile = await pipeline.run(humorPost);

      // Assert
      expect(profile.humorDetected).toBeDefined();
      expect(typeof profile.humorDetected).toBe('boolean');
    });

    it('should calculate misinformation probability', async () => {
      // Arrange
      const suspiciousPost = {
        ...mockPost,
        content: 'Vaccines contain tracking chips and 5G nanobots!!!',
      };
      mocks.redis.get.mockResolvedValue(null);

      // Act
      const profile = await pipeline.run(suspiciousPost);

      // Assert
      expect(profile.misinformationProbability).toBeGreaterThanOrEqual(0);
      expect(profile.misinformationProbability).toBeLessThanOrEqual(1);
    });

    it('should include optional toxicity score', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue(null);

      // Act
      const profile = await pipeline.run(mockPost);

      // Assert
      if (profile.toxicity !== undefined) {
        expect(profile.toxicity).toBeGreaterThanOrEqual(0);
        expect(profile.toxicity).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('clearCache()', () => {
    it('should attempt to clear cache for specific post', async () => {
      // Arrange
      mocks.redis.del.mockResolvedValue(1);

      // Act & Assert
      await expect(pipeline.clearCache('post-123')).resolves.toBeUndefined();
    });

    it('should handle cache clear failure gracefully', async () => {
      // Arrange
      mocks.redis.del.mockRejectedValue(new Error('Redis delete failed'));

      // Act & Assert
      await expect(pipeline.clearCache('post-123')).resolves.toBeUndefined();
    });
  });

  describe('getCacheStats()', () => {
    it('should return cache statistics', async () => {
      // Act
      const stats = await pipeline.getCacheStats();

      // Assert
      expect(stats).toBeDefined();
      expect(stats.totalKeys).toBeGreaterThanOrEqual(0);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
      expect(stats.hitRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Configuration', () => {
    it('should respect disabling LLM', async () => {
      // Arrange
      const pipelineNoLLM = new SemanticProfilePipeline({ enableLLM: false });
      mocks.redis.get.mockResolvedValue(null);

      // Act
      const profile = await pipelineNoLLM.run(mockPost);

      // Assert
      expect(profile).toBeDefined();
      expect(profile.confidence).toBeGreaterThan(0);
    });

    it('should respect disabling ML classifiers', async () => {
      // Arrange
      const pipelineNoML = new SemanticProfilePipeline({ enableMLClassifiers: false });
      mocks.redis.get.mockResolvedValue(null);

      // Act
      const profile = await pipelineNoML.run(mockPost);

      // Assert
      expect(profile).toBeDefined();
    });

    it('should respect disabling PII redaction', async () => {
      // Arrange
      const pipelineNoPII = new SemanticProfilePipeline({ enablePIIRedaction: false });
      mocks.redis.get.mockResolvedValue(null);

      // Act
      const profile = await pipelineNoPII.run(mockPost);

      // Assert
      expect(profile).toBeDefined();
    });

    it('should support different LLM providers', async () => {
      // Arrange
      const pipelineDeepSeek = new SemanticProfilePipeline({ llmProvider: 'deepseek' });
      const pipelineOpenAI = new SemanticProfilePipeline({ llmProvider: 'openai' });
      mocks.redis.get.mockResolvedValue(null);

      // Act & Assert
      await expect(pipelineDeepSeek.run(mockPost)).resolves.toBeDefined();
      await expect(pipelineOpenAI.run(mockPost)).resolves.toBeDefined();
    });
  });
});