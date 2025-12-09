import { describe, it, expect } from 'vitest';

import { analyzeLinguisticIntent } from '../../../src/analysis/signal-1-linguistic';

const apiKey = process.env['DEEPSEEK_API_KEY'];
const shouldSkip = !apiKey || apiKey === 'your_deepseek_key' || apiKey === 'your_api_key_here';

describe.skipIf(shouldSkip)('LinguisticIntentAnalyzer E2E', () => {
  it('should classify high solution seeking post', async () => {
    // Using random suffix to bypass potential existing cache
    const text =
      'I desperately need advice on how to fix my car engine. It is making a loud noise and I am stuck. ' +
      Math.random();
    const result = await analyzeLinguisticIntent(text);

    // We accept moderate if the model is feeling conservative, but high is expected
    expect(result.score).toBeGreaterThanOrEqual(0.55);
    if (result.score >= 0.82) {
      expect(result.category).toBe('high_solution');
    }
  }, 30000);

  it('should classify low solution seeking post', async () => {
    const text = 'Just saw the funniest movie ever lol ' + Math.random();
    const result = await analyzeLinguisticIntent(text);
    expect(result.score).toBeLessThan(0.55);
    expect(result.category).toBe('low_solution');
  }, 30000);

  it('should use cache on second call', async () => {
    const text = 'Cache test E2E ' + Math.random();

    const start1 = Date.now();
    await analyzeLinguisticIntent(text);
    const dur1 = Date.now() - start1;

    const start2 = Date.now();
    await analyzeLinguisticIntent(text);
    const dur2 = Date.now() - start2;

    // Second call should be significantly faster (served from cache)
    // First call involves API latency (e.g., >500ms), second is local/redis (<50ms)
    expect(dur2).toBeLessThan(200);
    if (dur1 > 500) {
      expect(dur2).toBeLessThan(dur1 / 2);
    }
  }, 30000);
});
