/**
 * Tier 2 Spam Filter: Permissive by default, catches obvious spam.
 * Filters out media references, crypto spam, and brand/influencer content.
 */

import { logger } from '../utils/logger.js';

export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface AuthorMetadata {
  isVerified?: boolean;
  followerCount?: number;
}

export class SpamFilter {
  private mediaPatterns: RegExp;
  private cryptoPatterns: RegExp;

  // Tier 2: Permissive thresholds
  private readonly VERIFIED_FOLLOWER_THRESHOLD = 50_000;
  private readonly CRYPTO_CONFIDENCE = 'high';
  private readonly MEDIA_CONFIDENCE = 'medium';
  private readonly INFLUENCER_CONFIDENCE = 'high';

  constructor() {
    // The Hangover movie/soundtrack references
    const mediaTerms = [
      'the hangover movie',
      'hangover soundtrack',
      'hangover cast',
      'bradley cooper',
      'zach galifianakis',
      'ed helms',
      'hangover 2',
      'hangover 3',
      'hangover part',
      'hangover film',
      'alan garner',
      'phil wenneck',
      'stu price',
      'doug billings',
      'mr\\. chow',
    ];

    this.mediaPatterns = new RegExp(
      `\\b(${mediaTerms.join('|')})\\b`,
      'i'
    );

    // Crypto/scam patterns
    const cryptoTerms = [
      'bitcoin',
      'btc',
      'ethereum',
      'eth',
      'crypto',
      'cryptocurrency',
      'airdrop',
      'nft',
      'token',
      'presale',
      'pump',
      'moon',
      'lambo',
      'to the moon',
      'buy now',
      'investment opportunity',
      'guaranteed returns',
      'click here',
      'link in bio',
      'dm for more',
      'check out my',
      'follow me for',
      'giveaway',
      'free money',
      'earn \\$',
      'make money',
      'work from home',
    ];

    this.cryptoPatterns = new RegExp(
      `\\b(${cryptoTerms.join('|')})\\b`,
      'i'
    );

    logger.info('SpamFilter (Tier 2) initialized with permissive thresholds');
  }

  /**
   * Check if content is spam
   */
  check(content: string, author?: AuthorMetadata): SpamCheckResult {
    // Check for media references (The Hangover movie)
    if (this.mediaPatterns.test(content)) {
      return {
        isSpam: true,
        reason: 'Media reference (The Hangover movie/soundtrack)',
        confidence: this.MEDIA_CONFIDENCE,
      };
    }

    // Check for crypto/scam patterns
    if (this.cryptoPatterns.test(content)) {
      return {
        isSpam: true,
        reason: 'Crypto/promotional spam detected',
        confidence: this.CRYPTO_CONFIDENCE,
      };
    }

    // Check for brand/influencer content (verified + high follower count)
    if (author?.isVerified && author.followerCount !== undefined) {
      if (author.followerCount > this.VERIFIED_FOLLOWER_THRESHOLD) {
        return {
          isSpam: true,
          reason: `Brand/influencer account (${author.followerCount.toLocaleString()} followers)`,
          confidence: this.INFLUENCER_CONFIDENCE,
        };
      }
    }

    // Permissive: Pass everything else
    return {
      isSpam: false,
      confidence: 'low',
    };
  }

  /**
   * Batch check for multiple posts
   */
  checkBatch(
    posts: Array<{ content: string; author?: AuthorMetadata }>
  ): SpamCheckResult[] {
    return posts.map((post) => this.check(post.content, post.author));
  }

  /**
   * Get filter statistics
   */
  getStats(): {
    tier: number;
    strategy: string;
    verifiedFollowerThreshold: number;
    patterns: {
      media: boolean;
      crypto: boolean;
      influencer: boolean;
    };
  } {
    return {
      tier: 2,
      strategy: 'permissive',
      verifiedFollowerThreshold: this.VERIFIED_FOLLOWER_THRESHOLD,
      patterns: {
        media: true,
        crypto: true,
        influencer: true,
      },
    };
  }
}

// Export singleton instance
export const spamFilter = new SpamFilter();
