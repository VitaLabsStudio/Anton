import { describe, it, expect } from 'vitest';

import { DeepSeekClient } from '../../../src/clients/deepseek';

// Skip if API key is not available
const apiKey = process.env['DEEPSEEK_API_KEY'];
const shouldSkip = !apiKey || apiKey === 'your_deepseek_key' || apiKey === 'your_api_key_here';

describe.skipIf(shouldSkip)('DeepSeekClient E2E', () => {
  it('should make a real API call', async () => {
    const client = new DeepSeekClient();
    const result = await client.generate('Respond with: {"test": true}', {
      maxTokens: 50,
    });

    expect(result.content).toBeDefined();
    // We expect JSON but the model might chat.
    // Just checking content presence and usage.
    expect(result.usage.total_tokens).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  }, 30000); // 30s timeout
});
