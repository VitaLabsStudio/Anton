import type { Author, Prisma, UserTier } from '@prisma/client';

import { logger } from '../utils/logger.js';
import { prisma as prismaClient } from '../utils/prisma.js';
import { redis as redisClient } from '../utils/redis.js';

const POWER_FOLLOWER_THRESHOLD = 5_000;
const MACRO_THRESHOLD = 50_000;
const MEGA_THRESHOLD = 500_000;
const ENGAGEMENT_POWER_THRESHOLD = 0.03;
const ENGAGEMENT_ENGAGED_THRESHOLD = 0.02;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const ENGAGEMENT_CACHE_TTL_SECONDS = 86_400; // 24h

export const POWER_TIERS = new Set<UserTier>([
  'MEGA_POWER',
  'MACRO_POWER',
  'MICRO_POWER',
]);

export const TIER_PRIORITY: Record<UserTier, number> = {
  MEGA_POWER: 1,
  MACRO_POWER: 2,
  MICRO_POWER: 3,
  ENGAGED_REGULAR: 4,
  STANDARD: 5,
  SMALL: 6,
  NEW_UNKNOWN: 7,
};

export const TIER_RESPONSE_TARGETS: Record<UserTier, number> = {
  MEGA_POWER: 30,
  MACRO_POWER: 30,
  MICRO_POWER: 30,
  ENGAGED_REGULAR: 60,
  STANDARD: 90,
  SMALL: 120,
  NEW_UNKNOWN: 120,
};

interface PendingActionPlan {
  actionType: string;
  targetCount: number;
  expiresAt: Date;
  triggerPost?: string | null;
}

export interface TierDetectionResult {
  userTier: UserTier;
  isPowerUser: boolean;
  engagementRate: number;
  reasons: string[];
  responseTargetMinutes: number;
  suggestedArchetypes: string[];
  caringResponse: boolean;
  followUpPlan: PendingActionPlan[];
  metadata: {
    bioKeywords: string[];
    verified: boolean;
    lowConfidence: boolean;
  };
  confidence?: number;
}

type PrismaClientLike = Pick<
  PrismaClient,
  '$transaction'
> &
  Partial<{
    post: Pick<Prisma.PostDelegate, 'findMany'>;
    author: Pick<Prisma.AuthorDelegate, 'update'>;
    tierChange: Pick<Prisma.TierChangeDelegate, 'create'>;
    pendingAction: Pick<Prisma.PendingActionDelegate, 'createMany'>;
  }>;

type PrismaClient = typeof prismaClient;

/**
 * Tiered classification and engagement cue detector
 */
export class TieredUserDetector {
  private readonly prisma: PrismaClientLike;
  private readonly redis: typeof redisClient;

  constructor(deps?: { prismaClient?: PrismaClientLike; redis?: typeof redisClient }) {
    this.prisma = deps?.prismaClient ?? prismaClient;
    this.redis = deps?.redis ?? redisClient;
  }

  async detect(author: Author): Promise<TierDetectionResult> {
    const [engagement, bioKeywords] = await Promise.all([
      this.getEngagementRate(author),
      Promise.resolve(checkBioKeywords(author.displayName ?? null, author.bio ?? null)),
    ]);

    const classification = this.classify(author, engagement.rate, bioKeywords);
    classification.metadata.lowConfidence = engagement.lowConfidence;
    await this.persistClassification(author, classification, bioKeywords, engagement.lowConfidence);

    return classification;
  }

  private classify(
    author: Author,
    engagementRate: number,
    bioKeywords: string[]
  ): TierDetectionResult {
    let tier: UserTier = author.userTier ?? 'NEW_UNKNOWN';
    const reasons: string[] = [];
    let isPowerUser = POWER_TIERS.has(tier);

    const promoteTier = (candidate: UserTier, reason: string): void => {
      const currentPriority = TIER_PRIORITY[tier] ?? Number.MAX_SAFE_INTEGER;
      const candidatePriority = TIER_PRIORITY[candidate] ?? Number.MAX_SAFE_INTEGER;
      if (candidatePriority < currentPriority) {
        tier = candidate;
      }
      reasons.push(reason);
      if (POWER_TIERS.has(candidate)) {
        isPowerUser = true;
      }
    };

    // Power user detection first
    if (author.followerCount >= MEGA_THRESHOLD) {
      promoteTier('MEGA_POWER', 'Follower count >= 500k');
    } else if (author.followerCount >= MACRO_THRESHOLD) {
      promoteTier('MACRO_POWER', 'Follower count between 50k-500k');
    } else if (author.followerCount >= POWER_FOLLOWER_THRESHOLD) {
      promoteTier('MICRO_POWER', 'Follower count between 5k-50k');
    }

    if (engagementRate > ENGAGEMENT_POWER_THRESHOLD) {
      promoteTier('MICRO_POWER', 'Engagement rate >3%');
    }

    if (author.isVerified) {
      promoteTier('MICRO_POWER', 'Verified badge detected');
    }

    if (bioKeywords.length > 0) {
      promoteTier('MICRO_POWER', `Bio keywords: ${bioKeywords.join(', ')}`);
    }

    // Non-power tiers with detection priority preserved
    if (!isPowerUser) {
      if (
        author.followerCount >= 1_000 &&
        author.followerCount < POWER_FOLLOWER_THRESHOLD &&
        engagementRate >= ENGAGEMENT_ENGAGED_THRESHOLD
      ) {
        promoteTier('ENGAGED_REGULAR', '1k-5k followers with ≥2% engagement');
      }

      if (
        (author.followerCount >= 500 && author.followerCount < 1_000) ||
        (author.followerCount >= 1_000 &&
          author.followerCount < POWER_FOLLOWER_THRESHOLD &&
          engagementRate < ENGAGEMENT_ENGAGED_THRESHOLD)
      ) {
        promoteTier('STANDARD', '500-1k followers or 1k-5k with <2% engagement');
      }

      if (author.followerCount >= 100 && author.followerCount < 500) {
        promoteTier('SMALL', '100-500 followers');
      }

      if (author.followerCount < 100) {
        promoteTier('NEW_UNKNOWN', 'New/unknown account with <100 followers');
      }
    }

    const caringResponse = tier === 'SMALL' || tier === 'NEW_UNKNOWN';

    const result: TierDetectionResult = {
      userTier: tier,
      isPowerUser,
      engagementRate,
      reasons,
      responseTargetMinutes: TIER_RESPONSE_TARGETS[tier],
      suggestedArchetypes: archetypesForTier(tier),
      caringResponse,
      followUpPlan: buildFollowUpPlan(tier),
      metadata: {
        bioKeywords,
        verified: author.isVerified,
        lowConfidence: false,
      },
      confidence: isPowerUser ? 0.9 : 0.7,
    };

    if (engagementRate === 0 && author.followerCount === 0) {
      result.reasons.push('No followers or posts available for engagement calculation');
    }

    return result;
  }

  private async getEngagementRate(author: Author): Promise<{ rate: number; lowConfidence: boolean }> {
    const cacheKey = `author:${author.id}:engagement_rate`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached !== null && cached !== undefined) {
        const parsed = Number.parseFloat(cached);
        if (!Number.isNaN(parsed)) {
          return { rate: parsed, lowConfidence: false };
        }
      }
    } catch (error) {
      logger.warn({ error, authorId: author.id }, 'Redis unavailable for engagement rate cache');
    }

    const { rate, lowConfidence } = await this.calculateEngagementRate(author);

    try {
      await this.redis.setex(cacheKey, ENGAGEMENT_CACHE_TTL_SECONDS, rate.toString());
    } catch (error) {
      logger.warn({ error, authorId: author.id }, 'Failed to cache engagement rate');
    }

    return { rate, lowConfidence };
  }

  private async calculateEngagementRate(author: Author): Promise<{
    rate: number;
    lowConfidence: boolean;
  }> {
    if (author.followerCount === 0) {
      logger.debug({ authorId: author.id }, 'Cannot calculate engagement rate: zero followers');
      return { rate: 0, lowConfidence: true };
    }

    const ninetyDaysAgo = new Date(Date.now() - NINETY_DAYS_MS);

    if (!this.prisma?.post?.findMany) {
      logger.warn({ authorId: author.id }, 'Prisma client missing, engagement rate fallback to 0');
      return { rate: 0, lowConfidence: true };
    }

    const posts = await this.prisma.post.findMany({
      where: {
        authorId: author.id,
        detectedAt: { gte: ninetyDaysAgo },
      },
      orderBy: { detectedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        rawMetrics: true,
        detectedAt: true,
      },
    });

    if (posts.length === 0) {
      logger.debug({ authorId: author.id }, 'Cannot calculate engagement rate: no posts');
      return { rate: 0, lowConfidence: true };
    }

    const engagements = posts.map((post) => {
      const metrics = post.rawMetrics as Record<string, unknown> | null;
      const likes = Number(metrics?.['likes'] ?? metrics?.['favorites'] ?? 0);
      const retweets = Number(metrics?.['retweets'] ?? metrics?.['reposts'] ?? metrics?.['shares'] ?? 0);
      const replies = Number(metrics?.['replies'] ?? metrics?.['comments'] ?? 0);
      return likes + retweets + replies;
    });

    const totalEngagement = engagements.reduce((sum, val) => sum + val, 0);
    const avgEngagementPerPost = totalEngagement / posts.length;
    const engagementRate = avgEngagementPerPost / author.followerCount;
    const lowConfidence = posts.length < 5;

    logger.debug(
      {
        authorId: author.id,
        followerCount: author.followerCount,
        postsAnalyzed: posts.length,
        avgEngagement: avgEngagementPerPost,
        engagementRate,
        lowConfidence,
      },
      'Calculated engagement rate'
    );

    return { rate: engagementRate, lowConfidence };
  }

  private async persistClassification(
    author: Author,
    classification: TierDetectionResult,
    bioKeywords: string[],
    lowConfidence: boolean
  ): Promise<void> {
    const prisma = this.prisma;
    if (!prisma?.author?.update) {
      logger.warn({ authorId: author.id }, 'Prisma client missing, skipping classification persistence');
      return;
    }

    const now = new Date();
    const previousTier = author.userTier ?? 'NEW_UNKNOWN';
    const shouldLogChange =
      previousTier !== classification.userTier || author.isPowerUser !== classification.isPowerUser;

    const run = async (tx: PrismaClientLike): Promise<void> => {
      await tx.author?.update?.({
        where: { id: author.id },
        data: {
          isPowerUser: classification.isPowerUser,
          userTier: classification.userTier,
          lastTierUpdate: now,
        },
      });

      if (shouldLogChange && tx.tierChange?.create) {
        await tx.tierChange.create({
          data: {
            authorId: author.id,
            previousTier,
            newTier: classification.userTier,
            trigger: previousTier === 'NEW_UNKNOWN' ? 'initial_detection' : 'threshold_crossed',
            growthRate: null,
            engagementRate: classification.engagementRate,
            followerCount: author.followerCount,
            notes: null,
            createdBy: null,
            metadata: {
              reasons: classification.reasons,
              bioKeywords,
              verified: author.isVerified,
              lowConfidence,
            },
          },
        });
      }

      if (classification.followUpPlan.length > 0 && shouldLogChange && tx.pendingAction?.createMany) {
        await tx.pendingAction.createMany({
          data: classification.followUpPlan.map((plan) => ({
            authorId: author.id,
            actionType: plan.actionType,
            targetCount: plan.targetCount,
            completed: 0,
            userTier: classification.userTier,
            triggerPost: plan.triggerPost ?? null,
            createdAt: now,
            expiresAt: plan.expiresAt,
          })),
        });
      }
    };

    if (prisma.$transaction) {
      await prisma.$transaction(async (tx) => run(tx as PrismaClientLike));
      return;
    }

    await run(prisma);
  }
}

export function archetypesForTier(tier: UserTier): string[] {
  if (tier === 'MEGA_POWER' || tier === 'MACRO_POWER' || tier === 'MICRO_POWER') {
    return ['COACH', 'CREDIBILITY_ANCHOR', 'CHECKLIST'];
  }

  if (tier === 'ENGAGED_REGULAR') {
    return ['COACH', 'CHECKLIST', 'CURIOSITY_CATALYST', 'CREDIBILITY_ANCHOR', 'NUANCE_SPECIALIST'];
  }

  return [
    'COACH',
    'CHECKLIST',
    'CREDIBILITY_ANCHOR',
    'MYTH_BUST',
    'EVIDENCE_ANCHOR',
    'TRANSPARENCY_ADVOCATE',
    'PERSPECTIVE_SHIFTER',
    'NUANCE_SPECIALIST',
    'CURIOSITY_CATALYST',
  ];
}

export function checkBioKeywords(displayName: string | null, bio: string | null): string[] {
  if (!displayName && !bio) return [];

  const keywords = [
    'influencer',
    'creator',
    'content creator',
    'brand ambassador',
    'brand partner',
    'sponsored athlete',
    'social media manager',
    'digital creator',
    'youtuber',
    'tiktok',
    'instagram model',
    'lifestyle blogger',
  ];

  const searchText = `${displayName || ''} ${bio || ''}`.toLowerCase();
  const found: string[] = [];

  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(searchText)) {
      found.push(keyword);
    }
  }

  return found;
}

export function buildFollowUpPlan(tier: UserTier): PendingActionPlan[] {
  const now = Date.now();

  if (tier === 'MEGA_POWER' || tier === 'MACRO_POWER' || tier === 'MICRO_POWER') {
    return [
      {
        actionType: 'like_next_posts',
        targetCount: 2,
        expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
      },
      {
        actionType: 'send_gift_dm',
        targetCount: 1,
        expiresAt: new Date(now + 14 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  if (tier === 'ENGAGED_REGULAR') {
    return [
      {
        actionType: 'thank_you_reply',
        targetCount: 1,
        expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  if (tier === 'SMALL' || tier === 'NEW_UNKNOWN') {
    return [
      {
        actionType: 'nurture_follow_up',
        targetCount: 1,
        expiresAt: new Date(now + 14 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  return [];
}

const detector = new TieredUserDetector();

export const detectUserTier = (author: Author): Promise<TierDetectionResult> =>
  detector.detect(author);
