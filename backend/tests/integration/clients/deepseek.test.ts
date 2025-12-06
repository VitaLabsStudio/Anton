import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { DeepSeekClient } from '../../../src/clients/deepseek';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
}));

// Mock axios
vi.mock('axios', () => {
  return {
    default: {
      post: mocks.post,
      isAxiosError: (payload: unknown): boolean => !!(payload as { isAxiosError?: boolean })?.isAxiosError,
    },
    isAxiosError: (payload: unknown): boolean => !!(payload as { isAxiosError?: boolean })?.isAxiosError,
  };
});

describe('DeepSeekClient Integration', () => {
  let client: DeepSeekClient;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, DEEPSEEK_API_KEY: 'test-key' };
    client = new DeepSeekClient();
    vi.clearAllMocks();
    mocks.post.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should make a successful request', async () => {
    const mockResponse = {
      data: {
        choices: [{
          message: {
            content: JSON.stringify({ score: 0.9, confidence: 0.95 }),
          }
        }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
      }
    };
    mocks.post.mockResolvedValueOnce(mockResponse);

    const result = await client.generate("Test prompt");

    expect(mocks.post).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1/chat/completions',
      expect.objectContaining({
        model: 'deepseek-reasoner',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'Test prompt' })
        ])
      }),
      expect.any(Object)
    );

    expect(result.content).toContain('score');
    expect(result.confidence).toBe(0.95);
  });

  it('should retry on 5xx errors', async () => {
    // Setup responses: Fail, Fail, Success
    mocks.post
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 500 } })
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 503 } })
      .mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: "{}" } }],
          usage: {}
        }
      });

    // Spy on setTimeout to speed up test
    vi.spyOn(global, 'setTimeout').mockImplementation((fn: () => void) => { fn(); return 0 as unknown as NodeJS.Timeout; });

    await client.generate("Test retry");

    expect(mocks.post).toHaveBeenCalledTimes(3);
  });

  it('should fail after retries exhausted', async () => {
    mocks.post.mockRejectedValue({ isAxiosError: true, response: { status: 500 } });
    vi.spyOn(global, 'setTimeout').mockImplementation((fn: () => void) => { fn(); return 0 as unknown as NodeJS.Timeout; });

    await expect(client.generate("Test fail")).rejects.toThrow();
    expect(mocks.post).toHaveBeenCalledTimes(4); // Initial + 3 retries
  });

  it('should default confidence to 0.85 if parsing fails', async () => {
    mocks.post.mockResolvedValueOnce({
      data: {
        choices: [{ message: { content: "Not JSON" } }],
        usage: {}
      }
    });

    const result = await client.generate("Test parsing");
    expect(result.confidence).toBe(0.85);
  });
});
