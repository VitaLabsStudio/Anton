import type { Author, Platform, Post, Prisma } from '@prisma/client';

import { logger } from '../utils/logger.js';
import { prisma } from '../utils/prisma.js';
import { detectOutliers, winsorizedMean } from '../utils/robust-statistics.js';

export type VelocityCategory = 'silent_plea' | 'normal' | 'moderate' | 'viral';

export interface VelocitySignalResult {
  ratio: number;
  category: VelocityCategory;
  confidence: number;
  baselineRate: number;
  currentRate: number;
  temporalContext: TemporalContext;
}

interface TemporalContext {
  hoursSincePost: number;
  timeOfDayFactor: number;
  dayOfWeekFactor: number;
}

interface EngagementMetrics {
  likes: number;
  replies: number;
  reposts: number;
  upvotes: number;
  comments: number;
}

const MIN_BASELINE_POSTS = 5;
const MAX_BASELINE_POSTS = 50;
const BASELINE_LOOKBACK_DAYS = 30;
const MIN_HOURS_ELAPSED = 0.25; // 15 minutes floor to avoid divide-by-zero
const DEFAULT_RATIO = 1.0;

// Simple, bounded temporal weighting to normalize off-peak posting hours/weekends.
const TIME_OF_DAY_FACTORS: number[] = [
  0.65, 0.65, 0.7, 0.72, 0.75, 0.8, 0.88, 0.95, 1.0, 1.05, 1.08, 1.08, 1.05, 1.05, 1.05, 1.08, 1.1,
  1.1, 1.05, 0.98, 0.9, 0.82, 0.75, 0.7,
];

// Sunday=0 through Saturday=6
const DAY_OF_WEEK_FACTORS: number[] = [0.9, 1.0, 1.0, 1.02, 1.05, 1.08, 0.95];

export class PostVelocityAnalyzer {
  async analyzePostVelocity(post: Post, author: Author): Promise<VelocitySignalResult> {
    try {
      const { rate: currentRate, temporalContext } = this.calculateNormalizedEngagementRate(post);
      const baseline = await this.getAuthorBaseline(author.id, post.platform, post.platformPostId);

      const ratio =
        baseline.hasBaseline && baseline.baselineRate > 0
          ? currentRate / baseline.baselineRate
          : DEFAULT_RATIO;

      return {
        ratio: Number.isFinite(ratio) ? ratio : DEFAULT_RATIO,
        category: this.categorizeVelocity(ratio),
        confidence: this.deriveConfidence(baseline.sampleSize, baseline.hasBaseline),
        baselineRate: baseline.baselineRate,
        currentRate,
        temporalContext,
      };
    } catch (error) {
      logger.error({ error, postId: post.id }, 'Post velocity analysis failed');
      return {
        ratio: DEFAULT_RATIO,
        category: 'normal',
        confidence: 0.0,
        baselineRate: DEFAULT_RATIO,
        currentRate: 0,
        temporalContext: this.getTemporalContext(post.detectedAt),
      };
    }
  }

  private async getAuthorBaseline(
    authorId: string,
    platform: Platform,
    currentPlatformPostId: string
  ): Promise<{ baselineRate: number; sampleSize: number; hasBaseline: boolean }> {
    const lookbackStart = new Date(Date.now() - BASELINE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const recentPosts = await prisma.post.findMany({
      where: {
        authorId,
        platform,
        platformPostId: { not: currentPlatformPostId },
        detectedAt: { gte: lookbackStart },
      },
      orderBy: { detectedAt: 'desc' },
      take: MAX_BASELINE_POSTS,
    });

    if (recentPosts.length < MIN_BASELINE_POSTS) {
      return { baselineRate: DEFAULT_RATIO, sampleSize: recentPosts.length, hasBaseline: false };
    }

    const normalizedRates = recentPosts
      .map((recentPost: Post) => this.calculateNormalizedEngagementRate(recentPost).rate)
      .filter((rate: number) => Number.isFinite(rate) && rate >= 0);

    if (normalizedRates.length === 0) {
      return { baselineRate: DEFAULT_RATIO, sampleSize: recentPosts.length, hasBaseline: false };
    }

    const filteredRates = this.removeOutliers(normalizedRates);
    const winsorInput = filteredRates.length > 0 ? filteredRates : normalizedRates;

    const baselineRate = winsorizedMean(winsorInput, 0.1);

    if (!Number.isFinite(baselineRate) || baselineRate <= 0) {
      return {
        baselineRate: DEFAULT_RATIO,
        sampleSize: normalizedRates.length,
        hasBaseline: false,
      };
    }

    return {
      baselineRate,
      sampleSize: winsorInput.length,
      hasBaseline: true,
    };
  }

  private calculateNormalizedEngagementRate(post: Post): {
    rate: number;
    temporalContext: TemporalContext;
  } {
    const temporalContext = this.getTemporalContext(post.detectedAt);
    const rawRate = this.calculateEngagementRate(post, temporalContext.hoursSincePost);

    const normalizationFactor = Math.max(
      0.6,
      temporalContext.timeOfDayFactor * temporalContext.dayOfWeekFactor
    );

    return {
      rate: rawRate / normalizationFactor,
      temporalContext,
    };
  }

  private calculateEngagementRate(post: Post, hoursSincePost: number): number {
    const metrics = this.extractMetrics(post.rawMetrics);
    const totalEngagements =
      metrics.likes + metrics.replies + metrics.reposts + metrics.upvotes + metrics.comments;

    return totalEngagements / hoursSincePost;
  }

  private extractMetrics(rawMetrics: Prisma.JsonValue | null): EngagementMetrics {
    if (!rawMetrics || typeof rawMetrics !== 'object') {
      return { likes: 0, replies: 0, reposts: 0, upvotes: 0, comments: 0 };
    }

    const metrics = rawMetrics as Record<string, unknown>;
    const safeNumber = (value: unknown): number =>
      typeof value === 'number' && Number.isFinite(value) ? value : 0;

    return {
      likes: safeNumber(metrics['likes']),
      replies: safeNumber(metrics['replies'] ?? metrics['comments']),
      reposts: safeNumber(metrics['retweets'] ?? metrics['reposts']),
      upvotes: safeNumber(metrics['upvotes']),
      comments: safeNumber(metrics['comments']),
    };
  }

  private getTemporalContext(detectedAt: Date): TemporalContext {
    const hoursSincePost = Math.max(
      MIN_HOURS_ELAPSED,
      (Date.now() - detectedAt.getTime()) / (1000 * 60 * 60)
    );

    const hour = detectedAt.getUTCHours();
    const day = detectedAt.getUTCDay();

    const timeOfDayFactor = TIME_OF_DAY_FACTORS[hour] ?? 1.0;
    const dayOfWeekFactor = DAY_OF_WEEK_FACTORS[day] ?? 1.0;

    return {
      hoursSincePost,
      timeOfDayFactor,
      dayOfWeekFactor,
    };
  }

  private removeOutliers(values: number[]): number[] {
    const outlierIndices = detectOutliers(values);
    if (outlierIndices.length === 0) {
      return values;
    }

    const filtered = values.filter((_, index) => !outlierIndices.includes(index));
    return filtered.length > 0 ? filtered : values;
  }

  private categorizeVelocity(ratio: number): VelocityCategory {
    if (ratio < 1.0) return 'silent_plea';
    if (ratio < 2.0) return 'normal';
    if (ratio < 5.0) return 'moderate';
    return 'viral';
  }

  private deriveConfidence(sampleSize: number, hasBaseline: boolean): number {
    if (!hasBaseline) return 0.5;
    if (sampleSize >= 25) return 0.9;
    if (sampleSize >= 10) return 0.82;
    return 0.72;
  }
}

export const postVelocityAnalyzer = new PostVelocityAnalyzer();
/**
 * Analyze a post's engagement velocity against the author's baseline.
 *
 * @param post - Post with rawMetrics populated (likes/replies/reposts/upvotes/comments)
 * @param author - Author owning the post, used to fetch historical baseline
 * @returns Velocity signal containing ratio, category, confidence, and temporal context
 *
 * @example
 * const result = await analyzePostVelocity(post, author);
 * console.log(result.category); // 'normal' | 'moderate' | 'viral' | 'silent_plea'
 */
export const analyzePostVelocity = (post: Post, author: Author): Promise<VelocitySignalResult> =>
  postVelocityAnalyzer.analyzePostVelocity(post, author);
