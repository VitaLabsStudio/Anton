import { Hono } from 'hono';
import { prisma } from '../../utils/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const competitiveRouter = new Hono();

/**
 * GET /api/competitive/mentions
 * Returns competitive intelligence metrics: share of voice, sentiment, recent mentions
 */
competitiveRouter.get('/mentions', authMiddleware, async (c) => {
  // Get date range from query params or default to 30 days
  const days = parseInt(c.req.query('days') || '30', 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const mentions = await prisma.competitiveMention.findMany({
    where: {
      createdAt: { gte: since },
    },
    include: {
      competitor: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 1000, // Limit to 1000 for analysis to avoid OOM
  });

  // Share of Voice
  const shareOfVoice: Record<string, number> = {};
  const total = mentions.length;
  
  // Sentiment Breakdown
  const sentimentBreakdown: Record<string, { POSITIVE: number; NEUTRAL: number; NEGATIVE: number }> = {};
  
  mentions.forEach(m => {
    // Share of Voice
    const name = m.competitor.name;
    shareOfVoice[name] = (shareOfVoice[name] || 0) + 1;
    
    // Sentiment
    if (!sentimentBreakdown[name]) {
      sentimentBreakdown[name] = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
    }
    const sentiment = (m.sentiment as 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE') || 'NEUTRAL';
    if (sentimentBreakdown[name][sentiment] !== undefined) {
       sentimentBreakdown[name][sentiment]++;
    }
  });

  // Calculate percentages for SoV
  const shareOfVoicePct = Object.fromEntries(
    Object.entries(shareOfVoice).map(([k, v]) => [k, total > 0 ? v / total : 0])
  );

  return c.json({
    period: `${days} days`,
    totalMentions: total,
    shareOfVoice: shareOfVoicePct,
    sentimentBreakdown,
    recentMentions: mentions.slice(0, 50), // Return recent 50 for detail view
  });
});

export { competitiveRouter };
