/**
 * Multi-Factor Scoring Matrix - 8-dimensional archetype scoring
 * Story 2.10: Task 2
 */

import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

import { logger } from '@/utils/logger';
import { prisma } from '@/utils/prisma';
import { redis } from '@/utils/redis';

import type { ArchetypeContext, ArchetypeScore, ArchetypeScores, FactorBreakdown } from '../types';

interface ScoringWeights {
  F1_modeIntent: number;
  F2_semanticResonance: number;
  F3_authorPersonaFit: number;
  F4_competitorCounter: number;
  F5_conversationState: number;
  F6_performanceMemory: number;
  F7_safetyCompliance: number;
  F8_rotationNovelty: number;
}

const DEFAULT_WEIGHTS: Record<string, ScoringWeights> = {
  HELPFUL: {
    F1_modeIntent: 0.24,
    F2_semanticResonance: 0.18,
    F3_authorPersonaFit: 0.14,
    F4_competitorCounter: 0.11,
    F5_conversationState: 0.11,
    F6_performanceMemory: 0.1,
    F7_safetyCompliance: 0.08,
    F8_rotationNovelty: 0.04,
  },
  ENGAGEMENT: {
    F1_modeIntent: 0.28,
    F2_semanticResonance: 0.18,
    F3_authorPersonaFit: 0.14,
    F4_competitorCounter: 0.11,
    F5_conversationState: 0.11,
    F6_performanceMemory: 0.1,
    F7_safetyCompliance: 0.03,
    F8_rotationNovelty: 0.05,
  },
  HYBRID: {
    F1_modeIntent: 0.22,
    F2_semanticResonance: 0.18,
    F3_authorPersonaFit: 0.14,
    F4_competitorCounter: 0.11,
    F5_conversationState: 0.11,
    F6_performanceMemory: 0.1,
    F7_safetyCompliance: 0.09,
    F8_rotationNovelty: 0.05,
  },
  DISENGAGED: {
    F1_modeIntent: 0.3,
    F2_semanticResonance: 0.15,
    F3_authorPersonaFit: 0.1,
    F4_competitorCounter: 0.05,
    F5_conversationState: 0.15,
    F6_performanceMemory: 0.1,
    F7_safetyCompliance: 0.1,
    F8_rotationNovelty: 0.05,
  },
};

function loadWeightsFromConfig(): Record<string, ScoringWeights> {
  try {
    const configPath = path.join(process.cwd(), '../config', 'archetype-scoring.yaml');
    // Note: CWD for backend tests is usually project root or backend dir.
    // If backend/src/... CWD might be backend/. 
    // The instruction said: path.join(process.cwd(), 'config', 'archetype-scoring.yaml')
    // But I created config at project root.
    // If running from backend package, CWD is backend/.
    // If running from root, CWD is root.
    // I'll try to find it.
    
    let targetPath = path.join(process.cwd(), 'config', 'archetype-scoring.yaml');
    if (!fs.existsSync(targetPath)) {
       targetPath = path.join(process.cwd(), '../config', 'archetype-scoring.yaml');
    }

    if (!fs.existsSync(targetPath)) {
        // Fallback for tests running in isolated environment
        return DEFAULT_WEIGHTS; 
    }

    const fileContents = fs.readFileSync(targetPath, 'utf8');
    const config = yaml.parse(fileContents);

    // Validate sums
    for (const [mode, weights] of Object.entries(config.modes)) {
      const sum = Object.values(weights as any).reduce((a: number, b: number) => a + b, 0);
      if (Math.abs(sum - 1.0) > 0.01) {
        throw new Error(`Mode ${mode} weights sum to ${sum}, expected 1.0 ± 0.01`);
      }
    }

    return config.modes as Record<string, ScoringWeights>;
  } catch (error) {
    logger.warn({ error }, 'Failed to load config, using defaults');
    return DEFAULT_WEIGHTS; // Fallback to hardcoded
  }
}

const CONFIG_WEIGHTS = loadWeightsFromConfig();

const ARCHETYPES = [
  'COACH',
  'CHECKLIST',
  'CREDIBILITY_ANCHOR',
  'MYTH_BUST',
  'EVIDENCE_ANCHOR',
  'TRANSPARENCY_ADVOCATE',
  'PERSPECTIVE_SHIFTER',
  'NUANCE_SPECIALIST',
  'CURIOSITY_CATALYST',
];

export class MultiFactorScorer {
  private weights: Record<string, ScoringWeights>;

  constructor(customWeights?: Record<string, Partial<ScoringWeights>>) {
    this.weights = CONFIG_WEIGHTS;
    if (customWeights) {
      Object.keys(customWeights).forEach((mode) => {
        this.weights[mode] = { ...this.weights[mode], ...customWeights[mode] };
      });
    }
    logger.info('MultiFactorScorer initialized');
  }

  public async score(context: ArchetypeContext): Promise<ArchetypeScores> {
    const modeWeights = this.weights[context.mode] || this.weights.HELPFUL;
    const scores: ArchetypeScore[] = [];

    for (const archetype of ARCHETYPES) {
      const factorBreakdown = await this.calculateFactorBreakdown(
        archetype,
        context,
        modeWeights
      );
      const totalScore = factorBreakdown.totalScore;
      const justification = this.generateJustification(factorBreakdown);

      scores.push({
        archetype,
        score: totalScore,
        confidence: context.overallConfidence,
        factorBreakdown,
        justification,
      });
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Calculate variance
    const mean = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s.score - mean, 2), 0) / scores.length;

    return {
      scores,
      variance,
      timestamp: new Date(),
    };
  }

  private async calculateFactorBreakdown(
    archetype: string,
    context: ArchetypeContext,
    weights: ScoringWeights
  ): Promise<FactorBreakdown> {
    const F1 = this.calculateF1_ModeIntent(archetype, context) * weights.F1_modeIntent;
    const F2 =
      this.calculateF2_SemanticResonance(archetype, context) * weights.F2_semanticResonance;
    const F3 = this.calculateF3_AuthorPersonaFit(archetype, context) * weights.F3_authorPersonaFit;
    const F4 =
      this.calculateF4_CompetitorCounter(archetype, context) * weights.F4_competitorCounter;
    const F5 =
      this.calculateF5_ConversationState(archetype, context) * weights.F5_conversationState;
    
    // F6 is now async
    const rawF6 = await this.calculateF6_PerformanceMemory(archetype, context);
    const F6 = rawF6 * weights.F6_performanceMemory;
    
    const F7 = this.calculateF7_SafetyCompliance(archetype, context) * weights.F7_safetyCompliance;
    const F8 = this.calculateF8_RotationNovelty(archetype, context) * weights.F8_rotationNovelty;

    const rotationPenalty = await this.calculateRotationPenalty(archetype, context);
    const performanceBias = await this.calculatePerformanceBias(archetype, context);

    const totalScore = Math.max(
      0,
      Math.min(1, F1 + F2 + F3 + F4 + F5 + F6 + F7 + F8 + rotationPenalty + performanceBias)
    );

    return {
      F1_modeIntent: F1,
      F2_semanticResonance: F2,
      F3_authorPersonaFit: F3,
      F4_competitorCounter: F4,
      F5_conversationState: F5,
      F6_performanceMemory: F6,
      F7_safetyCompliance: F7,
      F8_rotationNovelty: F8,
      rotationPenalty,
      performanceBias,
      totalScore,
    };
  }

  private async calculateRotationPenalty(
    archetype: string,
    context: ArchetypeContext
  ): Promise<number> {
    try {
      // Query Redis for last usage timestamp
      const cacheKey = `rotation:${archetype}:${context.postId.split('-')[0]}`; // Shard by user or prefix
      const lastUsedStr = await redis.get(cacheKey);

      if (!lastUsedStr) {
        return 0.0; // No penalty if never used
      }

      const lastUsedTimestamp = new Date(lastUsedStr);
      const ageMinutes = (Date.now() - lastUsedTimestamp.getTime()) / 1000 / 60;

      // Exponential decay: penalty = -μ × e^(-k × age)
      const mu = 0.12;
      const k = 0.35;
      const penalty = -mu * Math.exp(-k * ageMinutes);

      // Myth-bust exemption (AC3)
      if (archetype === 'MYTH_BUST' && context.semanticProfile.misinformationProbability > 0.7) {
        return 0.0;
      }

      logger.debug(
        { archetype, ageMinutes, penalty },
        'Rotation penalty calculated'
      );

      return penalty;
    } catch (error) {
      logger.warn({ error, archetype }, 'Rotation penalty calculation failed');
      return 0.0; // Fail open
    }
  }

  private calculateF1_ModeIntent(archetype: string, context: ArchetypeContext): number {
    // Mode-archetype alignment scores
    const modeArchetypeScores: Record<string, Record<string, number>> = {
      HELPFUL: {
        COACH: 0.9,
        CHECKLIST: 0.85,
        CREDIBILITY_ANCHOR: 0.8,
        MYTH_BUST: 0.75,
        EVIDENCE_ANCHOR: 0.7,
      },
      ENGAGEMENT: {
        CURIOSITY_CATALYST: 0.9,
        PERSPECTIVE_SHIFTER: 0.85,
        NUANCE_SPECIALIST: 0.8,
      },
    };

    return modeArchetypeScores[context.mode]?.[archetype] || 0.5;
  }

  private calculateF2_SemanticResonance(archetype: string, context: ArchetypeContext): number {
    const { semanticProfile } = context;
    let score = 0.5;

    // High urgency boosts action-oriented archetypes
    if (semanticProfile.urgency > 0.7) {
      if (['CHECKLIST', 'COACH'].includes(archetype)) score += 0.2;
    }

    // Misinformation risk boosts myth-busting
    if (semanticProfile.misinformationProbability > 0.5) {
      if (archetype === 'MYTH_BUST') score += 0.3;
    }

    return Math.min(1, score);
  }

  private calculateF3_AuthorPersonaFit(archetype: string, context: ArchetypeContext): number {
    const { personaProfile } = context;
    let score = 0.5;

    // High receptiveness boosts all archetypes
    score += personaProfile.receptiveness * 0.3;

    // Persona-specific boosts
    if (personaProfile.primaryPersona === 'healthcare_professional') {
      if (['CREDIBILITY_ANCHOR', 'EVIDENCE_ANCHOR'].includes(archetype)) score += 0.2;
    }

    return Math.min(1, score);
  }

  private calculateF4_CompetitorCounter(archetype: string, context: ArchetypeContext): number {
    const { competitorIntent } = context;
    if (!competitorIntent || !competitorIntent.detected) return 0.5;

    // Apply counter-weight if available
    const counterWeight = competitorIntent.recommendedCounterWeights.get(archetype) || 0;
    return 0.5 + counterWeight;
  }

  private calculateF5_ConversationState(archetype: string, context: ArchetypeContext): number {
    const { conversationState } = context;
    let score = 0.5;

    // Cooldown hint reduces engagement
    if (conversationState.cooldownHint) {
      score -= 0.2;
    }

    // High thread depth favors nuanced archetypes
    if (conversationState.threadDepth > 10) {
      if (['NUANCE_SPECIALIST', 'PERSPECTIVE_SHIFTER'].includes(archetype)) score += 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  private async calculateF6_PerformanceMemory(
    archetype: string,
    context: ArchetypeContext
  ): Promise<number> {
    try {
      // Query last 7 days of performance
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const winRate = await prisma.decisionOutcome.aggregate({
        where: {
          selectedArchetype: archetype,
          timestamp: { gte: sevenDaysAgo },
          engagementScore: { gte: 0.6 }, // "Win" threshold
        },
        _count: true,
      });

      const totalCount = await prisma.decisionOutcome.count({
        where: {
          selectedArchetype: archetype,
          timestamp: { gte: sevenDaysAgo },
        },
      });

      if (totalCount < 10) return 0.5; // Neutral with low sample

      const rate = winRate._count / totalCount;
      return Math.max(0.0, Math.min(1.0, rate));

    } catch (error) {
      logger.warn({ error, archetype }, 'Performance memory calculation failed');
      return 0.5; // Neutral fallback
    }
  }

  private calculateF7_SafetyCompliance(archetype: string, context: ArchetypeContext): number {
    const { semanticProfile } = context;

    // High misinformation requires safe archetypes
    if (semanticProfile.misinformationProbability > 0.7) {
      if (['MYTH_BUST', 'EVIDENCE_ANCHOR'].includes(archetype)) return 0.9;
      return 0.3;
    }

    return 0.8;
  }

  private calculateF8_RotationNovelty(_archetype: string, _context: ArchetypeContext): number {
    // This factor is now mostly handled by rotationPenalty, but can still offer a small base score if needed.
    // For now, return neutral or low value as penalty does the heavy lifting.
    return 0.5; 
  }

  private async calculatePerformanceBias(
    archetype: string,
    context: ArchetypeContext
  ): Promise<number> {
    try {
      // Query last 7 days of performance for this archetype
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const performance = await prisma.decisionOutcome.aggregate({
        where: {
          selectedArchetype: archetype,
          timestamp: { gte: sevenDaysAgo },
        },
        _avg: {
          engagementScore: true, // upvotes + replies + shares weighted
        },
        _count: true,
      });

      if (!performance._count || performance._count < 10) {
        return 0.0; // Need minimum sample size
      }

      // Normalize to [-0.1, +0.1] range
      const avgScore = performance._avg.engagementScore || 0;
      const bias = Math.max(-0.1, Math.min(0.1, (avgScore - 0.5) * 0.2));

      logger.debug(
        { archetype, avgScore, bias, sampleSize: performance._count },
        'Performance bias calculated'
      );

      return bias;
    } catch (error) {
      logger.warn({ error, archetype }, 'Performance bias calculation failed');
      return 0.0;
    }
  }

  private generateJustification(breakdown: FactorBreakdown): string {
    const factors = [
      { name: 'Mode Intent', value: breakdown.F1_modeIntent },
      { name: 'Semantic Resonance', value: breakdown.F2_semanticResonance },
      { name: 'Author Fit', value: breakdown.F3_authorPersonaFit },
      { name: 'Competitor Counter', value: breakdown.F4_competitorCounter },
      { name: 'Conversation State', value: breakdown.F5_conversationState },
      { name: 'Performance', value: breakdown.F6_performanceMemory },
      { name: 'Safety', value: breakdown.F7_safetyCompliance },
      { name: 'Novelty', value: breakdown.F8_rotationNovelty },
    ];

    const topFactors = factors.sort((a, b) => b.value - a.value).slice(0, 3);
    return `Top factors: ${topFactors.map((f) => `${f.name} (${f.value.toFixed(2)})`).join(', ')}`;
  }
}
