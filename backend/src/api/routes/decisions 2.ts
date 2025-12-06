import { Hono } from 'hono';
import type { DecisionMode, Platform, Prisma } from '@prisma/client';

import { prisma } from '../../utils/prisma.js';

const decisionsRouter = new Hono();

const parseBoolean = (value?: string) => {
  if (value === undefined) return undefined;
  return ['1', 'true', 'yes'].includes(value.toLowerCase());
};

decisionsRouter.get('/', async (c) => {
  const query = c.req.query() as Record<string, string | undefined>;
  const { platform, mode, needsReview, from, to, page, perPage } = query;

  const pageNumber = Math.max(1, Number(page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(perPage ?? 20)));

  const fromDate =
    from && !Number.isNaN(Date.parse(from))
      ? new Date(from)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const toDate = to && !Number.isNaN(Date.parse(to)) ? new Date(to) : new Date();

  const needsReviewValue = parseBoolean(needsReview);

  const where: Prisma.DecisionWhereInput = {
    ...(mode ? { mode: mode as DecisionMode } : {}),
    ...(needsReviewValue !== undefined ? { needsReview: needsReviewValue } : {}),
    ...(platform ? { post: { platform: platform as Platform } } : {}),
    createdAt: {
      gte: fromDate,
      lte: toDate,
    },
  };

  const [items, total] = await Promise.all([
    prisma.decision.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        postId: true,
        mode: true,
        post: {
          select: {
            platform: true,
          },
        },
        sssScore: true,
        arsScore: true,
        evsScore: true,
        trsScore: true,
        compositeScore: true,
        compositeCredibleIntervalLower: true,
        compositeCredibleIntervalUpper: true,
        modeConfidence: true,
        modeProbabilities: true,
        segmentUsed: true,
        competitorDetected: true,
        archetype: { select: { id: true, name: true } },
        needsReview: true,
        reviewReason: true,
        createdAt: true,
      },
    }),
    prisma.decision.count({ where }),
  ]);

  const data = items.map((decision) => ({
    id: decision.id,
    postId: decision.postId,
    platform: decision.post?.platform ?? null,
    mode: decision.mode,
    scores: {
      sss: decision.sssScore,
      ars: decision.arsScore,
      evs: decision.evsScore,
      trs: decision.trsScore,
      composite: decision.compositeScore,
    },
    compositeCredibleInterval: [
      decision.compositeCredibleIntervalLower,
      decision.compositeCredibleIntervalUpper,
    ],
    modeConfidence: decision.modeConfidence,
    modeProbabilities: decision.modeProbabilities,
    segmentUsed: decision.segmentUsed,
    competitorDetected: decision.competitorDetected,
    archetype: decision.archetype,
    needsReview: decision.needsReview,
    reviewReason: decision.reviewReason,
    createdAt: decision.createdAt,
  }));

  return c.json({
    filters: {
      platform,
      mode,
      needsReview,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    },
    pagination: {
      page: pageNumber,
      perPage: pageSize,
      total,
    },
    items: data,
  });
});

export { decisionsRouter };
