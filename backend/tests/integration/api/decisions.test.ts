import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/utils/prisma.js', () => {
  const findMany = vi.fn(async () => [
    {
      id: 'dec-1',
      postId: 'post-1',
      post: { platform: 'TWITTER' },
      mode: 'HELPFUL',
      sssScore: 0.9,
      arsScore: 0.8,
      evsScore: 5.0,
      trsScore: 0.8,
      compositeScore: 0.85,
      compositeCredibleIntervalLower: 0.7,
      compositeCredibleIntervalUpper: 0.9,
      modeConfidence: 0.85,
      modeProbabilities: { HELPFUL: 0.85, ENGAGEMENT: 0.1, HYBRID: 0.05, DISENGAGED: 0 },
      segmentUsed: 'GLOBAL_DEFAULT',
      competitorDetected: 'Acme',
      archetype: { id: 'arch-1', name: 'helper' },
      needsReview: false,
      reviewReason: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
    },
  ]);
  const count = vi.fn(async () => 1);
  return {
    prisma: {
      decision: {
        findMany,
        count,
      },
    },
  };
});

import { decisionsRouter } from '../../../src/api/routes/decisions.js';
import { prisma } from '../../../src/utils/prisma.js';

describe('GET /api/decisions', () => {
  it('applies filters and returns pagination + interval', async () => {
    const from = '2025-01-01T00:00:00.000Z';
    const to = '2025-01-02T00:00:00.000Z';
    const request = new Request(
      `http://localhost/?platform=TWITTER&mode=HELPFUL&needsReview=true&from=${from}&to=${to}&page=2&perPage=5`
    );
    const response = await decisionsRouter.fetch(request);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.filters.platform).toBe('TWITTER');
    expect(payload.filters.needsReview).toBe('true');
    expect(payload.filters.mode).toBe('HELPFUL');
    expect(payload.filters.from).toBe(new Date(from).toISOString());
    expect(payload.filters.to).toBe(new Date(to).toISOString());
    expect(payload.pagination).toEqual({ page: 2, perPage: 5, total: 1 });
    expect(Array.isArray(payload.items)).toBe(true);

    const decision = payload.items[0];
    expect(decision.compositeCredibleInterval).toHaveLength(2);
    expect(typeof decision.modeConfidence).toBe('number');
    expect(Object.keys(decision.modeProbabilities)).toEqual(
      expect.arrayContaining(['HELPFUL', 'ENGAGEMENT', 'HYBRID', 'DISENGAGED'])
    );
    expect(decision.segmentUsed).toBe('GLOBAL_DEFAULT');
    expect(decision.competitorDetected).toBe('Acme');
    expect(decision.archetype).toEqual({ id: 'arch-1', name: 'helper' });
    expect(decision.needsReview).toBe(false);
    expect(decision.platform).toBe('TWITTER');

    const decisionMock = vi.mocked(prisma).decision;
    const findManyCall = decisionMock.findMany.mock.calls[0][0];
    expect(findManyCall.where.mode).toBe('HELPFUL');
    expect(findManyCall.where.needsReview).toBe(true);
    expect(findManyCall.where.post?.platform).toBe('TWITTER');
    expect(findManyCall.where.createdAt?.gte?.toISOString()).toBe(new Date(from).toISOString());
    expect(findManyCall.where.createdAt?.lte?.toISOString()).toBe(new Date(to).toISOString());
    expect(findManyCall.skip).toBe(5);
    expect(findManyCall.take).toBe(5);

    expect(decisionMock.count).toHaveBeenCalledTimes(1);
    const countCall = decisionMock.count.mock.calls[0][0];
    expect(countCall.where).toEqual(findManyCall.where);
  });
});
