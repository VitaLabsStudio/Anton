import type { OperationalMode, Platform, Prisma } from '@prisma/client';
import { Hono, type Context } from 'hono';

import { logger } from '../../utils/logger.js';
import { prisma } from '../../utils/prisma.js';

const decisionsRouter = new Hono();

decisionsRouter.get('/', async (c: Context) => {
  const requestId = c.get('requestId') as string;
  const query = c.req.query() as Record<string, string | undefined>;
  const {
    platform,
    mode,
    startDate,
    endDate,
    limit,
    offset,
    sssMin,
    sssMax,
    arsMin,
    arsMax,
    evsMin,
    evsMax,
    trsMin,
    trsMax,
    compositeMin,
    compositeMax,
  } = query;

  const take = Math.min(100, Math.max(1, Number(limit ?? 20)));
  const skip = Math.max(0, Number(offset ?? 0));

  // Date Defaults
  const toDate = endDate ? new Date(endDate) : new Date();
  const fromDate = startDate
    ? new Date(startDate)
    : new Date(new Date(toDate).setDate(toDate.getDate() - 7));

  // Validate date parsing
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return c.json(
      {
        error: 'Invalid date format for startDate or endDate',
      },
      400
    );
  }

  if (fromDate > toDate) {
    return c.json(
      {
        error: 'startDate must be less than or equal to endDate',
      },
      400
    );
  }

  // Helper for score range validation and construction
  const buildRangeFilter = (
    minStr?: string,
    maxStr?: string,
    fieldName?: string
  ): Prisma.FloatFilter | undefined => {
    if (!minStr && !maxStr) return undefined;

    const min = minStr ? parseFloat(minStr) : undefined;
    const max = maxStr ? parseFloat(maxStr) : undefined;

    if (min !== undefined && (isNaN(min) || min < 0 || min > 1)) {
      throw new Error(`Invalid ${fieldName}Min: must be between 0 and 1`);
    }
    if (max !== undefined && (isNaN(max) || max < 0 || max > 1)) {
      throw new Error(`Invalid ${fieldName}Max: must be between 0 and 1`);
    }
    if (min !== undefined && max !== undefined && min > max) {
      throw new Error(`Invalid range for ${fieldName}: min must be <= max`);
    }

    if (min !== undefined && max !== undefined) return { gte: min, lte: max };
    if (min !== undefined) return { gte: min };
    if (max !== undefined) return { lte: max };
    return undefined;
  };

  let where: Prisma.DecisionWhereInput = {};

  try {
    where = {
      ...(mode ? { mode: mode as OperationalMode } : {}),
      ...(platform ? { platform: platform as Platform } : {}),
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
      ...(sssMin || sssMax ? { sssScore: buildRangeFilter(sssMin, sssMax, 'sss') } : {}),
      ...(arsMin || arsMax ? { arsScore: buildRangeFilter(arsMin, arsMax, 'ars') } : {}),
      ...(evsMin || evsMax ? { evsScore: buildRangeFilter(evsMin, evsMax, 'evs') } : {}),
      ...(trsMin || trsMax ? { trsScore: buildRangeFilter(trsMin, trsMax, 'trs') } : {}),
      ...(compositeMin || compositeMax
        ? { compositeScore: buildRangeFilter(compositeMin, compositeMax, 'composite') }
        : {}),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }

  const start = performance.now();
  const items = await prisma.decision.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take,
    select: {
      id: true,
      createdAt: true,
      mode: true,
      platform: true,
      compositeScore: true,
      sssScore: true,
      arsScore: true,
      evsScore: true,
      trsScore: true,
    },
  });
  const duration = performance.now() - start;

  // Prisma doesn't support count with `take` and `skip` directly on partitioned tables efficiently
  // A separate count query should be used or rely on client-side pagination for large datasets
  // For now, we'll return a basic count of fetched items.
  const total = await prisma.decision.count({ where });

  logger.info(
    {
      requestId,
      filters: {
        platform,
        mode,
        startDate: fromDate.toISOString(),
        endDate: toDate.toISOString(),
      },
      duration: `${duration.toFixed(2)}ms`,
      count: items.length,
    },
    'decisions.search'
  );

  return c.json({
    filters: {
      platform,
      mode,
      startDate: fromDate.toISOString(),
      endDate: toDate.toISOString(),
    },
    pagination: {
      limit: take,
      offset: skip,
      total,
      count: items.length, // Count of items in current page
    },
    items: items.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      mode: item.mode,
      platform: item.platform,
      compositeScore: item.compositeScore,
      scores: {
        sss: item.sssScore,
        ars: item.arsScore,
        evs: item.evsScore,
        trs: item.trsScore,
      },
    })),
  });
});

decisionsRouter.get('/:id', async (c: Context) => {
  const { id } = c.req.param();
  const requestId = c.get('requestId') as string;

  const decision = await prisma.decision.findFirst({
    where: {
      id: id,
      // Since decision.id is not globally unique (only with createdAt), we need to search across partitions.
      // Or, for detail, it implies we know the rough time of creation.
      // However, the API spec only takes `id`. Assuming UUIDs are practically unique, findFirst is acceptable.
      // If performance becomes an issue for partitioned tables, we might need a separate index or
      // to pass createdAt in the URL for detail view as well.
    },
    include: {
      post: {
        select: {
          content: true,
        },
      },
      archetype: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!decision) {
    logger.warn({ decisionId: id, requestId }, 'Decision not found for ID');
    return c.json({ error: 'Decision not found' }, 404);
  }

  // Ref: Response shape in Dev Notes.
  const responseData = {
    id: decision.id,
    mode: decision.mode,
    platform: decision.platform,
    scores: {
      sss: decision.sssScore,
      ars: decision.arsScore,
      evs: decision.evsScore,
      trs: decision.trsScore,
      composite: decision.compositeScore,
    },
    signals: decision.signalsJson,
    post: {
      content: decision.post.content,
    },
    createdAt: decision.createdAt,
    archetype: decision.archetype,
    safetyFlags: decision.safetyFlags,
    temporalContext: decision.temporalContext,
    competitorDetected: decision.competitorDetected,
    isPowerUser: decision.isPowerUser,
    segmentUsed: decision.segmentUsed,
    decisionLogicVersion: decision.decisionLogicVersion,
    needsReview: decision.needsReview,
    reviewReason: decision.reviewReason,
    compositeCredibleIntervalLower: decision.compositeCredibleIntervalLower,
    compositeCredibleIntervalUpper: decision.compositeCredibleIntervalUpper,
    modeConfidence: decision.modeConfidence,
    modeProbabilities: decision.modeProbabilities,
    experimentId: decision.experimentId,
    experimentVariant: decision.experimentVariant,
    isRandomizedExperiment: decision.isRandomizedExperiment,
    predictedMode: decision.predictedMode,
  };

  logger.info({ decisionId: id, requestId }, 'Decision details retrieved');
  return c.json(responseData);
});

export { decisionsRouter };
