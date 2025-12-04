/**
 * Tests for KeywordMatcher (PERF-001 validation)
 *
 * Validates:
 * - O(1) matching performance
 * - Correct category detection
 * - Exclusion pattern handling
 * - Large corpus performance
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { KeywordMatcher } from '../../workers/keyword-matcher.js';

describe('KeywordMatcher', () => {
  let matcher: KeywordMatcher;

  beforeAll(() => {
    matcher = new KeywordMatcher();
  });

  describe('matches()', () => {
    it('should match direct hangover terms', () => {
      expect(matcher.matches('I am so hungover right now')).toBe(true);
      expect(matcher.matches('worst hangover of my life')).toBe(true);
      expect(matcher.matches('morning after drinking')).toBe(true);
    });

    it('should match physical symptoms', () => {
      expect(matcher.matches('I have a splitting headache')).toBe(true);
      expect(matcher.matches('feeling so nauseous')).toBe(true);
      expect(matcher.matches('throwing up all morning')).toBe(true);
    });

    it('should match cognitive/emotional terms', () => {
      expect(matcher.matches('experiencing major hangxiety')).toBe(true);
      expect(matcher.matches('feeling regret about last night')).toBe(true);
    });

    it('should match recovery intent', () => {
      expect(matcher.matches('need a hangover cure ASAP')).toBe(true);
      expect(matcher.matches('how to recover from drinking')).toBe(true);
    });

    it('should match slang terms', () => {
      expect(matcher.matches('I was so wasted last night')).toBe(true);
      expect(matcher.matches('got absolutely hammered')).toBe(true);
    });

    it('should match meme language', () => {
      expect(matcher.matches('I am down bad right now')).toBe(true);
      expect(matcher.matches('send help please')).toBe(true);
    });

    it('should NOT match unrelated content', () => {
      expect(matcher.matches('I love pizza and tacos')).toBe(false);
      expect(matcher.matches('weather is nice today')).toBe(false);
      expect(matcher.matches('working on my project')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(matcher.matches('HUNGOVER')).toBe(true);
      expect(matcher.matches('HuNgOvEr')).toBe(true);
      expect(matcher.matches('Hangover')).toBe(true);
    });

    it('should match whole words only', () => {
      expect(matcher.matches('I feel hungover')).toBe(true);
      expect(matcher.matches('rehungover is not a word')).toBe(false);
      expect(matcher.matches('hungoverish')).toBe(false);
    });
  });

  describe('getMatches()', () => {
    it('should return detailed match information', () => {
      const result = matcher.getMatches('I am so hungover with a splitting headache');

      expect(result.matched).toBe(true);
      expect(result.categories).toContain('direct_hangover');
      expect(result.categories).toContain('physical_symptoms_primary');
      expect(result.matches.length).toBeGreaterThan(0);
    });

    it('should detect multiple categories', () => {
      const result = matcher.getMatches(
        'Woke up hungover, nauseous, and experiencing hangxiety'
      );

      expect(result.matched).toBe(true);
      expect(result.categories).toContain('direct_hangover');
      expect(result.categories).toContain('physical_symptoms_primary');
      expect(result.categories).toContain('cognitive_emotional');
    });

    it('should return empty result for no matches', () => {
      const result = matcher.getMatches('This is unrelated content');

      expect(result.matched).toBe(false);
      expect(result.categories).toEqual([]);
      expect(result.matches).toEqual([]);
    });

    it('should detect exclusion patterns', () => {
      const result = matcher.getMatches(
        'I love The Hangover movie with Bradley Cooper'
      );

      expect(result.hasExclusion).toBe(true);
    });

    it('should flag medical disclaimer requirements', () => {
      const result = matcher.getMatches(
        'This is a medical emergency and I need hospital care'
      );

      expect(result.requiresMedicalDisclaimer).toBe(true);
    });
  });

  describe('Performance (PERF-001)', () => {
    it('should match quickly on large corpus', () => {
      // Generate large text corpus
      const largeText = Array(1000)
        .fill('This is random text that does not match. ')
        .join('');

      const start = performance.now();
      const result = matcher.matches(largeText);
      const duration = performance.now() - start;

      expect(result).toBe(false);
      expect(duration).toBeLessThan(10); // Should complete in <10ms
    });

    it('should handle multiple matches in large text efficiently', () => {
      const largeText =
        'Some filler text. ' +
        Array(100)
          .fill(
            'I am hungover. I have a headache. I feel nauseous. I need help. '
          )
          .join('') +
        'More filler text.';

      const start = performance.now();
      const result = matcher.getMatches(largeText);
      const duration = performance.now() - start;

      expect(result.matched).toBe(true);
      expect(result.categories.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(20); // Should complete in <20ms
    });
  });

  describe('getPriority()', () => {
    it('should return highest priority from matched categories', () => {
      const result = matcher.getMatches('I am hungover'); // direct_hangover = priority 1
      const priority = matcher.getPriority(result);

      expect(priority).toBe(1);
    });

    it('should return 0 for no matches', () => {
      const result = matcher.getMatches('unrelated content');
      const priority = matcher.getPriority(result);

      expect(priority).toBe(0);
    });
  });

  describe('getStats()', () => {
    it('should return configuration statistics', () => {
      const stats = matcher.getStats();

      expect(stats.totalTerms).toBeGreaterThan(200); // 204+ terms
      expect(stats.totalCategories).toBe(9);
      expect(stats.exclusionPatterns).toBeGreaterThan(0);
      expect(stats.version).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(matcher.matches('')).toBe(false);
    });

    it('should handle very long strings', () => {
      const veryLongText = 'unrelated '.repeat(10000) + ' hungover';
      expect(matcher.matches(veryLongText)).toBe(true);
    });

    it('should handle special characters', () => {
      expect(matcher.matches('I am #hungover @everyone!!!')).toBe(true);
    });

    it('should handle unicode characters', () => {
      expect(matcher.matches('I feel hungover 😵‍💫')).toBe(true);
    });

    it('should handle newlines and tabs', () => {
      expect(matcher.matches('I am\nhungover\ttoday')).toBe(true);
    });
  });
});
