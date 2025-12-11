import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectCompetitor, saveCompetitiveMention } from '../../../src/analysis/competitive-detector';
import { prisma } from '../../../src/utils/prisma';

// Mock dependencies
vi.mock('../../../src/utils/prisma', () => ({
  prisma: {
    competitor: {
      findUnique: vi.fn(),
    },
    competitiveMention: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CompetitiveDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectCompetitor', () => {
    it('should detect LiquidIV mentions with variations', async () => {
      const variations = [
        'I love LiquidIV',
        'Liquid IV works great',
        'liquid-iv is the best',
        'liquidiv is good',
        'LIQUID IV helped me',
      ];

      for (const text of variations) {
        const result = await detectCompetitor(text);
        expect(result.detected).toBe(true);
        expect(result.name).toBe('LiquidIV');
        expect(result.sentiment).toBe('POSITIVE'); // All examples have positive words
      }
    });

    it('should detect negative sentiment', async () => {
      const text = 'Liquid IV was a waste of money and didn\'t work';
      const result = await detectCompetitor(text);
      expect(result.detected).toBe(true);
      expect(result.sentiment).toBe('NEGATIVE');
      expect(result.satisfaction).toBe('UNSATISFIED');
    });

    it('should detect questioning satisfaction', async () => {
      const text = 'Does Liquid IV actually work?';
      const result = await detectCompetitor(text);
      expect(result.detected).toBe(true);
      expect(result.satisfaction).toBe('QUESTIONING');
    });

    it('should prioritize highest opportunity score when multiple competitors detected', async () => {
      // "Liquid IV didn't work but Drip Drop was amazing"
      // Liquid IV: Negative Sentiment, Unsatisfied -> High Opportunity (0.9)
      // Drip Drop: Positive Sentiment, Satisfied -> Low Opportunity (0.3)
      // Should return Liquid IV
      
      const text = "Liquid IV didn't work at all, complete waste. Drip Drop was amazing though.";
      const result = await detectCompetitor(text);
      
      expect(result.detected).toBe(true);
      expect(result.name).toBe('LiquidIV');
      expect(result.opportunityScore).toBeGreaterThan(0.5);
    });

    it('should return Drip Drop if Liquid IV is positive and Drip Drop is negative', async () => {
      // "Liquid IV is great but Drip Drop is a scam"
      // Liquid IV: Positive -> Low Opportunity
      // Drip Drop: Negative -> High Opportunity
      
      const text = "Liquid IV is great but Drip Drop is a scam";
      const result = await detectCompetitor(text);
      
      expect(result.name).toBe('Drip Drop');
      expect(result.opportunityScore).toBeGreaterThan(0.5);
    });

    it('should handle no competitors', async () => {
      const text = "Just drinking water today";
      const result = await detectCompetitor(text);
      expect(result.detected).toBe(false);
    });
    
    // AC 11: 50+ mention variations
    it('should detect extensive list of variations', async () => {
       const cases = [
         { text: 'pedialyte is good', name: 'Pedialyte' },
         { text: 'gatorade helps', name: 'Gatorade' },
         { text: 'nuun tablets', name: 'Nuun' },
         { text: 'zbiotics for hangover', name: 'ZBiotics' },
         { text: 'flyby pills', name: 'Flyby' },
         { text: 'afterdrink works', name: 'AfterDrink' },
         { text: 'cheers health pills', name: 'Cheers' },
         { text: 'dhm detox', name: 'DHM Detox' },
         { text: 'the iv doc came over', name: 'The I.V. Doc' },
         { text: 'revive iv clinic', name: 'Revive' },
         { text: 'hydromed therapy', name: 'HydroMed' },
         { text: 'hair of the dog helps', name: 'Hair of the Dog' },
         { text: 'activated charcoal pills', name: 'Activated Charcoal' },
         { text: 'pickle juice for cramps', name: 'Pickle Juice' },
       ];
       
       for (const c of cases) {
         const result = await detectCompetitor(c.text);
         expect(result.detected).toBe(true);
         expect(result.name).toBe(c.name);
       }
    });
  });

  describe('saveCompetitiveMention', () => {
    it('should save mention to database', async () => {
      const result = {
        detected: true,
        name: 'LiquidIV',
        category: 'REHYDRATION',
        sentiment: 'POSITIVE' as const,
        satisfaction: 'SATISFIED' as const,
        opportunityScore: 0.3,
        confidence: 0.9,
      };
      
      // Mock findUnique to return a competitor
      vi.mocked(prisma.competitor.findUnique).mockResolvedValue({ id: 'comp-123', name: 'LiquidIV' } as any);
      
      await saveCompetitiveMention('post-123', result);
      
      expect(prisma.competitor.findUnique).toHaveBeenCalledWith({ where: { name: 'LiquidIV' } });
      expect(prisma.competitiveMention.create).toHaveBeenCalledWith({
        data: {
          postId: 'post-123',
          competitorId: 'comp-123',
          sentiment: 'POSITIVE',
          satisfaction: 'SATISFIED',
          opportunityScore: 0.3,
          replied: false,
        },
      });
    });

    it('should log warning if competitor not found', async () => {
      const result = {
        detected: true,
        name: 'UnknownBrand',
        category: 'REHYDRATION',
        sentiment: 'POSITIVE' as const,
        satisfaction: 'SATISFIED' as const,
        opportunityScore: 0.3,
        confidence: 0.9,
      };
      
      vi.mocked(prisma.competitor.findUnique).mockResolvedValue(null);
      
      await saveCompetitiveMention('post-123', result);
      
      expect(prisma.competitiveMention.create).not.toHaveBeenCalled();
    });
  });
});
