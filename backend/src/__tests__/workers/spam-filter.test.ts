/**
 * Tests for SpamFilter (Tier 2)
 *
 * Validates:
 * - Media reference filtering (The Hangover movie)
 * - Crypto/promotional spam detection
 * - Brand/influencer filtering (verified + high follower count)
 * - Permissive-by-default behavior
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SpamFilter } from '../../workers/spam-filter.js';
import type { AuthorMetadata } from '../../workers/spam-filter.js';

describe('SpamFilter', () => {
  let filter: SpamFilter;

  beforeAll(() => {
    filter = new SpamFilter();
  });

  describe('Media References', () => {
    it('should detect The Hangover movie references', () => {
      const testCases = [
        'Just watched The Hangover movie again!',
        'Bradley Cooper was great in that film',
        'The Hangover 2 is coming out soon',
        'Love the Hangover soundtrack',
        'Zach Galifianakis is hilarious',
        'Ed Helms killed it in The Hangover',
      ];

      testCases.forEach((content) => {
        const result = filter.check(content);
        expect(result.isSpam).toBe(true);
        expect(result.reason).toContain('Media reference');
        expect(result.confidence).toBe('medium');
      });
    });

    it('should NOT flag actual hangover experiences', () => {
      const testCases = [
        'I have the worst hangover right now',
        'Hungover and need help',
        'This hangover is killing me',
      ];

      testCases.forEach((content) => {
        const result = filter.check(content);
        expect(result.isSpam).toBe(false);
      });
    });
  });

  describe('Crypto/Promotional Spam', () => {
    it('should detect crypto spam', () => {
      const testCases = [
        'Check out this Bitcoin opportunity!',
        'New crypto airdrop available',
        'Ethereum to the moon 🚀',
        'NFT presale happening now',
        'Join our token launch',
      ];

      testCases.forEach((content) => {
        const result = filter.check(content);
        expect(result.isSpam).toBe(true);
        expect(result.reason).toContain('Crypto');
        expect(result.confidence).toBe('high');
      });
    });

    it('should detect promotional spam patterns', () => {
      const testCases = [
        'Click here for free money!',
        'Link in bio for more info',
        'DM for more details',
        'Check out my profile for investment tips',
        'Follow me for guaranteed returns',
      ];

      testCases.forEach((content) => {
        const result = filter.check(content);
        expect(result.isSpam).toBe(true);
        expect(result.reason).toContain('Crypto');
      });
    });
  });

  describe('Brand/Influencer Filtering', () => {
    it('should block verified accounts with >50k followers', () => {
      const content = 'Woke up feeling terrible after last night';
      const author: AuthorMetadata = {
        isVerified: true,
        followerCount: 100_000,
      };

      const result = filter.check(content, author);

      expect(result.isSpam).toBe(true);
      expect(result.reason).toContain('Brand/influencer');
      expect(result.reason).toContain('100,000');
      expect(result.confidence).toBe('high');
    });

    it('should block verified accounts with exactly 50,001 followers', () => {
      const content = 'Hangover hitting hard today';
      const author: AuthorMetadata = {
        isVerified: true,
        followerCount: 50_001,
      };

      const result = filter.check(content, author);

      expect(result.isSpam).toBe(true);
      expect(result.reason).toContain('Brand/influencer');
    });

    it('should allow verified accounts with <=50k followers', () => {
      const content = 'I am so hungover right now';
      const author: AuthorMetadata = {
        isVerified: true,
        followerCount: 50_000,
      };

      const result = filter.check(content, author);

      expect(result.isSpam).toBe(false);
    });

    it('should allow verified accounts with low follower counts', () => {
      const content = 'Worst hangover ever';
      const author: AuthorMetadata = {
        isVerified: true,
        followerCount: 1_000,
      };

      const result = filter.check(content, author);

      expect(result.isSpam).toBe(false);
    });

    it('should allow non-verified accounts regardless of follower count', () => {
      const content = 'Feeling so hungover today';
      const author: AuthorMetadata = {
        isVerified: false,
        followerCount: 500_000,
      };

      const result = filter.check(content, author);

      expect(result.isSpam).toBe(false);
    });

    it('should allow when author metadata is missing', () => {
      const content = 'Terrible hangover this morning';

      const result = filter.check(content);

      expect(result.isSpam).toBe(false);
    });

    it('should allow when isVerified is undefined but followerCount is high', () => {
      const content = 'Hangover cure needed ASAP';
      const author: AuthorMetadata = {
        followerCount: 100_000,
      };

      const result = filter.check(content, author);

      expect(result.isSpam).toBe(false);
    });

    it('should allow when followerCount is undefined', () => {
      const content = 'I need help with this hangover';
      const author: AuthorMetadata = {
        isVerified: true,
      };

      const result = filter.check(content, author);

      expect(result.isSpam).toBe(false);
    });
  });

  describe('Permissive Behavior', () => {
    it('should pass legitimate hangover content', () => {
      const testCases = [
        'I am so hungover right now',
        'Worst headache ever after last night',
        'Need a hangover cure fast',
        'Feeling nauseous and terrible',
        'Experiencing major hangxiety today',
      ];

      testCases.forEach((content) => {
        const result = filter.check(content);
        expect(result.isSpam).toBe(false);
        expect(result.confidence).toBe('low');
      });
    });

    it('should pass content that is borderline', () => {
      const testCases = [
        'Anyone else feel like death this morning?',
        'Last night was wild, paying for it now',
        'Regret everything about yesterday',
      ];

      testCases.forEach((content) => {
        const result = filter.check(content);
        expect(result.isSpam).toBe(false);
      });
    });
  });

  describe('Combined Scenarios', () => {
    it('should prioritize media/crypto patterns over influencer status', () => {
      const content = 'Just rewatched The Hangover movie';
      const author: AuthorMetadata = {
        isVerified: false,
        followerCount: 100,
      };

      const result = filter.check(content, author);

      expect(result.isSpam).toBe(true);
      expect(result.reason).toContain('Media reference');
    });

    it('should detect crypto spam even from verified influencers', () => {
      const content = 'Bitcoin investment opportunity!';
      const author: AuthorMetadata = {
        isVerified: true,
        followerCount: 200_000,
      };

      const result = filter.check(content, author);

      expect(result.isSpam).toBe(true);
      expect(result.reason).toContain('Crypto');
    });
  });

  describe('Batch Processing', () => {
    it('should correctly process multiple posts', () => {
      const posts = [
        { content: 'I am hungover', author: undefined },
        { content: 'Bitcoin to the moon', author: undefined },
        {
          content: 'Feeling terrible',
          author: { isVerified: true, followerCount: 100_000 } as AuthorMetadata,
        },
      ];

      const results = filter.checkBatch(posts);

      expect(results).toHaveLength(3);
      expect(results[0]?.isSpam).toBe(false);
      expect(results[1]?.isSpam).toBe(true);
      expect(results[2]?.isSpam).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should return correct filter stats', () => {
      const stats = filter.getStats();

      expect(stats.tier).toBe(2);
      expect(stats.strategy).toBe('permissive');
      expect(stats.verifiedFollowerThreshold).toBe(50_000);
      expect(stats.patterns.media).toBe(true);
      expect(stats.patterns.crypto).toBe(true);
      expect(stats.patterns.influencer).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const result = filter.check('');
      expect(result.isSpam).toBe(false);
    });

    it('should handle very long content', () => {
      const longContent = 'I am hungover. '.repeat(1000);
      const result = filter.check(longContent);
      expect(result.isSpam).toBe(false);
    });

    it('should be case-insensitive for pattern matching', () => {
      expect(filter.check('BITCOIN').isSpam).toBe(true);
      expect(filter.check('BiTcOiN').isSpam).toBe(true);
      expect(filter.check('THE HANGOVER MOVIE').isSpam).toBe(true);
    });

    it('should handle zero followers', () => {
      const author: AuthorMetadata = {
        isVerified: true,
        followerCount: 0,
      };

      const result = filter.check('Hungover today', author);
      expect(result.isSpam).toBe(false);
    });

    it('should handle negative follower counts gracefully', () => {
      const author: AuthorMetadata = {
        isVerified: true,
        followerCount: -1,
      };

      const result = filter.check('Feeling terrible', author);
      expect(result.isSpam).toBe(false);
    });
  });
});
