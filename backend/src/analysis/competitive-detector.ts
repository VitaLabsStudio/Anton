import { logger } from '../utils/logger.js';
import { prisma } from '../utils/prisma.js';

export interface CompetitorSignal {
  detected: boolean;
  name: string | null;
  confidence: number;
  reason?: string;
}

interface CompetitorKeywords {
  name: string;
  keywords: string[];
}

const DEFAULT_SIGNAL: CompetitorSignal = {
  detected: false,
  name: null,
  confidence: 0.0,
};

export class CompetitiveDetector {
  private cachedCompetitors: CompetitorKeywords[] | null = null;

  async detectCompetitor(content: string): Promise<CompetitorSignal> {
    try {
      const normalized = (content ?? '').toLowerCase();
      const competitors = await this.getCompetitors();

      for (const competitor of competitors) {
        const match = competitor.keywords.find((keyword) => normalized.includes(keyword));
        if (match) {
          return {
            detected: true,
            name: competitor.name,
            confidence: 0.9,
            reason: `keyword:${match}`,
          };
        }
      }

      return DEFAULT_SIGNAL;
    } catch (error) {
      logger.error({ error }, 'CompetitiveDetector failed');
      return DEFAULT_SIGNAL;
    }
  }

  private async getCompetitors(): Promise<CompetitorKeywords[]> {
    if (this.cachedCompetitors) return this.cachedCompetitors;

    const rows = await prisma.competitor.findMany({
      select: {
        name: true,
        brandKeywords: true,
      },
    });

    const normalized = rows.map((row) => ({
      name: row.name,
      keywords: (row.brandKeywords ?? []).map((keyword) => keyword.toLowerCase()),
    }));

    this.cachedCompetitors = normalized;
    return normalized;
  }
}

const detector = new CompetitiveDetector();

export const detectCompetitor = (content: string): Promise<CompetitorSignal> =>
  detector.detectCompetitor(content);
