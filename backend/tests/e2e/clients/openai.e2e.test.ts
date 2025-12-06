import { describe, it, expect } from 'vitest';

import { OpenAIClient } from '../../../src/clients/openai';

const apiKey = process.env['OPENAI_API_KEY'];
const shouldSkip = !apiKey || apiKey === 'your_openai_key' || apiKey === 'your_openai_key_here';

describe.skipIf(shouldSkip)('OpenAIClient E2E', () => {
  it('should make a real API call', async () => {
    const client = new OpenAIClient();
    const result = await client.generate('Respond with: {"test": true}', {
      maxTokens: 50,
    });

    expect(result.content).toBeDefined();
    expect(result.usage.total_tokens).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  }, 30000); // 30s timeout
});
