# DEV AGENT INSTRUCTIONS: Fix Story 2.10 Critical Implementation Issues

## Context
Story 2.10 implementation has good architecture but **8 critical integration points are stubbed with TODOs**. You need to complete the missing functionality. All tests pass but they only validate structure, not real behavior.

## What's Already Implemented ✅
- Type definitions and interfaces (types.ts)
- Pipeline structure (ContextAssembler → Scorer → Strategy → Selector)
- Graceful degradation scaffolding
- PII redaction (pii-redaction.ts)
- LLM cost tracking (llm-cost-tracker.ts)
- Basic scoring logic (multi-factor-scorer.ts)
- Test suites (164 tests passing)

## What's Broken 🔴
8 critical TODOs + 3 architectural violations must be fixed.

---

## PRIORITY 1: Fix Validation Crash (BLOCKER)

**File:** `backend/src/generation/archetype-selection/context/context-assembler.ts`
**Line:** 156-163

**Current Code:**
```typescript
private validateSignals(signals: DecisionSignals): DecisionSignals {
  try {
    return decisionSignalsSchema.parse(signals);
  } catch (error) {
    logger.warn({ error, signals }, 'Signal validation failed, using defaults');
    throw new Error('Invalid decision signals');  // ❌ CRASHES PIPELINE
  }
}
```

**Fix:**
```typescript
private validateSignals(signals: DecisionSignals): DecisionSignals {
  try {
    return decisionSignalsSchema.parse(signals);
  } catch (error) {
    logger.warn({ error, signals }, 'Signal validation failed, using degraded defaults');
    // Return minimal valid signals instead of throwing
    return {
      postId: signals.postId || 'unknown',
      mode: signals.mode || 'HELPFUL',
      modeConfidence: typeof signals.modeConfidence === 'number' ? signals.modeConfidence : 0.3,
      platform: signals.platform || 'reddit',
      timestamp: signals.timestamp || new Date().toISOString(),
    };
  }
}
```

**Test:** Add test case in `context-assembler.test.ts`:
```typescript
it('should not throw on completely invalid signals', async () => {
  const badSignals = { postId: 'test', invalid: true } as any;
  const context = await assembler.buildContext(badSignals);
  expect(context).toBeDefined();
  expect(context.overallConfidence).toBeLessThan(0.3); // Low confidence
});
```

---

## PRIORITY 2: Fix Scoring Weights Violation

**File:** `backend/src/generation/archetype-selection/scoring/multi-factor-scorer.ts`
**Lines:** 32-41 (ENGAGEMENT mode)

**Problem:** F8_rotationNovelty is 0.00, violates AC2 requirement (0.05-0.10 range)

**Current:**
```typescript
ENGAGEMENT: {
  F1_modeIntent: 0.3,
  F2_semanticResonance: 0.18,
  F3_authorPersonaFit: 0.14,
  F4_competitorCounter: 0.11,
  F5_conversationState: 0.11,
  F6_performanceMemory: 0.1,
  F7_safetyCompliance: 0.06,
  F8_rotationNovelty: 0.0,  // ❌ VIOLATES 0.05-0.10 RANGE
}
// Sum = 1.00
```

**Fix:** Adjust weights to include F8:
```typescript
ENGAGEMENT: {
  F1_modeIntent: 0.28,        // Reduce from 0.30
  F2_semanticResonance: 0.18,
  F3_authorPersonaFit: 0.14,
  F4_competitorCounter: 0.11,
  F5_conversationState: 0.11,
  F6_performanceMemory: 0.1,
  F7_safetyCompliance: 0.03,  // Reduce from 0.06
  F8_rotationNovelty: 0.05,   // Add minimum from range
}
// Sum = 1.00
```

**Validate:** Add to `scoring/__tests__/weight-validation.test.ts`:
```typescript
describe('Weight range validation', () => {
  it('should respect F8 minimum of 0.05 in all modes', () => {
    for (const mode of ['HELPFUL', 'ENGAGEMENT', 'HYBRID', 'DISENGAGED']) {
      const weights = DEFAULT_WEIGHTS[mode];
      expect(weights.F8_rotationNovelty).toBeGreaterThanOrEqual(0.05);
    }
  });
});
```

---

## PRIORITY 3: Create Configuration File

**File:** `config/archetype-scoring.yaml` (NEW FILE - CREATE IT)

**Location:** Create at project root: `/Users/nessimknafo/Desktop/Dev/Reply Bot V2/config/archetype-scoring.yaml`

**Content:**
```yaml
# Story 2.10: Multi-Factor Scoring Weights Configuration
# Each mode defines 8 factor weights that must sum to 1.0 ± 0.01

version: 1
modes:
  HELPFUL:
    F1_modeIntent: 0.24
    F2_semanticResonance: 0.18
    F3_authorPersonaFit: 0.14
    F4_competitorCounter: 0.11
    F5_conversationState: 0.11
    F6_performanceMemory: 0.10
    F7_safetyCompliance: 0.08
    F8_rotationNovelty: 0.04

  ENGAGEMENT:
    F1_modeIntent: 0.28
    F2_semanticResonance: 0.18
    F3_authorPersonaFit: 0.14
    F4_competitorCounter: 0.11
    F5_conversationState: 0.11
    F6_performanceMemory: 0.10
    F7_safetyCompliance: 0.03
    F8_rotationNovelty: 0.05

  HYBRID:
    F1_modeIntent: 0.22
    F2_semanticResonance: 0.18
    F3_authorPersonaFit: 0.14
    F4_competitorCounter: 0.11
    F5_conversationState: 0.11
    F6_performanceMemory: 0.10
    F7_safetyCompliance: 0.09
    F8_rotationNovelty: 0.05

  DISENGAGED:
    F1_modeIntent: 0.30
    F2_semanticResonance: 0.15
    F3_authorPersonaFit: 0.10
    F4_competitorCounter: 0.05
    F5_conversationState: 0.15
    F6_performanceMemory: 0.10
    F7_safetyCompliance: 0.10
    F8_rotationNovelty: 0.05

# Weight ranges per AC2 (for validation)
ranges:
  F1_modeIntent:
    HELPFUL: [0.20, 0.28]
    ENGAGEMENT: [0.25, 0.35]
    HYBRID: [0.18, 0.26]
  F2_semanticResonance: [0.15, 0.22]
  F3_authorPersonaFit: [0.10, 0.18]
  F4_competitorCounter: [0.08, 0.15]
  F5_conversationState: [0.08, 0.14]
  F6_performanceMemory: [0.08, 0.13]
  F7_safetyCompliance: [0.05, 0.12]
  F8_rotationNovelty: [0.05, 0.10]
```

**Load Config in MultiFactorScorer:**

Update `multi-factor-scorer.ts`:

```typescript
import fs from 'fs';
import path from 'path';
import yaml from 'yaml'; // Add: npm install yaml

// At top of file, load config
function loadWeightsFromConfig(): Record<string, ScoringWeights> {
  try {
    const configPath = path.join(process.cwd(), 'config', 'archetype-scoring.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.parse(fileContents);

    // Validate sums
    for (const [mode, weights] of Object.entries(config.modes)) {
      const sum = Object.values(weights as any).reduce((a: number, b: number) => a + b, 0);
      if (Math.abs(sum - 1.0) > 0.01) {
        throw new Error(`Mode ${mode} weights sum to ${sum}, expected 1.0 ± 0.01`);
      }
    }

    return config.modes;
  } catch (error) {
    logger.warn({ error }, 'Failed to load config, using defaults');
    return DEFAULT_WEIGHTS; // Fallback to hardcoded
  }
}

const CONFIG_WEIGHTS = loadWeightsFromConfig();

export class MultiFactorScorer {
  private weights: Record<string, ScoringWeights>;

  constructor(customWeights?: Record<string, Partial<ScoringWeights>>) {
    this.weights = CONFIG_WEIGHTS; // Use config instead of DEFAULT_WEIGHTS
    if (customWeights) {
      Object.keys(customWeights).forEach((mode) => {
        this.weights[mode] = { ...this.weights[mode], ...customWeights[mode] };
      });
    }
    logger.info('MultiFactorScorer initialized with config weights');
  }
  // ... rest unchanged
}
```

**Test:** Add to `scoring/__tests__/weight-validation.test.ts`:
```typescript
it('should load weights from config file', () => {
  const scorer = new MultiFactorScorer();
  const scores = scorer.score(mockContext);
  expect(scores).toBeDefined();
});
```

---

## PRIORITY 4: Implement Real Post Content Fetching

**File:** `backend/src/generation/archetype-selection/context/context-assembler.ts`
**Line:** 180

**Current:**
```typescript
const profile = await this.semanticPipeline.run({
  postId: signals.postId,
  content: `Post ${signals.postId}`, // ❌ PLACEHOLDER
  platform: signals.platform,
});
```

**Fix:** Create content fetcher utility

**New File:** `backend/src/generation/archetype-selection/context/content-fetcher.ts`

```typescript
/**
 * Content Fetcher - Retrieves post content from database
 * Story 2.10: Context Enrichment
 */

import { logger } from '@/utils/logger';
import { prisma } from '@/utils/prisma';

export interface PostContent {
  content: string;
  authorHandle?: string;
  createdAt: Date;
}

export class ContentFetcher {
  /**
   * Fetch post content by ID
   * @returns Post content or null if not found
   */
  public async fetchPostContent(
    postId: string,
    platform: 'twitter' | 'reddit' | 'threads'
  ): Promise<PostContent | null> {
    try {
      // Query database for post content
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: {
          content: true,
          authorHandle: true,
          createdAt: true,
        },
      });

      if (!post) {
        logger.warn({ postId, platform }, 'Post not found in database');
        return null;
      }

      return {
        content: post.content,
        authorHandle: post.authorHandle || undefined,
        createdAt: post.createdAt,
      };
    } catch (error) {
      logger.error({ error, postId, platform }, 'Failed to fetch post content');
      return null;
    }
  }
}
```

**Update ContextAssembler:**

```typescript
import { ContentFetcher } from './content-fetcher';

export class ContextAssembler {
  private contentFetcher: ContentFetcher;

  constructor(config: Partial<ContextAssemblerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.semanticPipeline = new SemanticProfilePipeline();
    this.personaRefiner = new AuthorPersonaRefiner();
    this.competitorEngine = new CompetitorStrategyEngine();
    this.conversationTracker = new ConversationStateTracker();
    this.contentFetcher = new ContentFetcher(); // ADD THIS
    logger.info({ config: this.config }, 'ContextAssembler initialized');
  }

  private async fetchSemanticProfile(signals: DecisionSignals): Promise<SemanticProfile> {
    if (!this.config.enableSemanticPipeline) {
      logger.debug('Semantic pipeline disabled, using default');
      return DEFAULT_SEMANTIC_PROFILE;
    }

    try {
      // Fetch actual content
      const postContent = await this.contentFetcher.fetchPostContent(
        signals.postId,
        signals.platform
      );

      if (!postContent) {
        logger.warn({ postId: signals.postId }, 'Post content not found, using placeholder');
        return DEFAULT_SEMANTIC_PROFILE;
      }

      const profile = await this.semanticPipeline.run({
        postId: signals.postId,
        content: postContent.content, // ✅ REAL CONTENT
        authorHandle: postContent.authorHandle,
        platform: signals.platform,
      });

      return profile;
    } catch (error) {
      logger.warn({ error, postId: signals.postId }, 'Semantic profile fetch failed');
      return DEFAULT_SEMANTIC_PROFILE;
    }
  }
}
```

**Test:** Add to `context-assembler.test.ts`:
```typescript
it('should fetch real post content when available', async () => {
  // Mock prisma response
  (prisma.post.findUnique as any).mockResolvedValue({
    content: 'Real post content here',
    authorHandle: '@testuser',
    createdAt: new Date(),
  });

  const context = await assembler.buildContext(validSignals);
  expect(context.semanticProfile.rationale).not.toContain('placeholder');
});
```

---

## PRIORITY 5: Implement LLM Semantic Analysis

**File:** `backend/src/generation/archetype-selection/context/semantic-profile-pipeline.ts`
**Lines:** 196-231

**Current:**
```typescript
private async runLLMAnalysis(...): Promise<Partial<SemanticProfile> | null> {
  // ... audit logging ...
  // TODO: Implement LLM analysis using DeepSeek or OpenAI
  logger.debug({ platform, contentLength: content.length }, 'LLM analysis not yet implemented');
  return null; // ❌ ALWAYS NULL
}
```

**Fix:** Implement real LLM call

```typescript
import { openai } from '@/utils/openai'; // Or deepseek client

private async runLLMAnalysis(
  content: string,
  platform: string,
  requestId: string
): Promise<Partial<SemanticProfile> | null> {
  const contentHash = this.hashContent(content);

  // Audit log for LLM API call
  logger.info(
    {
      requestId,
      timestamp: new Date().toISOString(),
      contentHash,
      piiRedactionStatus: this.config.enablePIIRedaction,
      llmProvider: this.config.llmProvider,
      platform,
      contentLength: content.length,
    },
    'LLM API call initiated'
  );

  try {
    const prompt = `Analyze this social media post and provide structured emotional analysis.

Post content:
"""
${content}
"""

Respond with JSON only:
{
  "emotions": {
    "joy": <0-1>,
    "sadness": <0-1>,
    "anger": <0-1>,
    "fear": <0-1>,
    "surprise": <0-1>,
    "disgust": <0-1>,
    "neutral": <0-1>
  },
  "urgency": <0-1>,
  "misinformationProbability": <0-1>,
  "humorDetected": <boolean>,
  "stance": "positive" | "negative" | "neutral" | "questioning",
  "rationale": "<brief explanation>"
}`;

    const response = await openai.chat.completions.create({
      model: this.config.llmProvider === 'openai' ? 'gpt-4o-mini' : 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are an expert at emotional and content analysis.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      emotionVector: result.emotions,
      urgency: result.urgency,
      misinformationProbability: result.misinformationProbability,
      humorDetected: result.humorDetected,
      stance: result.stance,
      rationale: result.rationale,
    };
  } catch (error) {
    logger.error({ error, requestId, contentHash }, 'LLM analysis failed');
    return null;
  }
}
```

**Test:** Add to `semantic-profile-pipeline.test.ts`:
```typescript
it('should call LLM API when enabled', async () => {
  const mockResponse = {
    choices: [
      {
        message: {
          content: JSON.stringify({
            emotions: { joy: 0.7, sadness: 0.1, anger: 0.0, fear: 0.0, surprise: 0.2, disgust: 0.0, neutral: 0.0 },
            urgency: 0.5,
            misinformationProbability: 0.1,
            humorDetected: true,
            stance: 'positive',
            rationale: 'Content expresses excitement and joy',
          }),
        },
      },
    ],
  };

  (openai.chat.completions.create as any).mockResolvedValue(mockResponse);

  const pipeline = new SemanticProfilePipeline({ enableLLM: true });
  const profile = await pipeline.run({
    postId: 'test-post',
    content: 'This is great news!',
    platform: 'twitter',
  });

  expect(profile.emotionVector.joy).toBeGreaterThan(0.5);
  expect(profile.humorDetected).toBe(true);
  expect(profile.rationale).toContain('excitement');
});
```

---

## PRIORITY 6: Implement ML Classifiers (Simplified Version)

**File:** `backend/src/generation/archetype-selection/context/semantic-profile-pipeline.ts`
**Lines:** 233-262

**Current:**
```typescript
private async runMLClassifiers(content: string): Promise<Partial<SemanticProfile> | null> {
  // TODO: Implement ML classifiers
  logger.debug({ contentLength: content.length }, 'ML classifiers not yet implemented');
  return { /* fake defaults */ };
}
```

**Fix:** Implement keyword-based classifiers as interim solution

```typescript
private async runMLClassifiers(content: string): Promise<Partial<SemanticProfile> | null> {
  try {
    // Keyword-based emotion detection (replace with real ML later)
    const emotionVector = this.detectEmotions(content);
    const urgency = this.detectUrgency(content);
    const misinformationProbability = this.detectMisinformationRisk(content);
    const toxicity = this.detectToxicity(content);

    return {
      emotionVector,
      urgency,
      misinformationProbability,
      humorDetected: this.detectHumor(content),
      stance: this.detectStance(content),
      toxicity,
    };
  } catch (error) {
    logger.error({ error }, 'ML classification failed');
    return null;
  }
}

private detectEmotions(content: string): EmotionVector {
  const lower = content.toLowerCase();

  // Simple keyword matching (replace with ML model)
  const joyWords = ['happy', 'great', 'excellent', 'wonderful', 'amazing', 'love'];
  const sadWords = ['sad', 'depressed', 'unhappy', 'disappointed', 'terrible'];
  const angerWords = ['angry', 'furious', 'outraged', 'hate', 'disgusted'];
  const fearWords = ['afraid', 'scared', 'worried', 'anxious', 'terrified'];

  const joyCount = joyWords.filter(w => lower.includes(w)).length;
  const sadCount = sadWords.filter(w => lower.includes(w)).length;
  const angerCount = angerWords.filter(w => lower.includes(w)).length;
  const fearCount = fearWords.filter(w => lower.includes(w)).length;

  const total = joyCount + sadCount + angerCount + fearCount || 1;

  return {
    joy: joyCount / total,
    sadness: sadCount / total,
    anger: angerCount / total,
    fear: fearCount / total,
    surprise: 0.0,
    disgust: 0.0,
    neutral: total === 0 ? 1.0 : 0.0,
  };
}

private detectUrgency(content: string): number {
  const lower = content.toLowerCase();
  const urgentWords = ['urgent', 'emergency', 'asap', 'immediately', 'critical', 'help', '!!!'];
  const count = urgentWords.filter(w => lower.includes(w)).length;
  return Math.min(1.0, count * 0.25);
}

private detectMisinformationRisk(content: string): number {
  const lower = content.toLowerCase();
  const riskPhrases = [
    'they don\'t want you to know',
    'the truth is',
    'wake up',
    'do your own research',
    'mainstream media won\'t tell you',
  ];
  const count = riskPhrases.filter(p => lower.includes(p)).length;
  return Math.min(1.0, count * 0.3);
}

private detectToxicity(content: string): number {
  const lower = content.toLowerCase();
  const toxicWords = ['stupid', 'idiot', 'moron', 'hate', 'kill', 'die'];
  const count = toxicWords.filter(w => lower.includes(w)).length;
  return Math.min(1.0, count * 0.2);
}

private detectHumor(content: string): boolean {
  const lower = content.toLowerCase();
  return lower.includes('lol') || lower.includes('haha') || lower.includes('😂') || lower.includes('🤣');
}

private detectStance(content: string): 'positive' | 'negative' | 'neutral' | 'questioning' {
  const lower = content.toLowerCase();
  if (lower.includes('?')) return 'questioning';

  const positiveWords = ['yes', 'agree', 'support', 'great', 'good'];
  const negativeWords = ['no', 'disagree', 'against', 'bad', 'wrong'];

  const posCount = positiveWords.filter(w => lower.includes(w)).length;
  const negCount = negativeWords.filter(w => lower.includes(w)).length;

  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  return 'neutral';
}
```

**Note:** Add comment in code:
```typescript
// TODO (Story 4.x): Replace keyword-based classifiers with trained ML models
// Current implementation uses simple keyword matching as interim solution
```

---

## PRIORITY 7: Implement Rotation Penalty

**File:** `backend/src/generation/archetype-selection/scoring/multi-factor-scorer.ts`
**Line:** 140

**Current:**
```typescript
const rotationPenalty = 0; // TODO: Implement from rotation store
```

**Fix:** Query Redis and calculate exponential decay

```typescript
private async calculateRotationPenalty(
  archetype: string,
  context: ArchetypeContext
): Promise<number> {
  try {
    // Query Redis for last usage timestamp
    const cacheKey = `rotation:${archetype}:${context.postId.split('-')[0]}`; // Shard by user
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
```

**Update calculateFactorBreakdown:**

```typescript
private async calculateFactorBreakdown(
  archetype: string,
  context: ArchetypeContext,
  weights: ScoringWeights
): Promise<FactorBreakdown> {
  const F1 = this.calculateF1_ModeIntent(archetype, context) * weights.F1_modeIntent;
  // ... other factors ...

  const rotationPenalty = await this.calculateRotationPenalty(archetype, context); // ✅ REAL
  const performanceBias = await this.calculatePerformanceBias(archetype, context); // Next step

  // ... rest unchanged
}
```

**Make score() async:**
```typescript
public async score(context: ArchetypeContext): Promise<ArchetypeScores> {
  const modeWeights = this.weights[context.mode] || this.weights.HELPFUL;
  const scores: ArchetypeScore[] = [];

  for (const archetype of ARCHETYPES) {
    const factorBreakdown = await this.calculateFactorBreakdown(archetype, context, modeWeights);
    // ... rest unchanged
  }
  // ... rest unchanged
}
```

**Update all callers:** Change `this.scorer.score(context)` to `await this.scorer.score(context)` in:
- `archetype-selector.ts:56`
- Integration tests

**Record usage:** Update `archetype-selector.ts` to store rotation after selection:

```typescript
private async recordTelemetry(
  signals: DecisionSignals,
  selection: SelectionDetail
): Promise<void> {
  try {
    // Record to telemetry sink
    const outcome: DecisionOutcome = { /* ... */ };
    await this.telemetrySink.recordOutcome(outcome);

    // Update rotation store
    const cacheKey = `rotation:${selection.archetype}:${signals.postId.split('-')[0]}`;
    await redis.set(cacheKey, new Date().toISOString(), 'EX', 86400 * 7); // 7 day TTL

  } catch (error) {
    logger.warn({ error }, 'Telemetry recording failed');
  }
}
```

**Test:** Add to `scoring/multi-factor-scorer.test.ts`:
```typescript
it('should apply rotation penalty for recently used archetypes', async () => {
  // Set recent usage in Redis
  await redis.set('rotation:COACH:test', new Date(Date.now() - 5 * 60 * 1000).toISOString());

  const scorer = new MultiFactorScorer();
  const scores = await scorer.score(mockContext);

  const coachScore = scores.scores.find(s => s.archetype === 'COACH');
  expect(coachScore.factorBreakdown.rotationPenalty).toBeLessThan(0);
});
```

---

## PRIORITY 8: Implement Performance Bias

**File:** `backend/src/generation/archetype-selection/scoring/multi-factor-scorer.ts`
**Line:** 141, 241-244

**Current:**
```typescript
const performanceBias = 0; // TODO: Implement from telemetry

private calculateF6_PerformanceMemory(_archetype: string, _context: ArchetypeContext): number {
  // TODO: Query telemetry for archetype performance
  return 0.5;
}
```

**Fix:** Query analytics database

```typescript
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

private async calculateF6_PerformanceMemory(
  archetype: string,
  context: ArchetypeContext
): Promise<number> {
  try {
    // Similar query but return normalized 0-1 score for factor
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
```

**Schema:** Ensure `DecisionOutcome` table exists in Prisma schema:

```prisma
// Add to schema.prisma if not exists
model DecisionOutcome {
  id                 String   @id @default(cuid())
  decisionId         String   @unique
  postId             String
  selectedArchetype  String
  engagementScore    Float    @default(0)
  timestamp          DateTime @default(now())

  @@index([selectedArchetype, timestamp])
  @@index([postId])
}
```

Run migration: `npx prisma migrate dev --name add-decision-outcomes`

---

## PRIORITY 9: Implement Kafka Event Publishing

**File:** `backend/src/generation/archetype-selection/learning/telemetry-sink.ts`
**Lines:** 14-21

**Current:**
```typescript
public async recordOutcome(outcome: DecisionOutcome): Promise<void> {
  try {
    logger.info({ decisionId: outcome.decisionId }, 'Recording decision outcome');
    // TODO: Store in analytics DB
    // TODO: Publish to Kafka topic 'decision.archetype.selected'
  } catch (error) {
    logger.error({ error }, 'Failed to record decision outcome');
  }
}
```

**Fix:** Implement both storage and Kafka publishing

```typescript
import { kafka } from '@/utils/kafka';
import { prisma } from '@/utils/prisma';

export class TelemetrySink {
  private kafkaProducer: any;
  private kafkaTopic = 'decision.archetype.selected';

  constructor() {
    this.initKafka();
    logger.info('TelemetrySink initialized');
  }

  private async initKafka() {
    try {
      this.kafkaProducer = kafka.producer();
      await this.kafkaProducer.connect();
      logger.info({ topic: this.kafkaTopic }, 'Kafka producer connected');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Kafka producer');
      this.kafkaProducer = null; // Fail gracefully
    }
  }

  public async recordOutcome(outcome: DecisionOutcome): Promise<void> {
    try {
      logger.info({ decisionId: outcome.decisionId }, 'Recording decision outcome');

      // 1. Store in analytics DB
      await this.storeInDatabase(outcome);

      // 2. Publish to Kafka
      await this.publishToKafka(outcome);

    } catch (error) {
      logger.error({ error, decisionId: outcome.decisionId }, 'Failed to record decision outcome');
    }
  }

  private async storeInDatabase(outcome: DecisionOutcome): Promise<void> {
    try {
      await prisma.decisionOutcome.create({
        data: {
          decisionId: outcome.decisionId,
          postId: outcome.postId,
          selectedArchetype: outcome.selectedArchetype,
          engagementScore: 0.0, // Updated later by analytics pipeline
          timestamp: outcome.timestamp,
        },
      });
      logger.debug({ decisionId: outcome.decisionId }, 'Outcome stored in DB');
    } catch (error) {
      logger.error({ error }, 'Database storage failed');
      throw error;
    }
  }

  private async publishToKafka(outcome: DecisionOutcome): Promise<void> {
    if (!this.kafkaProducer) {
      logger.warn('Kafka producer not available, skipping publish');
      return;
    }

    try {
      await this.kafkaProducer.send({
        topic: this.kafkaTopic,
        messages: [
          {
            key: outcome.postId,
            value: JSON.stringify({
              decisionId: outcome.decisionId,
              postId: outcome.postId,
              selectedArchetype: outcome.selectedArchetype,
              alternatives: outcome.alternatives,
              factorScores: outcome.factorScores,
              overrides: outcome.overrides,
              temperature: outcome.temperature,
              contextIds: outcome.contextIds,
              timestamp: outcome.timestamp.toISOString(),
            }),
          },
        ],
      });
      logger.debug({ decisionId: outcome.decisionId }, 'Published to Kafka');
    } catch (error) {
      logger.error({ error }, 'Kafka publish failed');
      // Don't throw - non-critical for selection pipeline
    }
  }

  public async disconnect(): Promise<void> {
    if (this.kafkaProducer) {
      await this.kafkaProducer.disconnect();
      logger.info('Kafka producer disconnected');
    }
  }
}
```

**Test:** Add to `learning/telemetry-sink.test.ts`:
```typescript
it('should publish to Kafka topic', async () => {
  const mockProducer = { send: jest.fn().mockResolvedValue({}) };
  (kafka.producer as any).mockReturnValue(mockProducer);

  const sink = new TelemetrySink();
  await sink.recordOutcome(mockOutcome);

  expect(mockProducer.send).toHaveBeenCalledWith(
    expect.objectContaining({
      topic: 'decision.archetype.selected',
      messages: expect.arrayContaining([
        expect.objectContaining({
          key: mockOutcome.postId,
        }),
      ]),
    })
  );
});
```

---

## PRIORITY 10: Fix Flexible Mode Boundary Threshold

**File:** `backend/src/generation/archetype-selection/strategy/strategic-decision-layer.ts`
**Lines:** 65-73

**Current:**
```typescript
private applyFlexibleBoundaries(scores: ArchetypeScores): ArchetypeScores {
  const topScore = scores.scores[0]?.score || 0;
  const filtered = scores.scores.filter((s) => s.score >= topScore - 0.15); // ❌ WRONG
  return { ...scores, scores: filtered };
}
```

**Fix:** Implement correct logic per AC3

```typescript
private applyFlexibleBoundaries(scores: ArchetypeScores): ArchetypeScores {
  // AC3: "Allow out-of-mode selections when margin > +0.08"
  const topScore = scores.scores[0]?.score || 0;
  const threshold = topScore - 0.08; // Use AC3 specified value

  const filtered = scores.scores.filter((s) => s.score >= threshold);

  logger.debug(
    {
      topScore,
      threshold,
      beforeCount: scores.scores.length,
      afterCount: filtered.length,
    },
    'Applied flexible mode boundaries'
  );

  return {
    ...scores,
    scores: filtered,
  };
}
```

**Test:** Add to `strategy/strategic-decision-layer.test.ts`:
```typescript
it('should apply 0.08 margin for flexible boundaries', () => {
  const mockScores = {
    scores: [
      { archetype: 'A', score: 0.90, /* ... */ },
      { archetype: 'B', score: 0.85, /* ... */ }, // 0.90 - 0.85 = 0.05 < 0.08 ✓ INCLUDE
      { archetype: 'C', score: 0.81, /* ... */ }, // 0.90 - 0.81 = 0.09 > 0.08 ✗ EXCLUDE
    ],
    variance: 0.02,
    timestamp: new Date(),
  };

  const layer = new StrategicDecisionLayer();
  const envelope = layer.applyPolicies(mockScores);

  expect(envelope.adjustedScores.length).toBe(2); // Only A and B
});
```

---

## SECONDARY PRIORITIES (Can Stage After P1-10)

### S1: Implement Competitor Archetype Detection

**File:** `backend/src/generation/archetype-selection/context/competitor-strategy-engine.ts`
**Line:** 125

Replace placeholder with pattern matching logic using competitor handle analysis.

### S2: Implement OpenTelemetry Spans

Add tracing spans per architecture doc section 8.

### S3: Wire buildDegradedContext() Method

Ensure `buildDegradedContext()` is called when `overallConfidence < 0.2` in `ContextAssembler`.

### S4: Implement Weight Optimizer

Create `learning/weight-optimizer.ts` for nightly batch job (AC5 requirement).

---

## VALIDATION CHECKLIST

After implementing all priorities, run:

1. **Tests:** `npm test -- backend/src/generation/archetype-selection`
   - Should still have 164+ tests passing
   - Add new tests for rotation, performance, Kafka

2. **Config File:** `ls config/archetype-scoring.yaml`
   - Must exist and load successfully

3. **Weight Validation:** `npm test -- scoring/__tests__/weight-validation.test.ts`
   - All modes must have F8 ≥ 0.05
   - All sums must equal 1.0 ± 0.01

4. **Integration Test:** Create manual test:
```typescript
const selector = new ArchetypeSelector();
const result = await selector.selectArchetype({
  postId: 'real-post-id',
  mode: 'HELPFUL',
  modeConfidence: 0.85,
  platform: 'reddit',
  timestamp: new Date().toISOString(),
});

console.log('Selected:', result.archetype);
console.log('Rotation penalty:', result.factorBreakdown.rotationPenalty);
console.log('Performance bias:', result.factorBreakdown.performanceBias);
console.log('Reason:', result.reason);
```

5. **Database:** Check `DecisionOutcome` table has records after test

6. **Kafka:** Check topic `decision.archetype.selected` has messages

7. **Redis:** Check keys like `rotation:COACH:*` exist

---

## IMPLEMENTATION ORDER

1. P1: Fix validation crash (15 min)
2. P2: Fix weight violation (10 min)
3. P3: Create config file (30 min)
4. P4: Post content fetching (45 min)
5. P5: LLM semantic analysis (60 min)
6. P6: ML classifiers (45 min)
7. P7: Rotation penalty (60 min)
8. P8: Performance bias (60 min)
9. P9: Kafka publishing (45 min)
10. P10: Fix boundary threshold (10 min)

**Total estimated time: ~6 hours**

---

## SUCCESS CRITERIA

✅ All 10 priorities implemented
✅ No TODOs in production code paths
✅ Config file exists and loads
✅ Tests pass (164+)
✅ Integration test shows real rotation penalties ≠ 0
✅ Integration test shows real performance bias ≠ 0
✅ Kafka messages published on selection
✅ Database stores decision outcomes
✅ Validation no longer throws errors
✅ F8 weights respect 0.05-0.10 range in all modes
