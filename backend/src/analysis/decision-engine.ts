import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Author, Post, Platform, UserTier } from '@prisma/client';
import NodeCache from 'node-cache';
import CircuitBreaker from 'opossum';
import YAML from 'yaml';
import { z } from 'zod';

import type { MetricsAdapter } from '../observability/metrics-adapter.js';
import { metricsCollector } from '../observability/metrics-registry.js';
import { logger } from '../utils/logger.js';
import { prisma as prismaClient } from '../utils/prisma.js';
import { redis } from '../utils/redis.js';
import { temporalMultiplier } from '../workers/temporal-multiplier.js';

import {
  detectCompetitor,
  saveCompetitiveMention,
  type CompetitorSignal,
} from './competitive-detector.js';
import {
  detectUserTier,
  archetypesForTier,
  type TierDetectionResult,
  TIER_RESPONSE_TARGETS,
} from './tiered-user-detector.js';
import { checkSafetyProtocol, SafetySeverity, type SafetySignal } from './safety-protocol.js';
import { analyzeLinguisticIntent, type SignalResult as SssSignal } from './signal-1-linguistic.js';
import { analyzeAuthorContext, type SignalResult as ArsSignal } from './signal-2-author.js';
import {
  analyzePostVelocity,
  type VelocitySignalResult as EvsSignal,
} from './signal-3-velocity.js';
import {
  analyzeSemanticTopic,
  type SemanticTopicSignalResult as TrsSignal,
} from './signal-4-semantic.js';
import { getTemporalContext } from './temporal-migration.js';
import { type TemporalSignal } from './temporal-intelligence.js';
import { TemporalFeatureExtractor } from './temporal-feature-extractor.js';

export type OperationalMode = 'HELPFUL' | 'ENGAGEMENT' | 'HYBRID' | 'DISENGAGED';

export interface DecisionContext {
  platform: Platform;
  timeOfDay: string;
}

export interface DecisionResult {
  postId: string;
  sssScore: number;
  arsScore: number;
  evsScore: number;
  trsScore: number;
  compositeScore: number;
  mode: OperationalMode;
  archetype: string | null;
  archetypeId?: string | null;
  compositeCredibleInterval: [number, number];
  modeConfidence: number;
  modeProbabilities: Record<OperationalMode, number>;
  needsReview: boolean;
  reviewReason?: 'LOW_CONFIDENCE' | 'NEAR_THRESHOLD' | 'CONFLICTING_SIGNALS';
  safetyFlags: string[];
  signalsJson: Record<string, unknown>;
  temporalContext: unknown;
  competitorDetected: string | null;
  isPowerUser: boolean;
  userTier: UserTier;
  responseTargetMinutes: number;
  caringResponse: boolean;
  tierReasons: string[];
  suggestedArchetypes: string[];
  engagementRate: number;
  segmentUsed: string;
  decisionLogicVersion: string;
}

export interface SignalWeights {
  sssWeight: number;
  arsWeight: number;
  evsWeight: number;
  trsWeight: number;
  sssArsInteraction?: number;
  evsTrsInteraction?: number;
  segmentType: string;
  segmentKey: string;
  sampleSize: number;
  isValidated: boolean;
  validationTimestamp: Date;
}

interface DecisionLatencyBucket {
  le: number;
  count: number;
}

interface DecisionLatencyMetrics {
  count: number;
  sum: number;
  p95: number | null;
  max: number | null;
  buckets: DecisionLatencyBucket[];
}

export interface DecisionThresholds {
  sssHelpful: number;
  sssModerate: number;
  evsHighViral: number;
  evsModerateViral: number;
  arsStrong: number;
  minSampleSize: number;
  confidenceThreshold: number;
  trsGate: number;
  nearThresholdTolerance: number;
  reviewConfidenceDelta: number;
}

type Fallback<T> = T | (() => T);

interface SegmentWeightRecord {
  sssWeight: number;
  arsWeight: number;
  evsWeight: number;
  trsWeight: number;
  sssArsInteraction?: number;
  evsTrsInteraction?: number;
  segmentType: string;
  segmentKey: string;
  sampleSize: number;
  validationTimestamp?: Date;
}

interface PrismaSegmentClient {
  findUnique?: (args: unknown) => Promise<SegmentWeightRecord | null>;
}

interface PrismaDecisionClient {
  create?: (args: unknown) => Promise<unknown>;
}

interface PrismaPostClient {
  update?: (args: unknown) => Promise<unknown>;
}

interface PrismaArchetypeClient {
  findUnique?: (args: unknown) => Promise<{ id: string; name: string } | null>;
}

interface PrismaCompetitorClient {
  findMany?: (args?: unknown) => Promise<Array<{ name: string; brandKeywords: string[] }>>;
}

interface PrismaLike {
  segmentedWeight?: PrismaSegmentClient;
  decision?: PrismaDecisionClient;
  post?: PrismaPostClient;
  archetype?: PrismaArchetypeClient;
  competitor?: PrismaCompetitorClient;
  $transaction?: <T>(callback: (tx: PrismaLike) => Promise<T>) => Promise<T>;
}

export interface DecisionEngineOptions {
  thresholdsPath?: string;
  thresholds?: DecisionThresholds;
  defaultWeights?: Partial<SignalWeights>;
  metrics?: MetricsAdapter;
  prismaClient?: PrismaLike;
  cacheTTLSeconds?: number;
  cacheCheckPeriodSeconds?: number;
}

const DECISION_LOGIC_VERSION = 'v2.1';
const CACHE_KEY_PREFIX = 'decision_weights';
const DEFAULT_CONFIDENCE = 0.5;
const DEFAULT_VARIANCE = 0.05;
const DEFAULT_DECISION_TIMEOUT_MS = 5000;
const DEFAULT_DECISION_RESET_MS = 30_000;
const LATENCY_SAMPLE_SIZE = 1024;
const LATENCY_BUCKETS = [50, 100, 200, 500, 1000, 2000, 4000];

export const DEFAULT_THRESHOLDS: DecisionThresholds = {
  sssHelpful: 0.82,
  sssModerate: 0.55,
  evsHighViral: 5.0,
  evsModerateViral: 2.0,
  arsStrong: 0.7,
  minSampleSize: 100,
  confidenceThreshold: 0.7,
  trsGate: 0.5,
  nearThresholdTolerance: 0.05,
  reviewConfidenceDelta: 0.15,
};

export const DEFAULT_WEIGHTS: SignalWeights = {
  sssWeight: 0.25,
  arsWeight: 0.25,
  evsWeight: 0.25,
  trsWeight: 0.25,
  sssArsInteraction: 0.05,
  evsTrsInteraction: 0.03,
  segmentType: 'GLOBAL',
  segmentKey: 'GLOBAL',
  sampleSize: 200,
  isValidated: true,
  validationTimestamp: new Date(0),
};

interface SignalBundle {
  sss: SssSignal;
  ars: ArsSignal;
  evs: EvsSignal;
  trs: TrsSignal;
  safety: SafetySignal;
  powerUser: TierDetectionResult;
  competitor: CompetitorSignal;
  temporal: TemporalSignal;
}

const FALLBACK_SIGNALS = {
  sss: { score: 0.5, confidence: 0.5, category: 'moderate' } as SssSignal,
  ars: { score: 0.5, confidence: 0.5, archetypes: [], interactionCount: 0 } as ArsSignal,
  evs: {
    ratio: 1.0,
    category: 'normal' as const,
    confidence: 0.5,
    baselineRate: 1,
    currentRate: 1,
    temporalContext: {
      hoursSincePost: 1,
      timeOfDayFactor: 1,
      dayOfWeekFactor: 1,
    },
  } as EvsSignal,
  trs: { score: 0.5, confidence: 0.5, context: 'ambiguous' } as TrsSignal,
  safety: {
    shouldDisengage: true,
    flags: ['SAFETY_FALLBACK'],
    severity: SafetySeverity.CRITICAL,
    distressProbability: 1,
    contextCheckPerformed: false,
  } as SafetySignal,
  powerUser: {
    isPowerUser: false,
    userTier: 'NEW_UNKNOWN',
    engagementRate: 0,
    reasons: [],
    responseTargetMinutes: TIER_RESPONSE_TARGETS['NEW_UNKNOWN'],
    suggestedArchetypes: archetypesForTier('NEW_UNKNOWN'),
    caringResponse: true,
    followUpPlan: [],
    metadata: { bioKeywords: [], verified: false, lowConfidence: false },
    confidence: 0.5,
  } as TierDetectionResult,
  competitor: {
    detected: false,
    name: null,
    category: null,
    sentiment: 'NEUTRAL',
    satisfaction: 'SATISFIED',
    opportunityScore: 0,
    confidence: 0,
  } as CompetitorSignal,
};

function normalizeTimeOfDay(date: Date): string {
  const hour = date.getUTCHours();
  if (hour >= 5 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 21) return 'EVENING';
  return 'NIGHT';
}

function bucketConfidence(value: number): string {
  const bucket = Math.min(1, Math.max(0, Math.floor(value * 10) / 10));
  return `bucket_${bucket.toFixed(1)}`;
}

const ThresholdFieldSchema = z.object({
  sssHelpful: z.number().finite().min(0).max(1),
  sssModerate: z.number().finite().min(0).max(1),
  evsHighViral: z.number().finite().min(0),
  evsModerateViral: z.number().finite().min(0),
  arsStrong: z.number().finite().min(0).max(1),
  minSampleSize: z.number().finite().min(1),
  confidenceThreshold: z.number().finite().min(0).max(1),
  trsGate: z.number().finite().min(0).max(1),
  nearThresholdTolerance: z.number().finite().min(0),
  reviewConfidenceDelta: z.number().finite().min(0),
});

const ThresholdOverridesSchema = ThresholdFieldSchema.partial().strict();
const ThresholdSchema = ThresholdFieldSchema.strict();
const ThresholdFileSchema = z.object({ thresholds: ThresholdOverridesSchema }).strict();

class LatencyHistogram {
  private readonly maxSize: number;
  private readonly buffer: number[] = [];
  private readonly bucketThresholds: number[];
  private readonly bucketCounts: number[];
  private totalCount = 0;
  private totalDuration = 0;

  constructor(maxSize = LATENCY_SAMPLE_SIZE, buckets: number[] = LATENCY_BUCKETS) {
    this.maxSize = maxSize;
    this.bucketThresholds = [...buckets].sort((a, b) => a - b);
    this.bucketCounts = this.bucketThresholds.map(() => 0);
  }

  record(value: number): void {
    this.totalCount += 1;
    this.totalDuration += value;
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();
    }
    this.buffer.push(value);

    for (let idx = 0; idx < this.bucketThresholds.length; idx += 1) {
      if (value <= (this.bucketThresholds[idx] ?? Number.POSITIVE_INFINITY)) {
        this.bucketCounts[idx] = (this.bucketCounts[idx] ?? 0) + 1;
      }
    }
  }

  getStats(): { count: number; p95: number | null; max: number | null } {
    if (this.buffer.length === 0) {
      return { count: this.totalCount, p95: null, max: null };
    }
    const sorted = [...this.buffer].sort((a, b) => a - b);
    const idx = Math.floor(0.95 * (sorted.length - 1));
    return {
      count: this.totalCount,
      p95: sorted[Math.min(idx, sorted.length - 1)] ?? null,
      max: sorted[sorted.length - 1] ?? null,
    };
  }

  getBuckets(): Array<{ le: number; count: number }> {
    return this.bucketThresholds.map((threshold, idx) => ({
      le: threshold,
      count: this.bucketCounts[idx] ?? 0,
    }));
  }

  getSum(): number {
    return this.totalDuration;
  }

  getTotalCount(): number {
    return this.totalCount;
  }
}

export class DecisionEngine {
  private readonly weightCache: NodeCache;
  private readonly thresholds: DecisionThresholds;
  private readonly defaultWeights: SignalWeights;
  private readonly metrics: MetricsAdapter;
  private readonly prisma: PrismaLike;
  private readonly breakerOptions = {
    timeout: DEFAULT_DECISION_TIMEOUT_MS,
    errorThresholdPercentage: 50,
    resetTimeout: DEFAULT_DECISION_RESET_MS,
  };
  private readonly breakers = new Map<string, CircuitBreaker<[]>>();
  private readonly archetypeCache = new Map<string, string | null>();
  private readonly latencyHistogram = new LatencyHistogram();
  private readonly temporalFeatureExtractor = new TemporalFeatureExtractor();

  constructor(options?: DecisionEngineOptions) {
    this.thresholds =
      options?.thresholds ??
      this.loadThresholds(options?.thresholdsPath ?? this.resolveConfigPath());

    this.defaultWeights = this.buildDefaultWeights(options?.defaultWeights);
    this.metrics = options?.metrics ?? metricsCollector;
    this.prisma = options?.prismaClient ?? (prismaClient as PrismaLike);

    this.weightCache = new NodeCache({
      stdTTL: options?.cacheTTLSeconds ?? 600,
      checkperiod: options?.cacheCheckPeriodSeconds ?? 60,
      useClones: false,
    });
  }

  private resolveConfigPath(): string {
    const currentFile = fileURLToPath(import.meta.url);
    return path.resolve(path.dirname(currentFile), '../../../config/decision-thresholds.yaml');
  }

  private loadThresholds(configPath: string): DecisionThresholds {
    const base = this.loadThresholdFile(configPath, true);
    const envPath = this.getEnvOverridePath(configPath);
    const env = envPath ? this.loadThresholdFile(envPath, false) : {};
    const merged = this.mergeThresholds(base, env);
    return this.validateThresholds(merged);
  }

  private getEnvOverridePath(basePath: string): string | null {
    const env = process.env['NODE_ENV'];
    if (!env) return null;
    const envPath = basePath.replace(/\.ya?ml$/, `.${env}.yaml`);
    return fs.existsSync(envPath) ? envPath : null;
  }

  private loadThresholdFile(filePath: string, required = false): Partial<DecisionThresholds> {
    if (!fs.existsSync(filePath)) {
      if (required) {
        logger.error({ filePath }, 'DecisionEngine thresholds file missing');
        throw new Error(`Decision thresholds file not found: ${filePath}`);
      }
      logger.debug({ filePath }, 'DecisionEngine thresholds override missing');
      return {};
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    return this.parseThresholds(raw, filePath);
  }

  private parseThresholds(raw: string, filePath: string): Partial<DecisionThresholds> {
    try {
      const parsed = YAML.parse(raw);
      const validated = ThresholdFileSchema.parse(parsed ?? {});
      return validated.thresholds ?? {};
    } catch (error) {
      logger.error({ error, filePath }, 'DecisionEngine thresholds failed validation');
      throw new Error(
        `Decision thresholds at ${filePath} are invalid: ${(error as Error)?.message ?? 'unknown error'}`
      );
    }
  }

  private mergeThresholds(
    base: Partial<DecisionThresholds>,
    override: Partial<DecisionThresholds>
  ): Partial<DecisionThresholds> {
    return { ...base, ...override };
  }

  private validateThresholds(thresholds: Partial<DecisionThresholds>): DecisionThresholds {
    const candidate: Partial<DecisionThresholds> = { ...DEFAULT_THRESHOLDS, ...thresholds };
    try {
      return ThresholdSchema.parse(candidate);
    } catch (error) {
      logger.error({ error }, 'Merged decision thresholds failed validation');
      throw error;
    }
  }

  private buildDefaultWeights(overrides?: Partial<SignalWeights>): SignalWeights {
    const base = { ...DEFAULT_WEIGHTS, ...overrides };
    const sampleSize = Math.max(base.sampleSize, this.thresholds.minSampleSize);
    return {
      ...base,
      sampleSize,
      segmentType: base.segmentType || DEFAULT_WEIGHTS.segmentType,
      segmentKey: base.segmentKey || DEFAULT_WEIGHTS.segmentKey,
      validationTimestamp: base.validationTimestamp ?? new Date(),
      isValidated: base.isValidated ?? true,
    };
  }

  /**
   * Execute the full decision flow for a post: fetch signals with circuit breakers, blend weights,
   * score with interactions and uncertainty, select a mode, and persist the outcome.
   */
  async analyzePost(post: Post, author: Author): Promise<DecisionResult> {
    const start = process.hrtime.bigint();
    const signals = await this.fetchSignals(post, author);

    if (signals.competitor.detected && signals.competitor.name) {
      // Always log the mention
      await saveCompetitiveMention(post.id, signals.competitor);

      // Check rate limits
      const allowed = await this.checkCompetitiveRateLimit(
        signals.competitor.name,
        signals.competitor.opportunityScore
      );

      if (!allowed) {
        logger.info(
          { competitor: signals.competitor.name },
          'Competitive rate limit exceeded, suppressing signal'
        );
        signals.competitor.detected = false;
      }
    }

    const context = this.buildDecisionContext(post);
    const weights = await this.getWeights(context);

    const temporalAdjustment = signals.temporal.context.sssThresholdAdjustment ?? 0;
    const adjustedThresholds: DecisionThresholds = {
      ...this.thresholds,
      sssHelpful: Math.min(1, Math.max(0, this.thresholds.sssHelpful + temporalAdjustment)),
      sssModerate: Math.min(1, Math.max(0, this.thresholds.sssModerate + temporalAdjustment)),
    };
    signals.temporal.context.mlFeatures = this.temporalFeatureExtractor.extract(
      signals.temporal.context,
      signals.temporal.timestamp
    );

    const compositeScore = this.calculateComposite(
      signals.sss,
      signals.ars,
      signals.evs,
      signals.trs,
      weights
    );

    const { credibleInterval } = this.calculateUncertainty(
      signals.sss,
      signals.ars,
      signals.evs,
      signals.trs,
      weights,
      compositeScore
    );

    const { mode, probabilities } = this.selectMode(signals, adjustedThresholds);
    const modeConfidence = probabilities[mode] ?? 0;
    const reviewInfo = this.computeReviewInfo(signals, compositeScore, modeConfidence, mode);
    const archetype = this.pickArchetype(signals);
    const archetypeId = await this.resolveArchetypeId(archetype);

    const segmentUsed = `${weights.segmentType}_${weights.segmentKey}`;

    const decision: DecisionResult = {
      postId: post.id,
      sssScore: signals.sss.score,
      arsScore: signals.ars.score,
      evsScore: signals.evs.ratio,
      trsScore: signals.trs.score,
      compositeScore,
      mode,
      archetype,
      archetypeId,
      compositeCredibleInterval: credibleInterval,
      modeConfidence,
      modeProbabilities: probabilities,
      needsReview: reviewInfo.needsReview,
      reviewReason: reviewInfo.reviewReason,
      safetyFlags: signals.safety.flags ?? [],
      signalsJson: {
        sss: signals.sss,
        ars: signals.ars,
        evs: signals.evs,
        trs: signals.trs,
        safety: signals.safety,
        powerUser: signals.powerUser,
        competitor: signals.competitor,
        temporal: signals.temporal,
      },
      temporalContext: signals.temporal.context,
      competitorDetected: signals.competitor.detected ? signals.competitor.name : null,
      isPowerUser: Boolean(signals.powerUser.isPowerUser),
      userTier: signals.powerUser.userTier ?? 'NEW_UNKNOWN',
      responseTargetMinutes:
        signals.powerUser.responseTargetMinutes ?? TIER_RESPONSE_TARGETS['NEW_UNKNOWN'],
      caringResponse: signals.powerUser.caringResponse ?? false,
      tierReasons: signals.powerUser.reasons ?? [],
      suggestedArchetypes: signals.powerUser.suggestedArchetypes ?? [],
      engagementRate: signals.powerUser.engagementRate ?? 0,
      segmentUsed,
      decisionLogicVersion: DECISION_LOGIC_VERSION,
    };

    await this.saveDecision(decision);
    this.recordLatency(start);
    return decision;
  }

  private async fetchSignals(post: Post, author: Author): Promise<SignalBundle> {
    const [sss, ars, evs, trs, safety, powerUser, competitor, temporal] = await Promise.all([
      this.fetchSignalWithBreaker(
        'SSS',
        () => analyzeLinguisticIntent(post.content),
        FALLBACK_SIGNALS.sss
      ),
      this.fetchSignalWithBreaker(
        'ARS',
        () => analyzeAuthorContext(post.platform, author.platformId, author.handle),
        FALLBACK_SIGNALS.ars
      ),
      this.fetchSignalWithBreaker(
        'EVS',
        () => analyzePostVelocity(post, author),
        FALLBACK_SIGNALS.evs
      ),
      this.fetchSignalWithBreaker(
        'TRS',
        () => analyzeSemanticTopic(post.content),
        FALLBACK_SIGNALS.trs
      ),
      this.fetchSignalWithBreaker(
        'Safety',
        () => checkSafetyProtocol(post.content, author, post.id),
        FALLBACK_SIGNALS.safety
      ),
      this.fetchSignalWithBreaker(
        'UserTier',
        () => detectUserTier(author),
        FALLBACK_SIGNALS.powerUser
      ),
      this.fetchSignalWithBreaker(
        'Competitor',
        () => detectCompetitor(post.content),
        FALLBACK_SIGNALS.competitor
      ),
      this.fetchSignalWithBreaker(
        'Temporal',
        async () => {
          const timestamp = post.detectedAt ?? new Date();
          const context = getTemporalContext(timestamp);
          return { context, timestamp };
        },
        () => this.buildTemporalFallback()
      ),
    ]);

    return { sss, ars, evs, trs, safety, powerUser, competitor, temporal };
  }

  private buildDecisionContext(post: Post): DecisionContext {
    const detectedAt = post.detectedAt ?? new Date();
    return {
      platform: post.platform,
      timeOfDay: normalizeTimeOfDay(detectedAt),
    };
  }

  private buildTemporalFallback(): TemporalSignal {
    const now = new Date();
    return { context: temporalMultiplier.getContext(now), timestamp: now };
  }

  /**
   * Fetches validated signal weights for the given decision context, using the in-memory cache when available.
   */
  async getWeights(context: DecisionContext): Promise<SignalWeights> {
    const key = this.cacheKey(context);
    const cached = this.weightCache.get<SignalWeights>(key);

    if (cached && cached.isValidated) {
      this.metrics.increment('weight_cache_hit', { key });
      return cached;
    }

    this.metrics.increment('weight_cache_miss', { key });
    const weights = await this.fetchAndValidateWeights(context);
    this.weightCache.set(key, weights);
    return weights;
  }

  private cacheKey(context: DecisionContext): string {
    return `${CACHE_KEY_PREFIX}:${context.platform}_${context.timeOfDay}`;
  }

  private async fetchAndValidateWeights(context: DecisionContext): Promise<SignalWeights> {
    try {
      const combined = await this.fetchSegmentWeights(
        'COMBINED',
        `${context.platform}_${context.timeOfDay}`
      );
      if (combined) {
        const validated = this.applyBayesianShrinkage(combined, this.defaultWeights);
        if (validated.isValidated) {
          return validated;
        }
      }

      const platform = await this.fetchSegmentWeights('PLATFORM', context.platform);
      if (platform) {
        const validated = this.applyBayesianShrinkage(platform, this.defaultWeights);
        if (validated.isValidated) {
          return validated;
        }
      }
    } catch (error) {
      logger.error({ error, context }, 'DecisionEngine weight fetch failed');
      this.metrics.increment('weights_validation_failure_count', { reason: 'fetch_error' });
    }

    return { ...this.defaultWeights, validationTimestamp: new Date(), isValidated: true };
  }

  private async fetchSegmentWeights(
    segmentType: string,
    segmentKey: string
  ): Promise<SegmentWeightRecord | null> {
    const client = this.prisma.segmentedWeight;
    if (!client?.findUnique) {
      logger.warn({ segmentType, segmentKey }, 'Segmented weight client missing');
      return null;
    }

    try {
      return await client.findUnique({
        where: {
          segmentType_segmentKey: {
            segmentType,
            segmentKey,
          },
        },
      });
    } catch (error) {
      logger.error({ error, segmentType, segmentKey }, 'Segmented weight lookup failed');
      return null;
    }
  }

  /**
   * Blend raw segmented weights toward the global defaults using Bayesian shrinkage and return validated results.
   */
  applyBayesianShrinkage(
    segmentWeights: SegmentWeightRecord,
    globalWeights: SignalWeights
  ): SignalWeights {
    const now = new Date();
    const sampleSize = Number.isFinite(segmentWeights.sampleSize) ? segmentWeights.sampleSize : 0;
    const minSampleSize = Math.max(this.thresholds.minSampleSize, 1);

    if (!Number.isFinite(sampleSize) || sampleSize <= 0) {
      this.metrics.increment('weights_validation_failure_count', { reason: 'invalid_sample' });
      logger.warn({ sampleSize }, 'DecisionEngine invalid sampleSize');
      return { ...globalWeights, isValidated: false, validationTimestamp: now };
    }

    const shrinkage = sampleSize / (sampleSize + minSampleSize);

    const blended: SignalWeights = {
      sssWeight: shrinkage * segmentWeights.sssWeight + (1 - shrinkage) * globalWeights.sssWeight,
      arsWeight: shrinkage * segmentWeights.arsWeight + (1 - shrinkage) * globalWeights.arsWeight,
      evsWeight: shrinkage * segmentWeights.evsWeight + (1 - shrinkage) * globalWeights.evsWeight,
      trsWeight: shrinkage * segmentWeights.trsWeight + (1 - shrinkage) * globalWeights.trsWeight,
      sssArsInteraction:
        shrinkage * (segmentWeights.sssArsInteraction ?? 0) +
        (1 - shrinkage) * (globalWeights.sssArsInteraction ?? 0),
      evsTrsInteraction:
        shrinkage * (segmentWeights.evsTrsInteraction ?? 0) +
        (1 - shrinkage) * (globalWeights.evsTrsInteraction ?? 0),
      segmentType: segmentWeights.segmentType ?? globalWeights.segmentType,
      segmentKey: segmentWeights.segmentKey ?? globalWeights.segmentKey,
      sampleSize,
      isValidated: true,
      validationTimestamp: now,
    };

    const validated = this.validateWeights(blended, globalWeights);
    if (!validated.isValidated) {
      return { ...globalWeights, isValidated: false, validationTimestamp: now };
    }

    return validated;
  }

  private validateWeights(candidate: SignalWeights, fallback: SignalWeights): SignalWeights {
    const baseWeights = [
      candidate.sssWeight,
      candidate.arsWeight,
      candidate.evsWeight,
      candidate.trsWeight,
    ];
    if (baseWeights.some((value) => !Number.isFinite(value) || value < 0)) {
      this.metrics.increment('weights_validation_failure_count', {
        reason: 'non_finite_or_negative',
      });
      logger.error({ candidate }, 'DecisionEngine invalid weights');
      return { ...fallback, isValidated: false, validationTimestamp: new Date() };
    }

    const sum = baseWeights.reduce((acc, val) => acc + val, 0);
    if (Math.abs(sum - 1) > 0.001) {
      this.metrics.increment('weights_validation_failure_count', { reason: 'sum_not_one' });
      logger.error({ candidate, sum }, 'DecisionEngine weights do not sum to 1');
      return { ...fallback, isValidated: false, validationTimestamp: new Date() };
    }

    const interactions = [candidate.sssArsInteraction ?? 0, candidate.evsTrsInteraction ?? 0];
    if (interactions.some((value) => !Number.isFinite(value) || value < 0)) {
      this.metrics.increment('weights_validation_failure_count', { reason: 'interaction_invalid' });
      logger.error({ candidate }, 'DecisionEngine invalid interaction weights');
      return { ...fallback, isValidated: false, validationTimestamp: new Date() };
    }

    return { ...candidate, isValidated: true };
  }

  /**
   * Combine the four signals using normalized EVS, interactions, and validated weights, clamping results defensively.
   */
  calculateComposite(
    sss: SssSignal,
    ars: ArsSignal,
    evs: EvsSignal,
    trs: TrsSignal,
    weights: SignalWeights
  ): number {
    const validatedSSS = this.validateScore(sss.score, 'SSS', 0.5, true);
    const validatedARS = this.validateScore(ars.score, 'ARS', 0.5, true);
    const validatedEVS = this.validateScore(evs.ratio, 'EVS', 1.0, false);
    const validatedTRS = this.validateScore(trs.score, 'TRS', 0.5, true);

    const evsNormalized = Math.log10(validatedEVS + 1) / Math.log10(101);

    const raw =
      validatedSSS * weights.sssWeight +
      validatedARS * weights.arsWeight +
      evsNormalized * weights.evsWeight +
      validatedTRS * weights.trsWeight +
      validatedSSS * validatedARS * (weights.sssArsInteraction ?? 0.05) +
      evsNormalized * validatedTRS * (weights.evsTrsInteraction ?? 0.03);

    if (!Number.isFinite(raw)) {
      this.metrics.increment('nan_infinity_detected_count', { field: 'composite' });
      logger.error({ raw }, 'DecisionEngine invalid composite score');
      return 0.5;
    }

    if (raw < 0 || raw > 1) {
      this.metrics.increment('composite_score_out_of_range', { raw });
    }

    const clamped = Math.max(0, Math.min(1, raw));
    if (clamped !== raw) {
      this.metrics.increment('composite_score_clamped', { raw, clamped });
      logger.warn({ raw, clamped }, 'DecisionEngine composite clamped to [0,1]');
    }

    return clamped;
  }

  private validateScore(
    score: number,
    name: string,
    fallback: number,
    requireUnitInterval: boolean
  ): number {
    if (!Number.isFinite(score)) {
      this.metrics.increment('nan_infinity_detected_count', { field: name });
      logger.error({ score, fallback }, `Invalid ${name} score, using fallback`);
      return fallback;
    }

    if (requireUnitInterval && (score < 0 || score > 1)) {
      this.metrics.increment('score.clamped', { signal: name });
      logger.warn({ score }, `${name} score out of [0,1], clamping`);
      return Math.max(0, Math.min(1, score));
    }

    return score;
  }

  /**
   * Select an operational mode with explicit gates (safety/TRS) and prioritized branches, normalizing probabilities to the chosen mode.
   */
  selectMode(signals: SignalBundle, thresholds: DecisionThresholds = this.thresholds): {
    mode: OperationalMode;
    probabilities: Record<OperationalMode, number>;
  } {
    const { safety, trs, powerUser, competitor } = signals;

    if (safety.shouldDisengage) {
      return {
        mode: 'DISENGAGED',
        probabilities: this.gatedProbabilities('DISENGAGED'),
      };
    }

    // Competitive Override
    if (competitor.detected) {
      const mode: OperationalMode = competitor.opportunityScore > 0.6 ? 'HELPFUL' : 'HYBRID';
      return this.probabilisticMode(mode, signals);
    }

    if (trs.score < thresholds.trsGate) {
      return {
        mode: 'DISENGAGED',
        probabilities: this.gatedProbabilities('DISENGAGED'),
      };
    }

    if (powerUser.isPowerUser) {
      if (signals.sss.score >= 0.7) {
        return this.probabilisticMode('HELPFUL', signals);
      }
      if (signals.evs.ratio > 3) {
        return this.probabilisticMode('HYBRID', signals);
      }
      return this.probabilisticMode('ENGAGEMENT', signals);
    }

    if (signals.sss.score >= thresholds.sssHelpful) {
      return this.probabilisticMode('HELPFUL', signals);
    }

    if (signals.evs.ratio > thresholds.evsHighViral) {
      if (signals.ars.score > thresholds.arsStrong) {
        return this.probabilisticMode('HYBRID', signals);
      }
      if (signals.sss.score >= thresholds.sssModerate) {
        return this.probabilisticMode('ENGAGEMENT', signals);
      }
      return this.probabilisticMode('DISENGAGED', signals);
    }

    if (signals.sss.score >= thresholds.sssModerate) {
      if (signals.ars.score > thresholds.arsStrong) {
        return this.probabilisticMode('HYBRID', signals);
      }
      return this.probabilisticMode('ENGAGEMENT', signals);
    }

    if (signals.evs.ratio > thresholds.evsModerateViral) {
      return this.probabilisticMode('ENGAGEMENT', signals);
    }

    return this.probabilisticMode('DISENGAGED', signals);
  }

  private probabilisticMode(
    selectedMode: OperationalMode,
    signals: SignalBundle
  ): { mode: OperationalMode; probabilities: Record<OperationalMode, number> } {
    const logits = {
      HELPFUL: this.calculateModeLogit('HELPFUL', signals),
      ENGAGEMENT: this.calculateModeLogit('ENGAGEMENT', signals),
      HYBRID: this.calculateModeLogit('HYBRID', signals),
      DISENGAGED: this.calculateModeLogit('DISENGAGED', signals),
    };

    let probabilities = this.softmax(logits);
    probabilities = this.applyGateToProbabilities(probabilities, selectedMode);

    return { mode: selectedMode, probabilities };
  }

  private calculateModeLogit(mode: OperationalMode, signals: SignalBundle): number {
    const { sss, ars, evs, trs } = signals;
    const coefficients: Record<
      OperationalMode,
      { intercept: number; sss: number; ars: number; evs: number; trs: number }
    > = {
      HELPFUL: { intercept: -2, sss: 5, ars: 1, evs: 0.5, trs: 0.5 },
      ENGAGEMENT: { intercept: -1, sss: -2, ars: 0, evs: 2, trs: 0.5 },
      HYBRID: { intercept: -1.5, sss: 2, ars: 3, evs: 1, trs: 0.5 },
      DISENGAGED: { intercept: 0, sss: -3, ars: 0, evs: 0, trs: -2 },
    };

    const coef = coefficients[mode];
    const evsLog = Math.log10(evs.ratio + 1) / Math.log10(101);

    const raw =
      coef.intercept +
      coef.sss * sss.score +
      coef.ars * ars.score +
      coef.evs * evsLog +
      coef.trs * trs.score;

    if (!Number.isFinite(raw)) {
      this.metrics.increment('nan_infinity_detected_count', { field: `mode_logit_${mode}` });
      return 0;
    }

    return raw;
  }

  private softmax(logits: Record<OperationalMode, number>): Record<OperationalMode, number> {
    const expvalues = Object.fromEntries(
      Object.entries(logits).map(([mode, logit]) => [mode, Math.exp(logit)])
    ) as Record<OperationalMode, number>;

    const sum = Object.values(expvalues).reduce((acc, val) => acc + val, 0);
    if (sum === 0) {
      return this.gatedProbabilities('DISENGAGED');
    }

    return Object.fromEntries(
      Object.entries(expvalues).map(([mode, value]) => [mode, value / sum])
    ) as Record<OperationalMode, number>;
  }

  private applyGateToProbabilities(
    probabilities: Record<OperationalMode, number>,
    selectedMode: OperationalMode
  ): Record<OperationalMode, number> {
    const gated = { ...probabilities };

    if (selectedMode === 'DISENGAGED') {
      return this.gatedProbabilities('DISENGAGED');
    }

    if (gated[selectedMode] <= 0) {
      gated[selectedMode] = 1e-6;
    }

    return this.normalizeProbabilities(gated);
  }

  private gatedProbabilities(mode: OperationalMode): Record<OperationalMode, number> {
    return {
      HELPFUL: mode === 'HELPFUL' ? 1 : 0,
      ENGAGEMENT: mode === 'ENGAGEMENT' ? 1 : 0,
      HYBRID: mode === 'HYBRID' ? 1 : 0,
      DISENGAGED: mode === 'DISENGAGED' ? 1 : 0,
    };
  }

  private normalizeProbabilities(
    probabilities: Record<OperationalMode, number>
  ): Record<OperationalMode, number> {
    const sum = Object.values(probabilities).reduce((acc, val) => acc + val, 0);
    if (sum === 0) {
      return this.gatedProbabilities('DISENGAGED');
    }
    return Object.fromEntries(
      Object.entries(probabilities).map(([mode, value]) => [mode, value / sum])
    ) as Record<OperationalMode, number>;
  }

  /**
   * Estimate a 95% credible interval for the composite score using signal confidences and minimum sample sizes.
   */
  calculateUncertainty(
    sss: SssSignal,
    ars: ArsSignal,
    evs: EvsSignal,
    trs: TrsSignal,
    weights: SignalWeights,
    compositeScore: number
  ): { credibleInterval: [number, number] } {
    const sampleSize =
      Number.isFinite(weights.sampleSize) && weights.sampleSize > 0
        ? weights.sampleSize
        : this.thresholds.minSampleSize;

    const sampleFactor = Math.min(sampleSize / this.thresholds.minSampleSize, 1);
    const avgConfidence = this.averageConfidence([
      sss,
      ars,
      trs,
      { score: evs.confidence ?? DEFAULT_CONFIDENCE },
    ]);

    let variance = DEFAULT_VARIANCE * (1 - sampleFactor) * (1 - avgConfidence);
    if (!Number.isFinite(variance) || variance <= 0) {
      this.metrics.increment('nan_infinity_detected_count', { field: 'uncertainty' });
      variance = DEFAULT_VARIANCE;
    }

    const stdDev = Math.sqrt(variance);
    const lower = Math.max(0, compositeScore - 1.96 * stdDev);
    const upper = Math.min(1, compositeScore + 1.96 * stdDev);

    return { credibleInterval: [lower, upper] };
  }

  private averageConfidence(signals: Array<{ score?: number; confidence?: number }>): number {
    const confidences = signals.map((signal) =>
      Number.isFinite(signal.confidence ?? DEFAULT_CONFIDENCE)
        ? (signal.confidence as number)
        : DEFAULT_CONFIDENCE
    );
    const sum = confidences.reduce((acc, value) => acc + value, 0);
    const avg = sum / Math.max(confidences.length, 1);
    if (!Number.isFinite(avg)) {
      return DEFAULT_CONFIDENCE;
    }
    return Math.min(Math.max(avg, 0), 1);
  }

  private computeReviewInfo(
    signals: SignalBundle,
    compositeScore: number,
    modeConfidence: number,
    mode: OperationalMode
  ): { needsReview: boolean; reviewReason?: DecisionResult['reviewReason'] } {
    let reason: DecisionResult['reviewReason'];

    if (signals.safety.shouldDisengage && mode !== 'DISENGAGED') {
      reason = 'CONFLICTING_SIGNALS';
    } else if (
      modeConfidence <
      this.thresholds.confidenceThreshold + this.thresholds.reviewConfidenceDelta
    ) {
      reason = 'LOW_CONFIDENCE';
    } else if (this.isNearThreshold(signals.sss.score, compositeScore)) {
      reason = 'NEAR_THRESHOLD';
    }

    this.metrics.increment('mode_confidence_distribution', {
      mode,
      bucket: bucketConfidence(modeConfidence),
    });

    return { needsReview: Boolean(reason), reviewReason: reason };
  }

  private isNearThreshold(sssScore: number, compositeScore: number): boolean {
    const candidateThresholds = [this.thresholds.sssHelpful, this.thresholds.sssModerate];
    return candidateThresholds.some(
      (threshold) =>
        Math.abs(sssScore - threshold) <= this.thresholds.nearThresholdTolerance ||
        Math.abs(compositeScore - threshold) <= this.thresholds.nearThresholdTolerance
    );
  }

  private async fetchSignalWithBreaker<T>(
    name: string,
    fetcher: () => Promise<T>,
    fallback: Fallback<T>
  ): Promise<T> {
    const breaker = this.getOrCreateBreaker(name, fetcher);

    try {
      const result = await breaker.fire();
      return result as T;
    } catch (error) {
      this.metrics.increment('signal.failure', { signal: name });
      this.metrics.increment('breaker_state_failure', { signal: name });
      const resolved = this.resolveFallback(fallback);
      logger.warn({ error, fallback: resolved }, `${name} signal failed, using fallback`);
      return resolved;
    }
  }

  private resolveFallback<T>(fallback: Fallback<T>): T {
    return typeof fallback === 'function' ? (fallback as () => T)() : fallback;
  }

  private getOrCreateBreaker<T>(name: string, fetcher: () => Promise<T>): CircuitBreaker<[]> {
    if (this.breakers.has(name)) {
      return this.breakers.get(name) as CircuitBreaker<[]>;
    }

    const breaker = new CircuitBreaker(fetcher, this.breakerOptions);

    breaker.on('open', () => this.metrics.increment('breaker_state_open', { signal: name }));

    breaker.on('close', () => this.metrics.increment('breaker_state_close', { signal: name }));

    breaker.on('timeout', () =>
      this.metrics.increment('breaker_state_failure', { signal: name, reason: 'timeout' })
    );

    breaker.on('reject', () =>
      this.metrics.increment('breaker_state_failure', { signal: name, reason: 'reject' })
    );

    breaker.on('fallback', () => this.metrics.increment('breaker_fallback', { signal: name }));

    this.breakers.set(name, breaker);

    return breaker;
  }

  private pickArchetype(signals: SignalBundle): string | null {
    // Competitor Override (AC 8)
    if (signals.competitor.detected) {
      return 'PROBLEM_SOLUTION_DIRECT';
    }

    const detectedArchetypes = signals.ars.archetypes;
    const allowedByTier = signals.powerUser.suggestedArchetypes ?? [];
    const temporalPreferences = signals.temporal.context.archetypePreferences ?? [];

    // 1. Filter Temporal Preferences by Tier Allowance
    const allowedTemporal = temporalPreferences.filter((a) => allowedByTier.includes(a));
    if (allowedTemporal.length > 0) {
      logger.info(
        {
          preferredMatch: allowedTemporal[0],
          preferences: temporalPreferences,
          tier: signals.powerUser.userTier,
        },
        'temporal_archetype_applied_with_tier_check'
      );
      return allowedTemporal[0];
    }

    // 2. Filter Context/ARS Archetypes by Tier Allowance
    const allowedContext = detectedArchetypes.filter((a) => allowedByTier.includes(a));
    if (allowedContext.length > 0) {
      return allowedContext[0];
    }

    // 3. Fallback to Tier Default (top suggested)
    if (allowedByTier.length > 0) {
      return allowedByTier[0];
    }

    // 4. Competitor Fallback (only if no tier suggestions)
    if (signals.competitor.detected && signals.competitor.name) {
      return `competitor_${signals.competitor.name}`;
    }

    // 5. Ultimate Fallback
    return detectedArchetypes[0] ?? 'general';
  }

  private async resolveArchetypeId(name: string | null): Promise<string | null> {
    if (!name) return null;
    if (this.archetypeCache.has(name)) {
      return this.archetypeCache.get(name) ?? null;
    }

    const client = this.prisma.archetype;
    if (!client?.findUnique) {
      return null;
    }

    try {
      const record = await client.findUnique({ where: { name } });
      const id = record?.id ?? null;
      this.archetypeCache.set(name, id);
      return id;
    } catch (error) {
      logger.error({ error, name }, 'Failed to resolve archetype');
      return null;
    }
  }

  private buildDecisionCreatePayload(decision: DecisionResult): Record<string, unknown> {
    return {
      postId: decision.postId,
      sssScore: decision.sssScore,
      arsScore: decision.arsScore,
      evsScore: decision.evsScore,
      trsScore: decision.trsScore,
      compositeScore: decision.compositeScore,
      mode: decision.mode,
      archetypeId: decision.archetypeId,
      safetyFlags: decision.safetyFlags,
      signalsJson: decision.signalsJson,
      temporalContext: decision.temporalContext,
      competitorDetected: decision.competitorDetected,
      isPowerUser: decision.isPowerUser,
      userTier: decision.userTier,
      responseTargetMinutes: decision.responseTargetMinutes,
      caringResponse: decision.caringResponse,
      engagementRate: decision.engagementRate,
      tierReasons: decision.tierReasons,
      compositeCredibleIntervalLower: decision.compositeCredibleInterval[0],
      compositeCredibleIntervalUpper: decision.compositeCredibleInterval[1],
      modeConfidence: decision.modeConfidence,
      modeProbabilities: decision.modeProbabilities,
      needsReview: decision.needsReview,
      reviewReason: decision.reviewReason,
      decisionLogicVersion: decision.decisionLogicVersion,
      segmentUsed: decision.segmentUsed,
    };
  }

  /**
   * Persist a decision and corresponding post update inside a transaction; logs and returns quietly on failures.
   */
  async saveDecision(decision: DecisionResult): Promise<void> {
    const prisma = this.prisma;
    if (!prisma?.$transaction || !prisma.decision || !prisma.post) {
      logger.warn('DecisionEngine persistence skipped: incomplete prisma');
      return;
    }

    const payload = this.buildDecisionCreatePayload(decision);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.decision?.create?.({ data: payload });
        await tx.post?.update?.({
          where: { id: decision.postId },
          data: { processedAt: new Date() },
        });
      });

      if (decision.competitorDetected && decision.mode !== 'DISENGAGED') {
        await this.incrementCompetitiveCounters(decision.competitorDetected);
      }
    } catch (error) {
      logger.error({ error }, 'DecisionEngine persistence failed');
    }
  }

  private async checkCompetitiveRateLimit(
    competitorName: string,
    opportunityScore: number
  ): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const keyCompetitor = `competitive:${competitorName}:${today}`;
    const keyGlobal = `competitive:global:${today}`;

    try {
      const [compCount, globalCount] = await Promise.all([
        redis.get(keyCompetitor),
        redis.get(keyGlobal),
      ]);

      if (compCount && parseInt(compCount, 10) >= 5) {
        return false;
      }

      if (globalCount && parseInt(globalCount, 10) >= 15) {
        // Prioritize high opportunity score
        return opportunityScore > 0.8;
      }

      return true;
    } catch (error) {
      logger.error({ error }, 'Redis rate limit check failed');
      return true; // Fail open
    }
  }

  private async incrementCompetitiveCounters(competitorName: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const keyCompetitor = `competitive:${competitorName}:${today}`;
    const keyGlobal = `competitive:global:${today}`;
    const ttl = 86400; // 24 hours

    try {
      const pipeline = redis.pipeline();
      pipeline.incr(keyCompetitor);
      pipeline.expire(keyCompetitor, ttl);
      pipeline.incr(keyGlobal);
      pipeline.expire(keyGlobal, ttl);
      await pipeline.exec();
    } catch (error) {
      logger.error({ error }, 'Failed to increment competitive counters');
    }
  }

  private recordLatency(start: bigint): void {
    const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
    this.latencyHistogram.record(durationMs);
    this.metrics.increment('decision_latency_count');
    this.metrics.record?.('decision_latency_ms', durationMs);
  }

  /**
   * Provide a lightweight health snapshot for observability endpoints (cache stats, breaker states, latency summary).
   */
  getHealthSnapshot(): {
    cache: NodeCache.Stats;
    breakers: Array<{ signal: string; state: string }>;
    latency: { count: number; p95: number | null; max: number | null };
  } {
    return {
      cache: this.weightCache.getStats(),
      breakers: this.getBreakerStates(),
      latency: this.latencyHistogram.getStats(),
    };
  }

  /**
   * Expose Prometheus-friendly latency metrics including histogram buckets, totals, and quantiles.
   */
  getLatencyMetrics(): DecisionLatencyMetrics {
    const stats = this.latencyHistogram.getStats();
    return {
      count: this.latencyHistogram.getTotalCount(),
      sum: this.latencyHistogram.getSum(),
      p95: stats.p95 ?? null,
      max: stats.max ?? null,
      buckets: this.latencyHistogram.getBuckets(),
    };
  }

  private getBreakerStates(): Array<{ signal: string; state: string }> {
    return Array.from(this.breakers.entries()).map(([signal, breaker]) => {
      const state =
        (breaker as unknown as { state?: string }).state ??
        (breaker as unknown as { status?: { state?: string } }).status?.state ??
        'unknown';
      return { signal, state };
    });
  }
}

export const decisionEngine = new DecisionEngine();
