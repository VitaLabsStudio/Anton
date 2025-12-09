/**
 * Integration tests for Archetype Selection Engine
 * Story 2.10: End-to-end pipeline validation
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { ArchetypeSelector } from '../archetype-selector';
import type { DecisionSignals } from '../types';

describe('Archetype Selection Engine - Integration', () => {
  let selector: ArchetypeSelector;

  beforeEach(() => {
    selector = new ArchetypeSelector();
  });

  describe('Complete pipeline', () => {
    it('should select archetype for HELPFUL mode', async () => {
      // Arrange
      const signals: DecisionSignals = {
        postId: 'test-post-1',
        mode: 'HELPFUL',
        modeConfidence: 0.85,
        platform: 'reddit',
        authorId: 'author-123',
        timestamp: new Date().toISOString(),
      };

      // Act
      const selection = await selector.selectArchetype(signals);

      // Assert
      expect(selection).toBeDefined();
      expect(selection.archetype).toBeDefined();
      expect(selection.confidence).toBeGreaterThan(0);
      expect(selection.confidence).toBeLessThanOrEqual(1);
      expect(selection.reason).toBeDefined();
      expect(selection.factorBreakdown).toBeDefined();
      expect(selection.timestamp).toBeInstanceOf(Date);
    });

    it('should select archetype for ENGAGEMENT mode', async () => {
      // Arrange
      const signals: DecisionSignals = {
        postId: 'test-post-2',
        mode: 'ENGAGEMENT',
        modeConfidence: 0.9,
        platform: 'twitter',
        timestamp: new Date().toISOString(),
      };

      // Act
      const selection = await selector.selectArchetype(signals);

      // Assert
      expect(selection).toBeDefined();
      expect(selection.archetype).toBeDefined();
    });

    it('should handle thread context', async () => {
      // Arrange
      const signals: DecisionSignals = {
        postId: 'test-post-3',
        mode: 'HYBRID',
        modeConfidence: 0.75,
        platform: 'reddit',
        threadContext: {
          depth: 15,
          participantCount: 8,
        },
        timestamp: new Date().toISOString(),
      };

      // Act
      const selection = await selector.selectArchetype(signals);

      // Assert
      expect(selection).toBeDefined();
      expect(selection.archetype).toBeDefined();
    });

    it('should handle competitor signals', async () => {
      // Arrange
      const signals: DecisionSignals = {
        postId: 'test-post-4',
        mode: 'HELPFUL',
        modeConfidence: 0.8,
        platform: 'twitter',
        competitorSignals: {
          detected: true,
          handles: ['@competitor1'],
        },
        timestamp: new Date().toISOString(),
      };

      // Act
      const selection = await selector.selectArchetype(signals);

      // Assert
      expect(selection).toBeDefined();
      expect(selection.archetype).toBeDefined();
    });

    it('should complete selection within performance target', async () => {
      // Arrange
      const signals: DecisionSignals = {
        postId: 'test-post-5',
        mode: 'HELPFUL',
        modeConfidence: 0.8,
        platform: 'reddit',
        timestamp: new Date().toISOString(),
      };
      const startTime = Date.now();

      // Act
      await selector.selectArchetype(signals);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(2000); // P95 < 450ms target, allowing for test environment
    });

    it('should include alternatives in selection', async () => {
      // Arrange
      const signals: DecisionSignals = {
        postId: 'test-post-6',
        mode: 'ENGAGEMENT',
        modeConfidence: 0.85,
        platform: 'threads',
        timestamp: new Date().toISOString(),
      };

      // Act
      const selection = await selector.selectArchetype(signals);

      // Assert
      expect(selection.alternatives).toBeDefined();
      expect(Array.isArray(selection.alternatives)).toBe(true);
    });

    it('should include temperature in selection', async () => {
      // Arrange
      const signals: DecisionSignals = {
        postId: 'test-post-7',
        mode: 'HELPFUL',
        modeConfidence: 0.9,
        platform: 'reddit',
        timestamp: new Date().toISOString(),
      };

      // Act
      const selection = await selector.selectArchetype(signals);

      // Assert
      expect(selection.temperature).toBeDefined();
      expect(selection.temperature).toBeGreaterThanOrEqual(0);
      expect(selection.temperature).toBeLessThanOrEqual(1.5);
    });

    it('should include factor breakdown', async () => {
      // Arrange
      const signals: DecisionSignals = {
        postId: 'test-post-8',
        mode: 'HYBRID',
        modeConfidence: 0.82,
        platform: 'twitter',
        timestamp: new Date().toISOString(),
      };

      // Act
      const selection = await selector.selectArchetype(signals);

      // Assert
      expect(selection.factorBreakdown).toBeDefined();
      expect(typeof selection.factorBreakdown).toBe('object');
    });

    it('should handle all platforms', async () => {
      // Arrange
      const platforms: Array<'twitter' | 'reddit' | 'threads'> = ['twitter', 'reddit', 'threads'];

      // Act & Assert
      for (const platform of platforms) {
        const signals: DecisionSignals = {
          postId: `test-${platform}`,
          mode: 'HELPFUL',
          modeConfidence: 0.8,
          platform,
          timestamp: new Date().toISOString(),
        };

        const selection = await selector.selectArchetype(signals);
        expect(selection).toBeDefined();
        expect(selection.archetype).toBeDefined();
      }
    });

    it('should handle all operational modes', async () => {
      // Arrange
      const modes: Array<'HELPFUL' | 'ENGAGEMENT' | 'HYBRID' | 'DISENGAGED'> = [
        'HELPFUL',
        'ENGAGEMENT',
        'HYBRID',
        'DISENGAGED',
      ];

      // Act & Assert
      for (const mode of modes) {
        const signals: DecisionSignals = {
          postId: `test-${mode}`,
          mode,
          modeConfidence: 0.8,
          platform: 'reddit',
          timestamp: new Date().toISOString(),
        };

        const selection = await selector.selectArchetype(signals);
        expect(selection).toBeDefined();
        expect(selection.archetype).toBeDefined();
      }
    });
  });

  describe('Graceful degradation', () => {
    it('should handle missing author ID gracefully', async () => {
      // Arrange
      const signals: DecisionSignals = {
        postId: 'test-no-author',
        mode: 'HELPFUL',
        modeConfidence: 0.8,
        platform: 'reddit',
        timestamp: new Date().toISOString(),
      };

      // Act
      const selection = await selector.selectArchetype(signals);

      // Assert
      expect(selection).toBeDefined();
      expect(selection.archetype).toBeDefined();
    });

    it('should handle missing thread context gracefully', async () => {
      // Arrange
      const signals: DecisionSignals = {
        postId: 'test-no-thread',
        mode: 'HELPFUL',
        modeConfidence: 0.8,
        platform: 'reddit',
        timestamp: new Date().toISOString(),
      };

      // Act
      const selection = await selector.selectArchetype(signals);

      // Assert
      expect(selection).toBeDefined();
      expect(selection.archetype).toBeDefined();
    });

    it('should never throw errors', async () => {
      // Arrange
      const signals: DecisionSignals = {
        postId: 'test-robust',
        mode: 'HELPFUL',
        modeConfidence: 0.8,
        platform: 'reddit',
        timestamp: new Date().toISOString(),
      };

      // Act & Assert
      await expect(selector.selectArchetype(signals)).resolves.toBeDefined();
    });
  });
});
