import type { Author } from '@prisma/client';

const FOLLOWER_THRESHOLD = 50_000;
const HIGH_CONFIDENCE_THRESHOLD = 250_000;

export interface PowerUserSignal {
  isPowerUser: boolean;
  confidence: number;
  tier?: string;
}

export class PowerUserDetector {
  async detectPowerUser(author: Author): Promise<PowerUserSignal> {
    const baseConfidence = author.isPowerUser ? 0.95 : 0.5;
    const followerConfidence = Math.min(author.followerCount / HIGH_CONFIDENCE_THRESHOLD, 1);
    const confidence = Math.min(1, baseConfidence + followerConfidence * 0.25);
    const isPowerUser = author.isPowerUser || author.followerCount >= FOLLOWER_THRESHOLD;

    return {
      isPowerUser,
      confidence,
      tier: isPowerUser ? this.guessTier(author.followerCount) : undefined,
    };
  }

  private guessTier(followers: number): string {
    if (followers >= 1_000_000) return 'mega';
    if (followers >= 500_000) return 'macro';
    if (followers >= 100_000) return 'mid';
    return 'micro';
  }
}

const detector = new PowerUserDetector();

export const detectPowerUser = (author: Author): Promise<PowerUserSignal> =>
  detector.detectPowerUser(author);
