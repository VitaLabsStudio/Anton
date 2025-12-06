import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueueProcessor } from '../../../src/services/queue-processor.js';
import { prisma } from '../../../src/utils/prisma.js';
import { decisionEngine } from '../../../src/analysis/decision-engine.js';
import { contextEngine } from '../../../src/analysis/context-intel/service.js';

// Mock prisma
vi.mock('../../../src/utils/prisma.js', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
    },
    decision: {
        updateMany: vi.fn(),
    }
  },
}));

// Mock logger
vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock decision engine
vi.mock('../../../src/analysis/decision-engine.js', () => ({
  decisionEngine: {
    analyzePost: vi.fn(),
  },
}));

// Mock context engine
vi.mock('../../../src/analysis/context-intel/service.js', () => ({
  contextEngine: {
    evaluate: vi.fn(),
  },
}));

describe('QueueProcessor', () => {
  let processor: QueueProcessor;
  const mockPost = {
    id: 'post-1',
    content: 'test content',
    author: { id: 'author-1', handle: 'user1' },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    processor = new QueueProcessor();
    (prisma.post.findMany as any).mockReset();
    (decisionEngine.analyzePost as any).mockReset();
    (contextEngine.evaluate as any).mockReset();
    (prisma.decision.updateMany as any).mockReset();
  });

  afterEach(() => {
    processor.stop();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should trigger context enrichment if score >= 0.65', async () => {
    (prisma.post.findMany as any).mockResolvedValue([mockPost]);
    (decisionEngine.analyzePost as any).mockResolvedValue({
        compositeScore: 0.7,
        isPowerUser: false,
        competitorDetected: null,
    });
    (contextEngine.evaluate as any).mockResolvedValue({
        recommendation: 'PROCEED'
    });

    processor.start();
    await vi.waitFor(() => expect(decisionEngine.analyzePost).toHaveBeenCalled());
    await vi.waitFor(() => expect(contextEngine.evaluate).toHaveBeenCalled());
  });

  it('should NOT trigger context enrichment if score < 0.65', async () => {
    (prisma.post.findMany as any).mockResolvedValue([mockPost]);
    (decisionEngine.analyzePost as any).mockResolvedValue({
        compositeScore: 0.5,
        isPowerUser: false,
        competitorDetected: null,
    });

    processor.start();
    await vi.waitFor(() => expect(decisionEngine.analyzePost).toHaveBeenCalled());
    // Should NOT call contextEngine
    expect(contextEngine.evaluate).not.toHaveBeenCalled();
  });

  it('should handle ABORT recommendation', async () => {
    (prisma.post.findMany as any).mockResolvedValue([mockPost]);
    (decisionEngine.analyzePost as any).mockResolvedValue({
        compositeScore: 0.8,
        isPowerUser: false,
        competitorDetected: null,
    });
    (contextEngine.evaluate as any).mockResolvedValue({
        recommendation: 'ABORT',
        abortReason: 'Safety Risk'
    });

    processor.start();
    await vi.waitFor(() => expect(contextEngine.evaluate).toHaveBeenCalled());
    
    // Should update decision to DISENGAGED
    await vi.waitFor(() => expect(prisma.decision.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { postId: mockPost.id },
            data: expect.objectContaining({ mode: 'DISENGAGED' })
        })
    ));
  });
});
