/**
 * Optimized keyword matcher using a single pre-compiled RegExp.
 * Flattens all 9 categories (204+ terms) into one pattern for O(1) matching.
 *
 * PERF-001 Mitigation: Single-pass regex avoids O(n) loops over term lists.
 */

import keywordsConfig from '../config/keywords.json' with { type: 'json' };
import { logger } from '../utils/logger.js';

export interface KeywordCategory {
  priority: number;
  terms: string[];
}

export interface KeywordConfig {
  categories: Record<string, KeywordCategory>;
  exclusions: {
    spam_patterns: string[];
    medical_disclaimers_required: string[];
  };
  version: string;
  last_updated: string;
}

export interface MatchResult {
  matched: boolean;
  categories: string[];
  matches: string[];
  hasExclusion: boolean;
  requiresMedicalDisclaimer: boolean;
}

export class KeywordMatcher {
  private keywordRegex: RegExp;
  private exclusionRegex: RegExp;
  private medicalDisclaimerRegex: RegExp;
  private categoryPatterns: Map<string, RegExp>;
  private config: KeywordConfig;

  constructor(config?: KeywordConfig) {
    this.config = config ?? (keywordsConfig as KeywordConfig);

    // Flatten all terms from all categories
    const allTerms = Object.values(this.config.categories).flatMap(
      (cat) => cat.terms
    );

    // Escape special regex characters in terms
    const escapedTerms = allTerms.map((term) =>
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );

    // Pre-compile single master regex for O(1) detection
    // Use word boundaries for whole-word matching, case-insensitive
    this.keywordRegex = new RegExp(
      `\\b(${escapedTerms.join('|')})\\b`,
      'i'
    );

    // Pre-compile exclusion patterns
    const escapedExclusions = this.config.exclusions.spam_patterns.map((term) =>
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    this.exclusionRegex = new RegExp(
      `\\b(${escapedExclusions.join('|')})\\b`,
      'i'
    );

    // Pre-compile medical disclaimer patterns
    const escapedMedical = this.config.exclusions.medical_disclaimers_required.map(
      (term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    this.medicalDisclaimerRegex = new RegExp(
      `\\b(${escapedMedical.join('|')})\\b`,
      'i'
    );

    // Pre-compile per-category regexes for detailed category detection
    this.categoryPatterns = new Map();
    for (const [categoryName, category] of Object.entries(
      this.config.categories
    )) {
      const escapedCategoryTerms = category.terms.map((term) =>
        term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      );
      this.categoryPatterns.set(
        categoryName,
        new RegExp(`\\b(${escapedCategoryTerms.join('|')})\\b`, 'i')
      );
    }

    logger.info(
      {
        totalTerms: allTerms.length,
        categories: Object.keys(this.config.categories).length,
        version: this.config.version,
      },
      'KeywordMatcher initialized with pre-compiled RegExp'
    );
  }

  /**
   * Fast O(1) check if content contains any keyword
   */
  matches(content: string): boolean {
    return this.keywordRegex.test(content);
  }

  /**
   * Detailed match with categories and exclusion checks
   */
  getMatches(content: string): MatchResult {
    const matched = this.matches(content);

    if (!matched) {
      return {
        matched: false,
        categories: [],
        matches: [],
        hasExclusion: false,
        requiresMedicalDisclaimer: false,
      };
    }

    // Detect which categories matched
    const matchedCategories: string[] = [];
    const matchedTerms: string[] = [];

    for (const [categoryName, regex] of this.categoryPatterns.entries()) {
      const categoryMatch = content.match(regex);
      if (categoryMatch) {
        matchedCategories.push(categoryName);
        matchedTerms.push(...categoryMatch.slice(1).filter(Boolean));
      }
    }

    // Check exclusions
    const hasExclusion = this.exclusionRegex.test(content);
    const requiresMedicalDisclaimer = this.medicalDisclaimerRegex.test(content);

    return {
      matched: true,
      categories: matchedCategories,
      matches: [...new Set(matchedTerms)], // Deduplicate
      hasExclusion,
      requiresMedicalDisclaimer,
    };
  }

  /**
   * Get category priorities for matched content
   */
  getPriority(matchResult: MatchResult): number {
    if (!matchResult.matched || matchResult.categories.length === 0) {
      return 0;
    }

    // Return highest priority (lowest number) from matched categories
    const priorities = matchResult.categories.map(
      (cat) => this.config.categories[cat]?.priority ?? 999
    );

    return Math.min(...priorities);
  }

  /**
   * Get stats about the matcher configuration
   */
  getStats() {
    const totalTerms = Object.values(this.config.categories).reduce(
      (sum, cat) => sum + cat.terms.length,
      0
    );

    return {
      version: this.config.version,
      lastUpdated: this.config.last_updated,
      totalTerms,
      totalCategories: Object.keys(this.config.categories).length,
      exclusionPatterns: this.config.exclusions.spam_patterns.length,
      medicalPatterns: this.config.exclusions.medical_disclaimers_required.length,
    };
  }
}

// Export singleton instance for reuse across the worker
export const keywordMatcher = new KeywordMatcher();
