import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import competitorsData from '../data/competitors.json' with { type: 'json' };

// Use strict types
const competitors = competitorsData.competitors;

export interface CompetitorSignal {
  detected: boolean;
  name: string | null;
  category: string | null;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  satisfaction: 'SATISFIED' | 'UNSATISFIED' | 'QUESTIONING';
  opportunityScore: number; // 0-1, higher = better opportunity
  confidence: number;
}

export async function detectCompetitor(content: string): Promise<CompetitorSignal> {
  const lowerContent = content.toLowerCase();
  const detectedCompetitors: CompetitorSignal[] = [];
  
  // Split content into segments to isolate sentiment (sentences or contrast clauses)
  const segments = lowerContent.split(/([.!?]|\bbut\b|\bhowever\b|\balthough\b)/i);

  // Check each competitor
  for (const competitor of competitors) {
    for (const keyword of competitor.brandKeywords) {
      if (variationMatch(lowerContent, keyword.toLowerCase())) {
        // Competitor detected in full text. 
        // Now find specific segments relevant to this competitor for sentiment analysis.
        const relevantSegments = segments.filter(seg => 
          variationMatch(seg, keyword.toLowerCase())
        );
        
        // If no specific segment matched (shouldn't happen if full text matched, but maybe boundary issues), fallback to full text
        const contextText = relevantSegments.length > 0 ? relevantSegments.join(' ') : lowerContent;

        const sentiment = analyzeSentiment(contextText, keyword.toLowerCase());
        const satisfaction = analyzeSatisfaction(contextText);
        const opportunity = calculateOpportunity(sentiment, satisfaction);

        const result: CompetitorSignal = {
          detected: true,
          name: competitor.name,
          category: competitor.category,
          sentiment,
          satisfaction,
          opportunityScore: opportunity,
          confidence: 0.90,
        };

        detectedCompetitors.push(result);
        
        logger.info('Competitor detected', {
          competitor: competitor.name,
          category: competitor.category,
          sentiment,
          satisfaction,
          opportunity,
        });
        
        break; // Only match once per competitor
      }
    }
  }

  // If multiple competitors detected, return highest opportunityScore
  if (detectedCompetitors.length > 0) {
    // Log all detected competitors
    if (detectedCompetitors.length > 1) {
      logger.info('Multiple competitors detected', {
        count: detectedCompetitors.length,
        competitors: detectedCompetitors.map(c => c.name),
      });
    }
    
    // Return competitor with highest opportunity score
    return detectedCompetitors.reduce((highest, current) =>
      current.opportunityScore > highest.opportunityScore ? current : highest
    );
  }

  // No competitor detected
  return {
    detected: false,
    name: null,
    category: null,
    sentiment: 'NEUTRAL',
    satisfaction: 'SATISFIED',
    opportunityScore: 0,
    confidence: 1.0,
  };
}

function variationMatch(text: string, keyword: string): boolean {
  // Handle variations: "liquid iv", "liquidiv", "liquid-iv" (spaces, hyphens, case)
  const normalizedKeyword = keyword.replace(/[\s-]/g, '');
  const normalizedText = text.replace(/[\s-]/g, '');
  
  // Use simple inclusion check on normalized strings
  return normalizedText.includes(normalizedKeyword);
}

function analyzeSentiment(content: string, _brandKeyword: string): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' {
  // Negative indicators (Check FIRST to handle negations like "didn't work")
  const negative = /(didn't work|useless|waste|scam|disappointed|failed|bad|terrible|sick|hate|awful)/i;
  if (negative.test(content)) {
    return 'NEGATIVE';
  }

  // Positive indicators
  const positive = /(works?|great|love|amazing|best|helped|recommend|good|effective|excellent|favorite)/i;
  if (positive.test(content)) {
    return 'POSITIVE';
  }

  return 'NEUTRAL';
}

function analyzeSatisfaction(content: string): 'SATISFIED' | 'UNSATISFIED' | 'QUESTIONING' {
  // Questioning
  if (/\?/.test(content) && /(does|is|will|should|work|anyone|tried)/i.test(content)) {
    return 'QUESTIONING';
  }

  // Unsatisfied
  if (/(didn't help|didn't work|still feel|not working|waste of money|headache|nauseous|scam|disappointed|useless)/i.test(content)) {
    return 'UNSATISFIED';
  }

  // Satisfied
  if (/(worked|helped|feel better|recommend|cured|great|love|amazing|best)/i.test(content)) {
    return 'SATISFIED';
  }

  return 'QUESTIONING'; // Default fallback
}

function calculateOpportunity(
  sentiment: string,
  satisfaction: string
): number {
  // Higher score = better positioning opportunity
  if (satisfaction === 'UNSATISFIED') return 0.9;
  if (satisfaction === 'QUESTIONING') return 0.7;
  if (sentiment === 'NEGATIVE') return 0.8;
  if (sentiment === 'NEUTRAL') return 0.5;
  if (sentiment === 'POSITIVE') return 0.3; // Soft positioning only
  return 0.5;
}

// Save competitive mention
export async function saveCompetitiveMention(
  postId: string,
  result: CompetitorSignal
): Promise<void> {
  if (!result.detected || !result.name) return;

  // We findUnique by name. Seed ensured these exist.
  const competitor = await prisma.competitor.findUnique({
    where: { name: result.name },
  });

  if (!competitor) {
    logger.warn('Competitor not in database', { name: result.name });
    return;
  }

  await prisma.competitiveMention.create({
    data: {
      postId,
      competitorId: competitor.id,
      sentiment: result.sentiment,
      satisfaction: result.satisfaction,
      opportunityScore: result.opportunityScore,
      replied: false,
    },
  });
}