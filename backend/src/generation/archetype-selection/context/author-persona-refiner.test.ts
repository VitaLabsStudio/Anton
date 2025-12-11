/**
 * Tests for AuthorPersonaRefiner
 * Story 2.10: Task 1, Subtask 3
 *
 * Note: These tests verify the graceful degradation behavior when Story 2.2
 * author detection is unavailable (e.g., in test environment without database).
 * Full integration tests with real AuthorContextAnalyzer will be in integration test suite.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { AuthorPersonaRefiner } from './author-persona-refiner';

describe('AuthorPersonaRefiner', () => {
  let refiner: AuthorPersonaRefiner;

  beforeEach(() => {
    refiner = new AuthorPersonaRefiner();
  });

  describe('derivePersona()', () => {
    it('should return valid persona profile (graceful degradation)', async () => {
      // Act
      const profile = await refiner.derivePersona('author-123', 'reddit', '@testuser');

      // Assert
      expect(profile).toBeDefined();
      expect(profile.primaryPersona).toBeDefined();
      expect(profile.receptiveness).toBeGreaterThanOrEqual(0);
      expect(profile.receptiveness).toBeLessThanOrEqual(1);
      expect(profile.relationshipStage).toBeDefined();
      expect(profile.followerTier).toBeDefined();
      expect(profile.timestamp).toBeInstanceOf(Date);
      // Note: In test environment without database, analyzer fails gracefully
      // and returns default persona profile
    });

    it('should handle twitter platform', async () => {
      // Act
      const profile = await refiner.derivePersona('author-123', 'twitter');

      // Assert
      expect(profile).toBeDefined();
      expect(profile.primaryPersona).toBeDefined();
    });

    it('should handle reddit platform', async () => {
      // Act
      const profile = await refiner.derivePersona('author-456', 'reddit');

      // Assert
      expect(profile).toBeDefined();
      expect(profile.primaryPersona).toBeDefined();
    });

    it('should handle threads platform', async () => {
      // Act
      const profile = await refiner.derivePersona('author-789', 'threads');

      // Assert
      expect(profile).toBeDefined();
      expect(profile.primaryPersona).toBeDefined();
    });

    it('should set follower tier (currently defaults to nano)', async () => {
      // Act
      const profile = await refiner.derivePersona('author-123', 'twitter');

      // Assert
      expect(profile.followerTier).toBe('nano'); // Default until API integration
    });

    it('should handle missing handle gracefully', async () => {
      // Act
      const profile = await refiner.derivePersona('author-123', 'reddit');

      // Assert
      expect(profile).toBeDefined();
      expect(profile.primaryPersona).toBeDefined();
    });

    it('should respect disabled Story 2.2 integration', async () => {
      // Arrange
      const refinerDisabled = new AuthorPersonaRefiner({ enableStory2_2Integration: false });

      // Act
      const profile = await refinerDisabled.derivePersona('author-123', 'reddit');

      // Assert
      expect(profile).toBeDefined();
      expect(profile.primaryPersona).toBe('unknown');
      expect(profile.confidence).toBe(0.2); // Default
    });

    it('should set isPowerUser to false (until Story 2.11)', async () => {
      // Act
      const profile = await refiner.derivePersona('author-123', 'twitter');

      // Assert
      expect(profile.isPowerUser).toBe(false);
      expect(profile.topPerformingArchetype).toBeUndefined();
    });

    it('should complete persona derivation within reasonable time', async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      await refiner.derivePersona('author-123', 'reddit');
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(2000); // Should complete in < 2 seconds (allows for DB timeout)
    });

    it('should always return valid relationship stage', async () => {
      // Act
      const profile = await refiner.derivePersona('author-123', 'twitter');

      // Assert
      const validStages = ['first_contact', 'aware', 'engaged', 'advocate'];
      expect(validStages).toContain(profile.relationshipStage);
    });

    it('should always return receptiveness in valid range', async () => {
      // Act
      const profile = await refiner.derivePersona('author-123', 'reddit');

      // Assert
      expect(profile.receptiveness).toBeGreaterThanOrEqual(0);
      expect(profile.receptiveness).toBeLessThanOrEqual(1);
    });
  });
});
