import { Hono } from 'hono';

import { prisma } from '../../utils/prisma.js';

const analyticsTemporalRouter = new Hono();
const cache: Record<string, { expires: number; payload: unknown }> = {};
const CACHE_TTL_MS = 15 * 60 * 1000;

const cacheGet = <T>(key: string): T | null => {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    delete cache[key];
    return null;
  }
  return entry.payload as T;
};

const cacheSet = (key: string, payload: unknown): void => {
  cache[key] = { payload, expires: Date.now() + CACHE_TTL_MS };
};

analyticsTemporalRouter.get('/heatmap', async (c) => {
  const cached = cacheGet<{ heatmap: unknown }>('heatmap');
  if (cached) return c.json(cached);

  const rows = (await prisma.$queryRaw`
    SELECT
      EXTRACT(DOW FROM created_at)::int AS day,
      EXTRACT(HOUR FROM created_at)::int AS hour,
      AVG(COALESCE((temporal_context->>'monitoringMultiplier')::numeric, 1)) AS avg_multiplier,
      COUNT(*)::int AS decisions
    FROM decisions
    WHERE temporal_context IS NOT NULL
    GROUP BY day, hour
    ORDER BY day, hour
  `) as Array<{ day: number; hour: number; avg_multiplier: number; decisions: number }>;

  const grid: Array<{ day: number; hour: number; avg_multiplier: number; decisions: number }> = [];
  for (let day = 0; day < 7; day += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      const match = rows.find((r) => r.day === day && r.hour === hour);
      grid.push({
        day,
        hour,
        avg_multiplier: match ? Number(match.avg_multiplier) : 0,
        decisions: match ? Number(match.decisions) : 0,
      });
    }
  }

  const payload = { heatmap: grid };
  cacheSet('heatmap', payload);
  return c.json(payload);
});

analyticsTemporalRouter.get('/phases', async (c) => {
  const cached = cacheGet<{ phases: unknown }>('phases');
  if (cached) return c.json(cached);

  const rows = (await prisma.$queryRaw`
    SELECT
      COALESCE(temporal_context->>'phase', 'normal') AS phase,
      COUNT(*)::int AS decisions
    FROM decisions
    WHERE temporal_context IS NOT NULL
    GROUP BY phase
  `) as Array<{ phase: string; decisions: number }>;

  const payload = { phases: rows };
  cacheSet('phases', payload);
  return c.json(payload);
});

analyticsTemporalRouter.get('/rules', async (c) => {
  const cached = cacheGet<{ rules: unknown }>('rules');
  if (cached) return c.json(cached);

  const rows = (await prisma.$queryRaw`
    SELECT
      rule_id,
      COUNT(*)::int AS decisions
    FROM decisions, jsonb_array_elements_text(temporal_context->'matchedRules') AS rule_id
    GROUP BY rule_id
    ORDER BY decisions DESC
  `) as Array<{ rule_id: string; decisions: number }>;

  const payload = { rules: rows };
  cacheSet('rules', payload);
  return c.json(payload);
});

analyticsTemporalRouter.get('/time-to-engage', async (c) => {
  const cached = cacheGet<{ distribution: unknown }>('tte');
  if (cached) return c.json(cached);

  const rows = (await prisma.$queryRaw`
    SELECT
      EXTRACT(EPOCH FROM (r.posted_at - d.created_at)) AS seconds,
      COALESCE(d.temporal_context->>'phase', 'normal') AS phase
    FROM replies r
    JOIN decisions d ON d.id = r.decision_id AND d.created_at = r.decision_created_at
    WHERE r.posted_at IS NOT NULL
  `) as Array<{ seconds: number; phase: string }>;

  const distribution = rows.map((r) => ({
    phase: r.phase,
    seconds: Number(r.seconds ?? 0),
  }));

  const payload = { distribution };
  cacheSet('tte', payload);
  return c.json(payload);
});

export { analyticsTemporalRouter };
