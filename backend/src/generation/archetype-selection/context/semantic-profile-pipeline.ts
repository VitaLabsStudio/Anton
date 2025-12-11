/**
 * Semantic Profile Pipeline - Hybrid LLM + ML classifiers for content analysis
 * Story 2.10: Task 1, Subtask 2
 *
 * Responsibilities:
 * - Analyze post content for emotional tone, urgency, misinformation risk
 * - Use hybrid approach: LLM for semantic understanding + ML for classification
 * - Cache results per post (30-minute TTL)
 * - Redact PII before LLM calls
 * - Return SemanticProfile with confidence metadata
 */

import crypto from 'crypto';

import { logger } from '@/utils/logger';
import { openai } from '@/utils/openai';
import { redis } from '@/utils/redis';

import type { SemanticProfile } from '../types';
import { DEFAULT_SEMANTIC_PROFILE } from '../types';
import { PIIRedactor } from './pii-redaction';

interface SemanticPipelineConfig {
  enableLLM: boolean;
  enableMLClassifiers: boolean;
  cacheTTL: number; // seconds
  enablePIIRedaction: boolean;
  llmProvider: 'deepseek' | 'openai';
}

const DEFAULT_CONFIG: SemanticPipelineConfig = {
  enableLLM: true,
  enableMLClassifiers: true,
  cacheTTL: 1800, // 30 minutes
  enablePIIRedaction: true,
  llmProvider: 'deepseek',
};

interface PostContent {
  postId: string;
  content: string;
  authorHandle?: string;
  platform: 'twitter' | 'reddit' | 'threads';
}

/**
 * Semantic analysis pipeline using hybrid LLM + ML approach
 */
export class SemanticProfilePipeline {
  private config: SemanticPipelineConfig;
  private cacheKeyPrefix = 'semantic-profile';
  private piiRedactor: PIIRedactor;

  constructor(config: Partial<SemanticPipelineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.piiRedactor = new PIIRedactor({
      enableAggressiveMode: false,
      hashOriginals: true,
      logRedactions: true,
    });
    logger.info({ config: this.config }, 'SemanticProfilePipeline initialized');
  }

  /**
   * Run semantic analysis pipeline on post content
   *
   * @param post - Post content to analyze
   * @returns SemanticProfile with emotion, urgency, misinformation probability, etc.
   */
  public async run(post: PostContent): Promise<SemanticProfile> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Check cache first
      const cached = await this.getCachedProfile(post.postId);
      if (cached) {
        logger.debug({ postId: post.postId, requestId }, 'Semantic profile cache hit');
        return { ...cached, cacheHit: true };
      }

      logger.debug({ postId: post.postId, requestId }, 'Semantic profile cache miss, analyzing');

      // Redact PII if enabled
      let sanitizedContent = post.content;
      let piiRedactionStatus = false;
      let redactionCount = 0;
      let redactionTypes: Record<string, number> = {};

      if (this.config.enablePIIRedaction) {
        const redactionResult = this.piiRedactor.redact(post.content, requestId);
        sanitizedContent = redactionResult.redactedContent;
        piiRedactionStatus = redactionResult.redactionCount > 0;
        redactionCount = redactionResult.redactionCount;
        redactionTypes = redactionResult.redactionTypes;

        if (piiRedactionStatus) {
          logger.info(
            {
              requestId,
              postId: post.postId,
              redactionCount,
              redactionTypes,
            },
            'PII redacted before LLM processing'
          );
        }
      }

      // Run hybrid analysis
      const llmAnalysis = this.config.enableLLM
        ? await this.runLLMAnalysis(sanitizedContent, post.platform, requestId)
        : null;

      const mlClassification = this.config.enableMLClassifiers
        ? await this.runMLClassifiers(post.content)
        : null;

      // Merge results
      const profile = this.mergeAnalysisResults(llmAnalysis, mlClassification);

      // Cache the result
      await this.cacheProfile(post.postId, profile);

      const duration = Date.now() - startTime;
      logger.info(
        {
          requestId,
          postId: post.postId,
          confidence: profile.confidence,
          urgency: profile.urgency,
          misinformationProbability: profile.misinformationProbability,
          piiRedacted: piiRedactionStatus,
          redactionCount,
          duration,
        },
        'Semantic analysis complete'
      );

      return { ...profile, cacheHit: false };
    } catch (error) {
      logger.error({ error, postId: post.postId, requestId }, 'Semantic analysis failed');
      return { ...DEFAULT_SEMANTIC_PROFILE, cacheHit: false };
    }
  }

  /**
   * Get cached semantic profile
   */
  private async getCachedProfile(postId: string): Promise<SemanticProfile | null> {
    try {
      const cacheKey = `${this.cacheKeyPrefix}:${postId}`;
      const cached = await redis.get(cacheKey);

      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached) as SemanticProfile;
      // Convert timestamp string back to Date
      parsed.timestamp = new Date(parsed.timestamp);
      return parsed;
    } catch (error) {
      logger.warn({ error, postId }, 'Cache retrieval failed');
      return null;
    }
  }

  /**
   * Cache semantic profile with TTL
   */
  private async cacheProfile(postId: string, profile: SemanticProfile): Promise<void> {
    try {
      const cacheKey = `${this.cacheKeyPrefix}:${postId}`;
      await redis.setex(cacheKey, this.config.cacheTTL, JSON.stringify(profile));
      logger.debug({ postId, ttl: this.config.cacheTTL }, 'Semantic profile cached');
    } catch (error) {
      logger.warn({ error, postId }, 'Cache storage failed');
    }
  }

  /**
   * Generate a unique request ID for audit trail
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Generate content hash for audit logging (without exposing raw content)
   */
  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Run LLM-based semantic analysis with audit logging
   */
  private async runLLMAnalysis(
    content: string,
    platform: string,
    requestId: string
  ): Promise<Partial<SemanticProfile> | null> {
    const contentHash = this.hashContent(content);

    // Audit log for LLM API call
    logger.info(
      {
        requestId,
        timestamp: new Date().toISOString(),
        contentHash,
        piiRedactionStatus: this.config.enablePIIRedaction,
        llmProvider: this.config.llmProvider,
        platform,
        contentLength: content.length,
      },
      'LLM API call initiated'
    );

    try {
      const prompt = `Analyze this social media post and provide structured emotional analysis.

Post content:
"""
${content}
"""

Respond with JSON only:
{
  "emotions": {
    "joy": <0-1>,
    "sadness": <0-1>,
    "anger": <0-1>,
    "fear": <0-1>,
    "surprise": <0-1>,
    "disgust": <0-1>,
    "neutral": <0-1>
  },
  "urgency": <0-1>,
  "misinformationProbability": <0-1>,
  "humorDetected": <boolean>,
  "stance": "positive" | "negative" | "neutral" | "questioning",
  "rationale": "<brief explanation>"
}`;

      const response = await openai.chat.completions.create({
        model: this.config.llmProvider === 'openai' ? 'gpt-4o-mini' : 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an expert at emotional and content analysis.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      return {
        emotionVector: result.emotions,
        urgency: result.urgency,
        misinformationProbability: result.misinformationProbability,
        humorDetected: result.humorDetected,
        stance: result.stance,
        rationale: result.rationale,
      };
    } catch (error) {
      logger.error({ error, requestId, contentHash }, 'LLM analysis failed');
      return null;
    }
  }

  /**
   * Run ML classifiers for content analysis
   */
  private async runMLClassifiers(content: string): Promise<Partial<SemanticProfile> | null> {
    try {
      // Keyword-based emotion detection (replace with real ML later)
      const emotionVector = this.detectEmotions(content);
      const urgency = this.detectUrgency(content);
      const misinformationProbability = this.detectMisinformationRisk(content);
      const toxicity = this.detectToxicity(content);

      return {
        emotionVector,
        urgency,
        misinformationProbability,
        humorDetected: this.detectHumor(content),
        stance: this.detectStance(content),
        toxicity,
      };
    } catch (error) {
      logger.error({ error }, 'ML classification failed');
      return null;
    }
  }

  // TODO (Story 4.x): Replace keyword-based classifiers with trained ML models
  // Current implementation uses simple keyword matching as interim solution

  private detectEmotions(content: string): import('../types').EmotionVector {
    const lower = content.toLowerCase();

    // Simple keyword matching (replace with ML model)
    const joyWords = ['happy', 'great', 'excellent', 'wonderful', 'amazing', 'love'];
    const sadWords = ['sad', 'depressed', 'unhappy', 'disappointed', 'terrible'];
    const angerWords = ['angry', 'furious', 'outraged', 'hate', 'disgusted'];
    const fearWords = ['afraid', 'scared', 'worried', 'anxious', 'terrified'];

    const joyCount = joyWords.filter(w => lower.includes(w)).length;
    const sadCount = sadWords.filter(w => lower.includes(w)).length;
    const angerCount = angerWords.filter(w => lower.includes(w)).length;
    const fearCount = fearWords.filter(w => lower.includes(w)).length;

    const total = joyCount + sadCount + angerCount + fearCount || 1;

    return {
      joy: joyCount / total,
      sadness: sadCount / total,
      anger: angerCount / total,
      fear: fearCount / total,
      surprise: 0.0,
      disgust: 0.0,
      neutral: total === 1 && joyCount === 0 ? 1.0 : 0.0,
    };
  }

  private detectUrgency(content: string): number {
    const lower = content.toLowerCase();
    const urgentWords = ['urgent', 'emergency', 'asap', 'immediately', 'critical', 'help', '!!!'];
    const count = urgentWords.filter(w => lower.includes(w)).length;
    return Math.min(1.0, count * 0.25);
  }

  private detectMisinformationRisk(content: string): number {
    const lower = content.toLowerCase();
    const riskPhrases = [
      'they don\'t want you to know',
      'the truth is',
      'wake up',
      'do your own research',
      'mainstream media won\'t tell you',
    ];
    const count = riskPhrases.filter(p => lower.includes(p)).length;
    return Math.min(1.0, count * 0.3);
  }

  private detectToxicity(content: string): number {
    const lower = content.toLowerCase();
    const toxicWords = ['stupid', 'idiot', 'moron', 'hate', 'kill', 'die'];
    const count = toxicWords.filter(w => lower.includes(w)).length;
    return Math.min(1.0, count * 0.2);
  }

  private detectHumor(content: string): boolean {
    const lower = content.toLowerCase();
    return lower.includes('lol') || lower.includes('haha') || lower.includes('😂') || lower.includes('🤣');
  }

  private detectStance(content: string): 'positive' | 'negative' | 'neutral' | 'questioning' {
    const lower = content.toLowerCase();
    if (lower.includes('?')) return 'questioning';

    const positiveWords = ['yes', 'agree', 'support', 'great', 'good'];
    const negativeWords = ['no', 'disagree', 'against', 'bad', 'wrong'];

    const posCount = positiveWords.filter(w => lower.includes(w)).length;
    const negCount = negativeWords.filter(w => lower.includes(w)).length;

    if (posCount > negCount) return 'positive';
    if (negCount > posCount) return 'negative';
    return 'neutral';
  }

  /**
   * Merge LLM and ML analysis results
   */
  private mergeAnalysisResults(
    llmAnalysis: Partial<SemanticProfile> | null,
    mlClassification: Partial<SemanticProfile> | null
  ): SemanticProfile {
    // If we have both, prefer LLM for semantic understanding but use ML for classification
    // If only one available, use that
    // If neither, use defaults

    if (!llmAnalysis && !mlClassification) {
      return DEFAULT_SEMANTIC_PROFILE;
    }

    if (llmAnalysis && !mlClassification) {
      return {
        ...DEFAULT_SEMANTIC_PROFILE,
        ...llmAnalysis,
        confidence: 0.7, // LLM-only confidence
        rationale: llmAnalysis.rationale || 'LLM analysis only',
        timestamp: new Date(),
      };
    }

    if (!llmAnalysis && mlClassification) {
      return {
        ...DEFAULT_SEMANTIC_PROFILE,
        ...mlClassification,
        confidence: 0.5, // ML-only confidence (lower than LLM)
        rationale: 'ML classification only',
        timestamp: new Date(),
      };
    }

    // Both available: merge with LLM priority for semantic fields
    return {
      emotionVector: llmAnalysis?.emotionVector || mlClassification!.emotionVector!,
      urgency: llmAnalysis?.urgency ?? mlClassification!.urgency ?? 0.3,
      misinformationProbability:
        llmAnalysis?.misinformationProbability ??
        mlClassification!.misinformationProbability ??
        0.0,
      humorDetected: llmAnalysis?.humorDetected ?? mlClassification!.humorDetected ?? false,
      stance: llmAnalysis?.stance || mlClassification!.stance || 'neutral',
      rationale: llmAnalysis?.rationale || 'Hybrid LLM + ML analysis',
      confidence: 0.85, // Highest confidence with both sources
      toxicity: mlClassification?.toxicity,
      cacheHit: false,
      timestamp: new Date(),
    };
  }

  /**
   * Clear cache for a specific post
   */
  public async clearCache(postId: string): Promise<void> {
    try {
      const cacheKey = `${this.cacheKeyPrefix}:${postId}`;
      await redis.del(cacheKey);
      logger.debug({ postId }, 'Semantic profile cache cleared');
    } catch (error) {
      logger.warn({ error, postId }, 'Cache clear failed');
    }
  }

  /**
   * Get cache statistics
   */
  public async getCacheStats(): Promise<{
    totalKeys: number;
    hitRate: number;
  }> {
    try {
      // TODO: Implement cache statistics tracking
      return {
        totalKeys: 0,
        hitRate: 0,
      };
    } catch (error) {
      logger.warn({ error }, 'Cache stats retrieval failed');
      return {
        totalKeys: 0,
        hitRate: 0,
      };
    }
  }
}
