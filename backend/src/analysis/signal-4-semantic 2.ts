import { createHash } from 'crypto';

import NodeCache from 'node-cache';

import { DeepSeekClient } from '../clients/deepseek.js';
import { OpenAIClient } from '../clients/openai.js';
import { logger } from '../utils/logger.js';

export interface SemanticTopicSignalResult {
  score: number; // TRS: 1.0 = actual hangover, 0.0 = metaphor
  confidence: number;
  context: 'actual_hangover' | 'metaphor' | 'ambiguous';
  reasoning?: string;
  detectedPattern?: string;
}

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;
const cache = new NodeCache({ stdTTL: CACHE_TTL_SECONDS });

const METAPHOR_PATTERNS: RegExp[] = [
  /inbox hangover/i,
  /crypto hangover/i,
  /bitcoin hangover/i,
  /ethereum hangover/i,
  /market hangover/i,
  /meeting (hangover|nausea)/i,
  /work (hangover|stress)/i,
  /exam (hangover|stress)/i,
  /election hangover/i,
  /emotional hangover/i,
  /movie (hangover|marathon)/i,
  /hangover playlist/i,
  /song hangover/i,
  /binge watching hangover/i,
  /trading hangover/i,
  /poker hangover/i,
  /crypto nausea/i,
  /startup hangover/i,
  /team hangover/i,
];

const POP_CULTURE_TITLE_PATTERN =
  /(?:The|A|An)?\s*([A-Z][a-zA-Z0-9'’&:,-]+(?:\s+[A-Z][a-zA-Z0-9'’&:,-]+)+)\s+(?:movie|film|series|show|song|album|soundtrack)/i;
const CAPITALIZED_TITLE_WITH_HANGOVER = /((?:[A-Z][a-zA-Z0-9'’&-]+)(?:\s+(?:[A-Z][a-zA-Z0-9'’&-]+))+)\s+hangover/i;

const ambiguityMetrics = {
  processed: 0,
  ambiguous: 0,
};

interface ParsedResponse {
  score?: number;
  isActualHangover?: boolean;
  confidence?: number;
  ambiguity?: number;
  reasoning?: string;
}

export class SemanticTopicAnalyzer {
  private deepseek: DeepSeekClient;
  private fallbackClient: OpenAIClient;

  constructor(deepseekClient?: DeepSeekClient, fallbackClient?: OpenAIClient) {
    this.deepseek = deepseekClient ?? new DeepSeekClient();
    this.fallbackClient = fallbackClient ?? new OpenAIClient();
  }

  async analyzeSemanticTopic(content: string): Promise<SemanticTopicSignalResult> {
    ambiguityMetrics.processed += 1;

    const normalized = content.trim();
    if (!normalized) {
      return this.buildHardScore(0, 0.75, 'metaphor', 'empty content detected');
    }

    const cacheKey = this.getCacheKey(normalized);
    const cached = cache.get<SemanticTopicSignalResult>(cacheKey);
    if (cached) {
      logger.debug({ cacheKey }, 'Signal 4 cache hit');
      return cached;
    }

    const patternResult = this.detectMetaphorPatterns(normalized);
    if (patternResult) {
      cache.set(cacheKey, patternResult);
      return patternResult;
    }

    const nerResult = this.detectNamedEntities(normalized);
    if (nerResult) {
      cache.set(cacheKey, nerResult);
      return nerResult;
    }

    try {
      const signalResult = await this.runDeepSeekAnalysis(normalized);
      cache.set(cacheKey, signalResult);
      return signalResult;
    } catch (error) {
      logger.error({ error }, 'Signal 4 deepseek failed');
      const fallback = await this.fallbackToGPT(normalized);
      cache.set(cacheKey, fallback);
      return fallback;
    }
  }

  private detectMetaphorPatterns(content: string): SemanticTopicSignalResult | null {
    for (const pattern of METAPHOR_PATTERNS) {
      if (pattern.test(content)) {
        return {
          score: 0.0,
          confidence: 0.99,
          context: 'metaphor',
          reasoning: 'Matched metaphor phrase',
          detectedPattern: pattern.source,
        };
      }
    }
    return null;
  }

  private detectNamedEntities(content: string): SemanticTopicSignalResult | null {
    const movieMatch = content.match(POP_CULTURE_TITLE_PATTERN);
    if (movieMatch) {
      return {
        score: 0.0,
        confidence: 0.92,
        context: 'metaphor',
        reasoning: 'Detected a movie/album reference',
        detectedPattern: `${movieMatch[1]} (media reference)`,
      };
    }

    const capitalizedMatch = content.match(CAPITALIZED_TITLE_WITH_HANGOVER);
    if (capitalizedMatch) {
      return {
        score: 0.0,
        confidence: 0.91,
        context: 'metaphor',
        reasoning: 'Detected capitalized title fed into hangover context',
        detectedPattern: capitalizedMatch[1],
      };
    }

    return null;
  }

  private async runDeepSeekAnalysis(content: string): Promise<SemanticTopicSignalResult> {
    const prompt = this.buildPrompt(content);
    const result = await this.deepseek.generate(prompt, {
      temperature: 0.25,
      maxTokens: 200,
    });

    const parsed = this.parseResponse(result.content);
    const confidence = parsed.confidence ?? result.confidence;

    if (confidence < 0.75) {
      logger.warn({ confidence }, 'DeepSeek confidence low, using GPT fallback');
      return this.fallbackToGPT(content);
    }

    return this.buildSignalFromParsed(parsed, confidence, content);
  }

  private async fallbackToGPT(content: string): Promise<SemanticTopicSignalResult> {
    logger.info('Using GPT-5.1 fallback for semantic topic');
    const prompt = this.buildPrompt(content);
    const result = await this.fallbackClient.generate(prompt, {
      temperature: 0.25,
      maxTokens: 200,
    });

    const parsed = this.parseResponse(result.content);
    const confidence = parsed.confidence ?? result.confidence;

    return this.buildSignalFromParsed(parsed, confidence, content);
  }

  private buildSignalFromParsed(parsed: ParsedResponse, confidence: number, content: string): SemanticTopicSignalResult {
    const baseScore = this.normalizeScore(parsed);
    const context = this.determineContext(baseScore, parsed.ambiguity);

    if (context === 'ambiguous') {
      this.logAmbiguity(content, baseScore, parsed.ambiguity);
    }

    return {
      score: baseScore,
      confidence,
      context,
      reasoning: parsed.reasoning,
    };
  }

  private normalizeScore(parsed: ParsedResponse): number {
    if (typeof parsed.score === 'number') {
      return this.clamp(parsed.score, 0, 1);
    }
    if (parsed.isActualHangover) {
      return 1.0;
    }
    if (typeof parsed.ambiguity === 'number') {
      return this.clamp(1 - parsed.ambiguity, 0, 1);
    }
    return 0.0;
  }

  private determineContext(score: number, ambiguity?: number): SemanticTopicSignalResult['context'] {
    const isAmbiguous =
      (ambiguity !== undefined && ambiguity >= 0.4 && ambiguity <= 0.6) || (score >= 0.4 && score <= 0.6);

    if (isAmbiguous) {
      return 'ambiguous';
    }

    if (score >= 0.8) {
      return 'actual_hangover';
    }

    return 'metaphor';
  }

  private logAmbiguity(content: string, score: number, ambiguity?: number): void {
    ambiguityMetrics.ambiguous += 1;
    const rate = (ambiguityMetrics.ambiguous / Math.max(1, ambiguityMetrics.processed)) * 100;

    logger.warn(
      {
        score,
        ambiguity,
        ambiguityRate: rate.toFixed(1),
        contentSnippet: content.slice(0, 100),
      },
      'Ambiguous semantic topic detected'
    );
  }

  private buildPrompt(content: string): string {
    return `
You are an expert topic classifier deciding whether the post is about an actual alcohol hangover or a metaphor/unrelated topic.

Focus on semantics, named entities, pop-culture references, and metaphor indicators.

POST:
"${content}"

ACTUAL HANGOVER (score ~1.0):
- Physical symptoms tied to drinking
- Mentions of liquor/alcohol types, night before, headache, stomach upset
- Asks for remedies, hydration, or detox
Examples:
- "Headache won't go away, drank too much last night."
- "Need advice on how to recover from tequila hangover."

METAPHOR / UNRELATED (score ~0.0):
- Contextual mentions of movies, series, songs, or books ("movie hangover", "John Wick hangover")
- Work or market stress ("inbox hangover", "crypto hangover", "meeting nausea")
- Emotional or election burnout, not tied to alcohol
- References to creative works with capitalized titles
Examples:
- "John Wick movie hangover lasting for days."
- "My inbox hangover after vacation is unreal."
- "Crypto hangover hitting after the crash."

SPECIFY THE OUTPUT AS JSON:
{
  "score": 0.0-1.0,
  "isActualHangover": true|false,
  "confidence": 0.0-1.0,
  "ambiguity": 0.0-1.0,
  "reasoning": "Why you believe this score"
}
`;
  }

  private parseResponse(content: string): ParsedResponse {
    const cleaned = content.replace(/```json|```/g, '').trim();
    try {
      const parsedJson = JSON.parse(cleaned);
      return {
        score: typeof parsedJson.score === 'number' ? parsedJson.score : undefined,
        isActualHangover: parsedJson.isActualHangover,
        confidence: parsedJson.confidence,
        ambiguity: parsedJson.ambiguity,
        reasoning: parsedJson.reasoning,
      };
    } catch (error) {
      logger.error({ content, error }, 'Failed to parse semantic classification response');
      return {
        score: 0.5,
        ambiguity: 0.5,
        reasoning: 'Parse failure, defaulting to ambiguity',
      };
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private buildHardScore(
    score: number,
    confidence: number,
    context: SemanticTopicSignalResult['context'],
    reasoning: string
  ): SemanticTopicSignalResult {
    return {
      score,
      confidence,
      context,
      reasoning,
    };
  }

  private getCacheKey(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }
}

export const semanticTopicAnalyzer = new SemanticTopicAnalyzer();
export const analyzeSemanticTopic = (content: string) =>
  semanticTopicAnalyzer.analyzeSemanticTopic(content);
