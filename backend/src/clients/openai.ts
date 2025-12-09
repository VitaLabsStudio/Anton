import axios from 'axios';

import { logger } from '../utils/logger.js';

import type { DeepSeekClientOptions, GenerateOptions, GenerateResult } from './deepseek.js';

type OpenAIClientOptions = Pick<
  DeepSeekClientOptions,
  'apiKey' | 'timeoutMs' | 'maxRetries' | 'model'
>;

export class OpenAIClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly systemPrompt: string;

  constructor(options?: OpenAIClientOptions) {
    this.baseUrl = 'https://api.openai.com/v1';
    this.apiKey = options?.apiKey ?? process.env['OPENAI_API_KEY'] ?? '';
    this.model = options?.model ?? 'gpt-5.1';
    this.timeoutMs = options?.timeoutMs ?? 10000;
    this.maxRetries = options?.maxRetries ?? 3;
    this.systemPrompt = 'You are a precise text classifier. Respond with structured JSON only.';

    if (!this.apiKey) {
      logger.warn('OPENAI_API_KEY environment variable is missing. OpenAI fallback will fail.');
    }
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    return this.generateWithRetry(prompt, options);
  }

  private async generateWithRetry(
    prompt: string,
    options?: GenerateOptions,
    retries = this.maxRetries
  ): Promise<GenerateResult> {
    try {
      if (!this.apiKey) {
        throw new Error('OPENAI_API_KEY is not set');
      }

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.systemPrompt,
            },
            { role: 'user', content: prompt },
          ],
          temperature: options?.temperature ?? 0.3,
          max_tokens: options?.maxTokens ?? 200,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.timeoutMs,
        }
      );

      const message = response.data.choices[0].message;

      return {
        content: message.content,
        confidence: this.extractConfidence(message),
        usage: response.data.usage,
      };
    } catch (error) {
      if (retries > 0 && this.isRetryable(error)) {
        const delay = Math.pow(2, 4 - retries) * 1000; // 1s, 2s, 4s
        logger.warn({ error: (error as Error).message, delay }, 'OpenAI API call failed, retrying');
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.generateWithRetry(prompt, options, retries - 1);
      }

      logger.error({ error }, 'OpenAI API call failed after retries');
      throw error;
    }
  }

  private isRetryable(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      return status === 429 || (status !== undefined && status >= 500);
    }
    return false;
  }

  private extractConfidence(message: { content: string }): number {
    try {
      const parsed = JSON.parse(message.content);
      return typeof parsed.confidence === 'number' ? parsed.confidence : 0.9;
    } catch {
      return 0.9;
    }
  }
}
