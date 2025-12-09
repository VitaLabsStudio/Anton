import { Hono } from 'hono';
import { prisma } from '../../utils/prisma.js';
import { TemporalExperimentSchema } from '../../config/temporal-schema.js';
import { compareTreatments } from '../../analysis/bayesian-analysis.js';
import { logger } from '../../utils/logger.js';

const experimentRouter = new Hono();

experimentRouter.post('/temporal', async (c) => {
  try {
    const body = await c.req.json();
    const validated = TemporalExperimentSchema.parse(body);
    
    if (validated.variants.length < 2) {
        return c.json({ error: 'Need at least 2 variants for A/B testing' }, 400);
    }
    
    const experiment = await prisma.experiment.create({
      data: {
        name: validated.name,
        status: 'DRAFT',
        variantA: validated.variants[0] as any,
        variantB: validated.variants[1] as any,
        metric: 'engagement_rate',
        trafficSplit: validated.trafficAllocation,
        startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      }
    });
    
    return c.json({ success: true, experiment });
  } catch (error) {
    logger.error({ error }, 'Failed to create experiment');
    return c.json({ error: 'Failed to create experiment' }, 500);
  }
});

experimentRouter.get('/temporal/:id/results', async (c) => {
    const id = c.req.param('id');
    try {
        const experiment = await prisma.experiment.findUnique({ where: { id } });
        if (!experiment) return c.json({ error: 'Not found' }, 404);
        
        // Analyze results
        // Fetch stats from decisions table (Mocked logic for now as per task scope focusing on API structure)
        // Ideally: SELECT count(*) FROM decisions WHERE experimentId = id AND variant = 'A' ...
        
        const results = compareTreatments(
            { successes: 100, failures: 900 }, // Mock A
            { successes: 120, failures: 880 }  // Mock B (better)
        );
        
        return c.json({ success: true, results });
    } catch (error) {
        logger.error({ error }, 'Failed to fetch experiment results');
        return c.json({ error: 'Failed to get results' }, 500);
    }
});

export { experimentRouter };
