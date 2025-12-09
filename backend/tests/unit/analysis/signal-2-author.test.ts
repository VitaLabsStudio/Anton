import { Platform } from '@prisma/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { AuthorContextAnalyzer } from '../../../src/analysis/signal-2-author';

const mocks = vi.hoisted(() => ({
  prisma: {
    author: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Prisma
vi.mock('../../../src/utils/prisma', () => ({
  prisma: mocks.prisma,
}));

// Mock Logger
vi.mock('../../../src/utils/logger', () => ({
  logger: mocks.logger,
}));

describe('AuthorContextAnalyzer', () => {
  let analyzer: AuthorContextAnalyzer;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new AuthorContextAnalyzer();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return base score (0.5) for a new author with no history', async () => {
    // Arrange
    const mockAuthor = {
      id: 'author-123',
      platform: Platform.TWITTER,
      platformId: '12345',
      handle: 'newuser',
      relationshipScore: 0.5,
      interactionHistory: [],
      archetypeTags: [],
      displayName: 'New User',
    };

    mocks.prisma.author.upsert.mockResolvedValue(mockAuthor);

    // Act
    const result = await analyzer.analyzeAuthorContext(Platform.TWITTER, '12345', 'newuser');

    // Assert
    expect(mocks.prisma.author.upsert).toHaveBeenCalledWith({
      where: {
        platform_platformId: {
          platform: Platform.TWITTER,
          platformId: '12345',
        },
      },
      update: {
        handle: 'newuser',
        lastSeenAt: expect.any(Date),
      },
      create: {
        platform: Platform.TWITTER,
        platformId: '12345',
        handle: 'newuser',
        relationshipScore: 0.5,
        interactionHistory: [],
        firstSeenAt: expect.any(Date),
        lastSeenAt: expect.any(Date),
      },
    });

    expect(result.score).toBe(0.5);
    expect(result.confidence).toBe(0.5); // Low confidence for new users
    expect(result.interactionCount).toBe(0);
  });

  it('should increase score for positive interactions', async () => {
    // Arrange
    const mockAuthor = {
      id: 'author-123',
      platform: Platform.TWITTER,
      platformId: '12345',
      handle: 'fan',
      relationshipScore: 0.5,
      interactionHistory: [
        { type: 'thanks', timestamp: '2025-01-01' }, // +0.15
        { type: 'click', timestamp: '2025-01-02' }, // +0.10
      ],
      archetypeTags: [],
      displayName: 'Fan',
    };

    mocks.prisma.author.upsert.mockResolvedValue(mockAuthor);

    // Act
    const result = await analyzer.analyzeAuthorContext(Platform.TWITTER, '12345', 'fan');

    // Assert
    // Base 0.5 + 0.15 + 0.10 = 0.75
    expect(result.score).toBeCloseTo(0.75);
    expect(result.confidence).toBe(0.9);
    expect(result.interactionCount).toBe(2);
  });

  it('should decrease score for negative interactions', async () => {
    // Arrange
    const mockAuthor = {
      id: 'author-123',
      platform: Platform.TWITTER,
      platformId: '12345',
      handle: 'hater',
      relationshipScore: 0.5,
      interactionHistory: [
        { type: 'hostile_reply', timestamp: '2025-01-01' }, // -0.20
      ],
      archetypeTags: [],
      displayName: 'Hater',
    };

    mocks.prisma.author.upsert.mockResolvedValue(mockAuthor);

    // Act
    const result = await analyzer.analyzeAuthorContext(Platform.TWITTER, '12345', 'hater');

    // Assert
    // Base 0.5 - 0.20 = 0.30
    expect(result.score).toBeCloseTo(0.3);
  });

  it('should cap score between 0.0 and 1.0', async () => {
    // Test Upper Cap
    const superFan = {
      id: 'author-1',
      platform: Platform.TWITTER,
      platformId: '1',
      handle: 'superfan',
      relationshipScore: 0.5,
      interactionHistory: [
        { type: 'purchase', timestamp: '2025-01-01' }, // +0.25
        { type: 'purchase', timestamp: '2025-01-02' }, // +0.25
        { type: 'purchase', timestamp: '2025-01-03' }, // +0.25 (Total +0.75 => 1.25)
      ],
      archetypeTags: [],
      displayName: 'Super Fan',
    };
    mocks.prisma.author.upsert.mockResolvedValueOnce(superFan);
    let result = await analyzer.analyzeAuthorContext(Platform.TWITTER, '1', 'superfan');
    expect(result.score).toBe(1.0);

    // Test Lower Cap
    const superHater = {
      id: 'author-2',
      platform: Platform.TWITTER,
      platformId: '2',
      handle: 'superhater',
      relationshipScore: 0.5,
      interactionHistory: [
        { type: 'report', timestamp: '2025-01-01' }, // -0.40
        { type: 'report', timestamp: '2025-01-02' }, // -0.40 (Total -0.80 => -0.30)
      ],
      archetypeTags: [],
      displayName: 'Super Hater',
    };
    mocks.prisma.author.upsert.mockResolvedValueOnce(superHater);
    result = await analyzer.analyzeAuthorContext(Platform.TWITTER, '2', 'superhater');
    expect(result.score).toBe(0.0);
  });

  it('should detect archetypes from bio/displayName', async () => {
    // Arrange
    const mockAuthor = {
      id: 'author-doc',
      platform: Platform.TWITTER,
      platformId: '999',
      handle: 'dr_smith',
      relationshipScore: 0.5,
      interactionHistory: [],
      archetypeTags: [], // Initially empty
      displayName: 'Dr. Smith - Family Physician & Dad',
    };

    mocks.prisma.author.upsert.mockResolvedValue(mockAuthor);
    mocks.prisma.author.update.mockResolvedValue(mockAuthor); // Return value doesn't matter much here

    // Act
    const result = await analyzer.analyzeAuthorContext(Platform.TWITTER, '999', 'dr_smith');

    // Assert
    // Should detect 'healthcare_pro' (Physician/Dr) and 'parent' (Dad)
    expect(result.archetypes).toContain('healthcare_pro');
    expect(result.archetypes).toContain('parent');

    // Should call update to save tags
    expect(mocks.prisma.author.update).toHaveBeenCalledWith({
      where: { id: 'author-doc' },
      data: { archetypeTags: expect.arrayContaining(['healthcare_pro', 'parent']) },
    });
  });

  it('should handle database errors gracefully', async () => {
    // Arrange
    mocks.prisma.author.upsert.mockRejectedValue(new Error('Database connection failed'));

    // Act
    const result = await analyzer.analyzeAuthorContext(Platform.TWITTER, 'error', 'error');

    // Assert
    expect(result.score).toBe(0.5); // Default base score
    expect(result.confidence).toBe(0.0);
    expect(mocks.logger.error).toHaveBeenCalled();
  });
});
