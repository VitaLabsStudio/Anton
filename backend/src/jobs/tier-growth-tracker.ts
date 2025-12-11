import type { Author, TierChange } from '@prisma/client';

import { detectUserTier } from '../analysis/tiered-user-detector.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../utils/prisma.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const RISING_STAR_THRESHOLD = 0.2; // 20% MoM
const LOOKBACK_DAYS = 7;

export class TierGrowthTracker {
  async run(): Promise<void> {
    const cutoff = new Date(Date.now() - LOOKBACK_DAYS * DAY_MS);

    const authors = await prisma.author.findMany({
      where: {
        OR: [{ lastTierUpdate: null }, { lastTierUpdate: { lte: cutoff } }],
      },
      select: {
        id: true,
        followerCount: true,
        userTier: true,
        isPowerUser: true,
        lastTierUpdate: true,
        handle: true,
        platform: true,
        displayName: true,
        bio: true,
        isVerified: true,
      },
      take: 200,
    });

    if (authors.length === 0) {
      logger.info('TierGrowthTracker: no authors eligible for refresh');
      return;
    }

    logger.info({ count: authors.length }, 'TierGrowthTracker: refreshing tiers');

    for (const author of authors) {
      try {
        const growthRate = await this.calculateGrowthRate(author.id, author.followerCount);
        const risingStar = growthRate > RISING_STAR_THRESHOLD;

        const detection = await detectUserTier(author as Author);

        if (risingStar) {
          await this.logGrowthChange(author.id, author.userTier, detection.userTier, growthRate, {
            followerCount: author.followerCount,
            engagementRate: detection.engagementRate,
          });
        }
      } catch (error) {
        logger.warn({ error, authorId: author.id }, 'TierGrowthTracker: failed to refresh author');
      }
    }
  }

  private async calculateGrowthRate(authorId: string, currentFollowers: number): Promise<number> {
    const lastChange: Pick<TierChange, 'followerCount'> | null = await prisma.tierChange.findFirst({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      select: { followerCount: true },
    });

    const previousFollowers = lastChange?.followerCount ?? currentFollowers;

    if (!previousFollowers || previousFollowers <= 0) {
      return 0;
    }

    return (currentFollowers - previousFollowers) / previousFollowers;
  }

  private async logGrowthChange(
    authorId: string,
    previousTier: Author['userTier'],
    newTier: Author['userTier'],
    growthRate: number,
    metadata: { followerCount: number; engagementRate: number }
  ): Promise<void> {
    await prisma.tierChange.create({
      data: {
        authorId,
        previousTier,
        newTier,
        trigger: 'growth',
        growthRate,
        engagementRate: metadata.engagementRate,
        followerCount: metadata.followerCount,
        notes: 'Rising star detected (>20% growth)',
        createdBy: 'system',
        metadata: {
          risingStar: true,
          followerCount: metadata.followerCount,
          engagementRate: metadata.engagementRate,
        },
      },
    });
  }
}

export const tierGrowthTracker = new TierGrowthTracker();
