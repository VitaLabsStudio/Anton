import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { OpenAIClient } from '../../../src/clients/openai';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
}));

// Mock axios
vi.mock('axios', () => {
  return {
    default: {
      post: mocks.post,
      isAxiosError: (payload: unknown): boolean =>
        !!(payload as { isAxiosError?: boolean })?.isAxiosError,
    },
    isAxiosError: (payload: unknown): boolean =>
      !!(payload as { isAxiosError?: boolean })?.isAxiosError,
  };
});

describe('OpenAIClient Unit', () => {
  let client: OpenAIClient;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key' };
    client = new OpenAIClient();
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
        choices: [
          {
            message: {
              content: JSON.stringify({ score: 0.9, confidence: 0.95 }),
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      },
    };
    mocks.post.mockResolvedValueOnce(mockResponse);

    const result = await client.generate('Test prompt');

    expect(mocks.post).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        model: 'gpt-5.1',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'Test prompt' }),
        ]),
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
          choices: [{ message: { content: '{}' } }],
          usage: {},
        },
      });

    // Spy on setTimeout to speed up test
    vi.spyOn(global, 'setTimeout').mockImplementation((fn: () => void) => {
      fn();
      return 0 as unknown as NodeJS.Timeout;
    });

    await client.generate('Test retry');

    expect(mocks.post).toHaveBeenCalledTimes(3);
  });

  it('should fail after retries exhausted', async () => {
    mocks.post.mockRejectedValue({ isAxiosError: true, response: { status: 500 } });
    vi.spyOn(global, 'setTimeout').mockImplementation((fn: () => void) => {
      fn();
      return 0 as unknown as NodeJS.Timeout;
    });

    await expect(client.generate('Test fail')).rejects.toThrow();
    expect(mocks.post).toHaveBeenCalledTimes(4); // Initial + 3 retries
  });

  it('should default confidence to 0.9 if parsing fails', async () => {
    mocks.post.mockResolvedValueOnce({
      data: {
        choices: [{ message: { content: 'Not JSON' } }],
        usage: {},
      },
    });

    const result = await client.generate('Test parsing');
    expect(result.confidence).toBe(0.9);
  });
});
