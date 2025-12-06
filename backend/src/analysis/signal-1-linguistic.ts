import { createHash } from 'crypto';

import NodeCache from 'node-cache';

import { DeepSeekClient } from '../clients/deepseek.js';
import { OpenAIClient } from '../clients/openai.js';
import { logger } from '../utils/logger.js';
import { redis } from '../utils/redis.js';

export interface SignalResult {
  score: number;
  confidence: number;
  category: 'high_solution' | 'moderate' | 'low_solution';
  reasoning?: string;
}

const localCache = new NodeCache({ stdTTL: 7 * 24 * 60 * 60 }); // 7 days backup

export class LinguisticIntentAnalyzer {
  private deepseek: DeepSeekClient;
  private openai: OpenAIClient;

  constructor() {
    this.deepseek = new DeepSeekClient();
    this.openai = new OpenAIClient();
  }

  async analyzeLinguisticIntent(content: string): Promise<SignalResult> {
    // Check cache
    const cacheKey = this.getCacheKey(content);
    const cached = await this.getFromCache(cacheKey);
    
    if (cached) {
      logger.debug({ cacheKey }, 'SSS cache hit');
      return cached;
    }

    try {
      const prompt = this.buildPrompt(content);
      const result = await this.deepseek.generate(prompt, {
        temperature: 0.3,
        maxTokens: 200,
      });

      const parsed = this.parseResponse(result.content);
      
      // Fallback to GPT-5.1 if confidence too low
      if (result.confidence < 0.85) {
        logger.warn({ confidence: result.confidence }, 'DeepSeek confidence low, using fallback');
        return this.fallbackToGPT51(content);
      }

      const signalResult: SignalResult = {
        score: parsed.score,
        confidence: result.confidence,
        category: this.categorize(parsed.score),
        reasoning: parsed.reasoning,
      };

      // Cache result
      await this.setCache(cacheKey, signalResult);

      return signalResult;
    } catch (error) {
      logger.error({ error }, 'DeepSeek analysis failed, attempting fallback');
      return this.fallbackToGPT51(content);
    }
  }

  private async getFromCache(key: string): Promise<SignalResult | undefined> {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Redis failed or not connected, try local cache
      // Don't log full error stack for connection refused to reduce noise if intentional
      logger.warn('Redis get failed, checking local cache');
      return localCache.get<SignalResult>(key);
    }
    return undefined;
  }

  private async setCache(key: string, value: SignalResult): Promise<void> {
    try {
      await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(value)); // 7 days
    } catch {
      logger.warn('Redis set failed, using local cache');
      localCache.set(key, value);
    }
  }

  private buildPrompt(content: string): string {
    return `
Analyze this social media post and determine if the author is genuinely seeking solutions/help or just venting/joking.

POST:
"${content}"

SOLUTION-SEEKING INDICATORS (high score 0.82-1.0):
- Questions asking "what works", "how to fix", "what helps"
- Words: "desperate", "need", "please help", "advice"
- Actionable intent: looking for concrete solutions
Examples:
- "What actually works to stop a hangover headache fast?" → 0.95
- "Need help. This migraine is killing me. What do you guys use?" → 0.90

MODERATE (0.55-0.82):
- Passive complaints with some openness to help
- Mentions symptoms but doesn't explicitly ask for solutions
Examples:
- "Ugh, this hangover is brutal. Anyone else feeling it?" → 0.65
- "My head is pounding and I have a meeting in an hour" → 0.70

LOW SOLUTION-SEEKING (0.0-0.55):
- Pure venting with no questions
- Jokes, memes, sarcasm
- Storytelling, exaggeration
- No indication of wanting help
Examples:
- "Last night was lit but today I'm paying for it lol" → 0.30
- "Hangovers hit different when you're over 30 💀" → 0.25

Respond with JSON:
{
  "score": 0.0-1.0,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;
  }

  private parseResponse(content: string): { score: number; reasoning: string } {
    try {
      // Clean up markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      return {
        score: Math.max(0, Math.min(1, typeof parsed.score === 'number' ? parsed.score : 0.5)),
        reasoning: parsed.reasoning || '',
      };
    } catch (error) {
      logger.error({ content, error }, 'Failed to parse response');
      return { score: 0.5, reasoning: 'Parse error' };
    }
  }

  private categorize(score: number): 'high_solution' | 'moderate' | 'low_solution' {
    if (score >= 0.82) return 'high_solution';
    if (score >= 0.55) return 'moderate';
    return 'low_solution';
  }

  private getCacheKey(content: string): string {
    return `sss:${createHash('md5').update(content).digest('hex')}`;
  }

  private async fallbackToGPT51(content: string): Promise<SignalResult> {
    logger.info('Using GPT-5.1 fallback');
    const cacheKey = this.getCacheKey(content);

    try {
      const prompt = this.buildPrompt(content);
      const result = await this.openai.generate(prompt, {
        temperature: 0.3,
        maxTokens: 200,
      });

      const parsed = this.parseResponse(result.content);
      
      const signalResult: SignalResult = {
        score: parsed.score,
        confidence: result.confidence,
        category: this.categorize(parsed.score),
        reasoning: parsed.reasoning,
      };

      // Cache result
      await this.setCache(cacheKey, signalResult);

      return signalResult;

    } catch (error) {
      logger.error({ error }, 'GPT-5.1 fallback failed');
      // Absolute final fallback
      return {
        score: 0.5,
        confidence: 0.0,
        category: 'moderate',
        reasoning: 'All analysis methods failed',
      };
    }
  }
}

// Export singleton
export const linguisticAnalyzer = new LinguisticIntentAnalyzer();
export const analyzeLinguisticIntent = (content: string): Promise<SignalResult> =>
  linguisticAnalyzer.analyzeLinguisticIntent(content);
