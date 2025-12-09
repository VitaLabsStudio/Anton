import { Hono } from 'hono';
import { z } from 'zod';

import { TemporalFeatureExtractor } from '../../analysis/temporal-feature-extractor.js';
import { TemporalContextSchema, type TemporalContext } from '../../config/temporal-schema.js';
import { prisma } from '../../utils/prisma.js';

const extractor = new TemporalFeatureExtractor();
const mlRouter = new Hono();

const predictSchema = z.object({
  author_id: z.string(),
  content_preview: z.string(),
  platform: z.string(),
  temporalContext: TemporalContextSchema.partial().optional(),
});

mlRouter.post('/predict-optimal-time', async (c) => {
  try {
    const body = predictSchema.parse(await c.req.json());
    const temporalContext = body.temporalContext ?? { phase: 'normal', monitoringMultiplier: 1 };
    const features = extractor.extract(temporalContext);

    // Mock heuristic: favor evening engagement if normal phase, otherwise use phase to choose.
    const optimalHour =
      temporalContext.phase === 'prevention'
        ? 18
        : temporalContext.phase === 'peak_suffering'
          ? 9
          : 20;
    const optimalDay = features.is_weekend ? 'weekend' : 'weekday';

    return c.json({
      optimal_hour: optimalHour,
      optimal_day: optimalDay,
      confidence: 0.42,
      reasoning: 'Rule-based heuristic placeholder until ML model is integrated',
      features,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    return c.json({ error: message }, 400);
  }
});

mlRouter.get('/temporal-features', async (c) => {
  const query = c.req.query() as Record<string, string | undefined>;
  const start = query.start ? new Date(query.start) : null;
  const end = query.end ? new Date(query.end) : null;

  if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime()))) {
    return c.json({ error: 'Invalid start or end date' }, 400);
  }

  const rows = await prisma.decision.findMany({
    where: {
      ...(start ? { createdAt: { gte: start } } : {}),
      ...(end ? { createdAt: { lte: end } } : {}),
      temporalContext: { not: null },
    },
    select: {
      id: true,
      createdAt: true,
      temporalContext: true,
    },
    take: 5000,
  });

  const features = rows.map((row) => {
    const ctx = row.temporalContext as Record<string, unknown>;
    const extracted = extractor.extract(ctx as unknown as TemporalContext);
    return {
      decisionId: row.id,
      createdAt: row.createdAt,
      ...extracted,
    };
  });

  return c.json({ count: features.length, features });
});

export { mlRouter };
