import { performance } from 'node:perf_hooks';

import type { Author } from '@prisma/client';

import { DeepSeekClient } from '../clients/deepseek.js';
import { OpenAIClient } from '../clients/openai.js';
import type { MetricsAdapter } from '../observability/metrics-adapter.js';
import { metricsCollector } from '../observability/metrics-registry.js';
import { logger } from '../utils/logger.js';

export enum SafetySeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface SafetyCheck {
  severity: SafetySeverity;
  category: string;
  keyword: string;
  requiresContextCheck: boolean;
}

export interface LLMAssessment {
  model: string;
  classification: 'GENUINE_CONCERN' | 'HYPERBOLE' | 'CASUAL_MENTION';
  confidence: number;
  reasoning: string;
  latencyMs?: number;
}

export interface SafetyResource {
  category: string;
  resource: string;
  message: string;
}

export interface SafetySignal {
  shouldDisengage: boolean;
  flags: string[];
  severity: SafetySeverity | null;
  distressProbability: number;
  contextCheckPerformed: boolean;
  llmAssessment?: LLMAssessment;
  resources?: SafetyResource[];
  disclaimer?: string;
}

export interface SafetyAuditLog {
  timestamp: Date;
  postId: string;
  authorId: string;
  content: string;
  flags: string[];
  severity: SafetySeverity | null;
  shouldDisengage: boolean;
  distressProbability: number;
  contextCheckPerformed: boolean;
  llmAssessment?: LLMAssessment;
  reasoning: string;
}

interface SafetyPattern extends Omit<SafetyCheck, 'keyword'> {
  patterns: RegExp[];
}

const CONTEXT_ASSESSMENT_PROMPT = `You are a safety classifier for a hangover remedy product's social media bot.

Analyze this post for GENUINE safety concerns vs hyperbole/casual mention:

POST: "{content}"
FLAGGED KEYWORDS: {keywords}
CATEGORY: {category}

Classify as ONE of:
A) GENUINE_CONCERN - Real medical/safety crisis requiring immediate professional help
B) HYPERBOLE - Exaggeration/joke about hangover symptoms (e.g., "I'm dying", "this is killing me")
C) CASUAL_MENTION - Historical/third-party reference, not current personal crisis

Examples:
- "I'm dying from this hangover lol" → HYPERBOLE
- "Can't stop vomiting for 8 hours, feel cold" → GENUINE_CONCERN
- "High school reunion was wild" → CASUAL_MENTION
- "I'm 17 and have a hangover" → GENUINE_CONCERN
- "Grandma's funeral yesterday, brutal hangover today" → CASUAL_MENTION

Respond ONLY with: A, B, or C followed by a brief 1-sentence reason.`;

const MEDICAL_DISCLAIMER =
  '⚠️ Not medical advice. Severe or persistent symptoms? Seek professional help.';

const SAFETY_RESOURCES: Record<string, SafetyResource> = {
  SUICIDE_SELF_HARM: {
    category: 'SUICIDE_SELF_HARM',
    resource: '988 Suicide & Crisis Lifeline',
    message: 'If you are in crisis, please call 988 or text "HELLO" to 741741',
  },
  ALCOHOL_POISONING: {
    category: 'ALCOHOL_POISONING',
    resource: '911 Emergency Services',
    message: 'Alcohol poisoning is a medical emergency. Call 911 immediately.',
  },
  MEDICAL_EMERGENCY: {
    category: 'MEDICAL_EMERGENCY',
    resource: '911 Emergency Services',
    message: 'Please seek immediate medical attention. Call 911.',
  },
};

const SAFETY_PATTERNS: SafetyPattern[] = [
  {
    category: 'SUICIDE_SELF_HARM',
    severity: SafetySeverity.CRITICAL,
    requiresContextCheck: false,
    patterns: [
      /\b(want to|going to|thinking about)\s+(kill|end|hurt)\s+(myself|my life|it all)\b/i,
      /\bsuicide\b/i,
      /\bnot worth living\b/i,
      /\bcan'?t go on\b/i,
      /\bending it all\b/i,
      /\bharm myself\b/i,
      /\bbetter off dead\b/i,
      /\bno reason to live\b/i,
    ],
  },
  {
    category: 'ALCOHOL_POISONING',
    severity: SafetySeverity.CRITICAL,
    requiresContextCheck: false,
    patterns: [
      /\bcan'?t stop (vomiting|throwing up|puking)\b/i,
      /\bvomit(ing|ed)\s+(blood|red)\b/i,
      /\bblacked?\s*out\b/i,
      /\b(passed out|unconscious)\b/i,
      /\bcold\s+(and\s+)?clammy\b/i,
      /\b(irregular|slow|shallow)\s+breathing\b/i,
      /\bhypothermia\b/i,
      /\bpale\s+skin\b/i,
      /\bskin\s+(looks\s+)?pale\b/i,
      /\bconfused\s+(and|or)\s+(can'?t|unable)\b/i,
      /\bseizure\b/i,
      /\bchok(ing|ed)\s+on\s+vomit\b/i,
    ],
  },
  {
    category: 'MEDICAL_EMERGENCY',
    severity: SafetySeverity.CRITICAL,
    requiresContextCheck: false,
    patterns: [
      /\b(calling|called)\s+911\b/i,
      /\b(in|at|going to)\s+(the\s+)?(ER|emergency room)\b/i,
      /\b(headed|heading)\s+to\s+(the\s+)?(ER|emergency room)\b/i,
      /\bambulance\b/i,
      /\bchest pain\b/i,
      /\bheart attack\b/i,
      /\bstroke\b/i,
      /\bmedical emergency\b/i,
      /\bcan'?t breathe\b/i,
      /\binternal bleeding\b/i,
    ],
  },
  {
    category: 'MINORS_CLEAR',
    severity: SafetySeverity.CRITICAL,
    requiresContextCheck: false,
    patterns: [
      /\b(I'm|I am)\s+(13|14|15|16|17)\b/i,
      /\b(13|14|15|16|17)\s+year\s+old\b/i,
      /\bunderage\s+drinking\b/i,
      /\bteen(age|ager)?\s+(party|drinking)\b/i,
      /\bmiddle school\b/i,
      /\bjunior high\b/i,
    ],
  },
  {
    category: 'ABNORMAL_SEVERITY',
    severity: SafetySeverity.CRITICAL,
    requiresContextCheck: false,
    patterns: [
      /\b(day|been)\s+[3-9]\b/i,
      /\b(third|fourth|fifth|sixth|seventh)\s+day\b/i,
      /\bworse than (ever|anything|usual)\b/i,
      /\bcan'?t\s+(walk|stand|see|think|function)\b/i,
      /\b(vision|sight)\s+(?:is\s+)?(blurry|double|problems?|loss)\b/i,
      /\bseeing\s+double\b/i,
      /\bhallucinating\b/i,
      /\btremors?\b/i,
      /\bshaking\s+(hands|uncontrollably)\b/i,
      /\bwithdr(awal|awing)\b/i,
    ],
  },
  {
    category: 'PREGNANCY',
    severity: SafetySeverity.HIGH,
    requiresContextCheck: true,
    patterns: [
      /\b(I'm|I am)\s+(pregnant|expecting)\b/i,
      /\bpregnant\b/i,
      /\bbreastfeeding\b/i,
      /\bnursing\s+(mom|mother)\b/i,
      /\b(first|second|third)\s+trimester\b/i,
      /\bdue\s+in\s+\d+\s+months?\b/i,
    ],
  },
  {
    category: 'MEDICATION_INTERACTION',
    severity: SafetySeverity.HIGH,
    requiresContextCheck: true,
    patterns: [
      /\b(on|taking)\s+.{0,20}(warfarin|coumadin|blood\s+thinner)\b/i,
      /\b(on|taking)\s+.{0,20}(SSRI|antidepressant|prozac|zoloft|lexapro)\b/i,
      /\b(on|taking)\s+.{0,20}(lithium|mood\s+stabilizer)\b/i,
      /\bheart\s+medication\b/i,
      /\blive?r\s+medication\b/i,
      /\bkidney\s+medication\b/i,
      /\bdiabetic\b/i,
      /\binsulin\b/i,
    ],
  },
  {
    category: 'CHRONIC_CONDITIONS',
    severity: SafetySeverity.HIGH,
    requiresContextCheck: true,
    patterns: [
      /\blive?r\s+(disease|problems|cirrhosis|damage|failure)\b/i,
      /\bkidney\s+(disease|problems|failure)\b/i,
      /\bhepatitis\b/i,
      /\bdialysis\b/i,
      /\btransplant\b/i,
      /\bchronic\s+(condition|illness)\b/i,
    ],
  },
  {
    category: 'ADDICTION_RECOVERY',
    severity: SafetySeverity.HIGH,
    requiresContextCheck: true,
    patterns: [
      /\b(going to|at)\s+AA\s+meeting\b/i,
      /\b\d+\s+(months?|years?|days?)\s+sober\b/i,
      /\b(afraid of|worried about)\s+relaps(e|ing)\b/i,
      /\brecovery\s+(is|journey|program)\b/i,
      /\bsobriety\b/i,
      /\brehab\b/i,
      /\b12\s+steps?\b/i,
    ],
  },
  {
    category: 'DEATH_HYPERBOLE',
    severity: SafetySeverity.MEDIUM,
    requiresContextCheck: true,
    patterns: [
      /\b(I'm|I am|feel(ing)?|felt)\s+(dying|dead|kill(ing|ed))\b/i,
      /\bfeel(?:s)?\s+like\s+death\b/i,
      /\bfuneral\s+for\s+my\s+\w+\b/i,
      /\b(this|it)\s+is\s+killing\s+me\b/i,
      /\bkill(?:ing)?\s+my\s+(liver|brain|kidneys?)\b/i,
    ],
  },
  {
    category: 'HOSPITAL_MENTION',
    severity: SafetySeverity.MEDIUM,
    requiresContextCheck: true,
    patterns: [/\bhospital\b/i, /\bdoctor\b/i, /\bnurse\b/i],
  },
  {
    category: 'MINORS_UNCLEAR',
    severity: SafetySeverity.MEDIUM,
    requiresContextCheck: true,
    patterns: [/\bhigh\s+school\b/i, /\bcollege\s+freshman\b/i, /\bfreshman\s+year\b/i],
  },
];

const FALLBACK_SIGNAL: SafetySignal = {
  shouldDisengage: true,
  flags: ['SAFETY_FALLBACK'],
  severity: SafetySeverity.CRITICAL,
  distressProbability: 1,
  contextCheckPerformed: false,
  resources: [],
  disclaimer: MEDICAL_DISCLAIMER,
};

const SEVERITY_PRIORITY: SafetySeverity[] = [
  SafetySeverity.CRITICAL,
  SafetySeverity.HIGH,
  SafetySeverity.MEDIUM,
  SafetySeverity.LOW,
];

export class SafetyProtocol {
  private readonly deepseek: DeepSeekClient;
  private readonly openai: OpenAIClient;
  private readonly metrics: MetricsAdapter;

  constructor(deps?: {
    deepseek?: DeepSeekClient;
    openai?: OpenAIClient;
    metrics?: MetricsAdapter;
  }) {
    this.deepseek =
      deps?.deepseek ??
      new DeepSeekClient({
        timeoutMs: 3000,
        maxRetries: 1,
        model: 'deepseek-reasoner',
        systemPrompt: 'You are a safety classification assistant.',
      });
    this.openai =
      deps?.openai ??
      new OpenAIClient({
        timeoutMs: 2000,
        maxRetries: 1,
        model: 'gpt-5-nano-2025-08-07',
      });
    this.metrics = deps?.metrics ?? metricsCollector;
  }

  async checkSafetyProtocol(
    content: string,
    author?: Author,
    postId?: string
  ): Promise<SafetySignal> {
    try {
      const normalizedContent = content ?? '';
      const checks = detectAllKeywords(normalizedContent);

      for (const check of checks) {
        this.metrics.increment('safety.trigger_total', {
          severity: check.severity,
          category: check.category,
        });
      }

      const criticalChecks = checks.filter((check) => check.severity === SafetySeverity.CRITICAL);
      if (criticalChecks.length > 0) {
        const distress = calculateDistressProbability(normalizedContent, author, criticalChecks);
        const flags = uniqueCategories(criticalChecks);
        const resources = buildResources(flags);
        const signal: SafetySignal = {
          shouldDisengage: true,
          flags,
          severity: SafetySeverity.CRITICAL,
          distressProbability: distress,
          contextCheckPerformed: false,
          resources,
          disclaimer: MEDICAL_DISCLAIMER,
        };

        this.logSafetyEvent({
          timestamp: new Date(),
          postId: postId ?? 'unknown',
          authorId: author?.id ?? 'unknown',
          content: normalizedContent.slice(0, 200),
          flags,
          severity: SafetySeverity.CRITICAL,
          shouldDisengage: true,
          distressProbability: distress,
          contextCheckPerformed: false,
          reasoning: `Critical safety triggers: ${flags.join(', ')}`,
        });

        return signal;
      }

      const contextualChecks = checks.filter(
        (check) =>
          check.severity === SafetySeverity.HIGH || check.severity === SafetySeverity.MEDIUM
      );

      if (contextualChecks.length > 0) {
        const llmAssessment = await this.assessWithLLM(normalizedContent, contextualChecks);
        const distress = calculateDistressProbability(
          normalizedContent,
          author,
          contextualChecks,
          llmAssessment
        );

        const shouldDisengage = llmAssessment.classification === 'GENUINE_CONCERN';
        const flags = shouldDisengage ? uniqueCategories(contextualChecks) : [];
        const severity =
          contextualChecks.sort(compareSeverity)[0]?.severity ?? SafetySeverity.MEDIUM;

        if (llmAssessment.classification === 'HYPERBOLE') {
          this.metrics.increment('safety.false_positive_suspected', {
            category: contextualChecks[0].category,
          });
        }

        const signal: SafetySignal = {
          shouldDisengage,
          flags,
          severity,
          distressProbability: distress,
          contextCheckPerformed: true,
          llmAssessment,
          resources: shouldDisengage ? buildResources(flags) : [],
          disclaimer: MEDICAL_DISCLAIMER,
        };

        this.logSafetyEvent({
          timestamp: new Date(),
          postId: postId ?? 'unknown',
          authorId: author?.id ?? 'unknown',
          content: normalizedContent.slice(0, 200),
          flags,
          severity,
          shouldDisengage,
          distressProbability: distress,
          contextCheckPerformed: true,
          llmAssessment,
          reasoning: shouldDisengage
            ? `LLM classified as genuine concern (${llmAssessment.model})`
            : `LLM classified as ${llmAssessment.classification} (${llmAssessment.model})`,
        });

        return signal;
      }

      return {
        shouldDisengage: false,
        flags: [],
        severity: null,
        distressProbability: 0.0,
        contextCheckPerformed: false,
        disclaimer: MEDICAL_DISCLAIMER,
      };
    } catch (error) {
      logger.error({ error }, 'SafetyProtocol: fallback engaged');
      return FALLBACK_SIGNAL;
    }
  }

  private async assessWithLLM(content: string, matches: SafetyCheck[]): Promise<LLMAssessment> {
    const keywords = matches.map((match) => match.keyword).join(', ');
    const category = matches[0]?.category ?? 'UNKNOWN';
    const prompt = CONTEXT_ASSESSMENT_PROMPT.replace('{content}', content)
      .replace('{keywords}', keywords)
      .replace('{category}', category);

    const start = performance.now();
    try {
      const response = await this.deepseek.generate(prompt, { temperature: 0.1, maxTokens: 50 });
      const latencyMs = Math.round(performance.now() - start);
      const assessment = parseAssessment(response.content, 'deepseek-reasoner', latencyMs);
      this.recordLLMMetrics(assessment);
      return assessment;
    } catch (error) {
      logger.warn({ error }, 'DeepSeek-R1 failed, trying GPT-5 Nano');
      try {
        const response = await this.openai.generate(prompt, { temperature: 0.1, maxTokens: 50 });
        const latencyMs = Math.round(performance.now() - start);
        const assessment = parseAssessment(response.content, 'gpt-5-nano-2025-08-07', latencyMs);
        this.recordLLMMetrics(assessment);
        return assessment;
      } catch (fallbackError) {
        const latencyMs = Math.round(performance.now() - start);
        logger.error({ fallbackError }, 'All LLM providers failed, using conservative default');

        const assessment: LLMAssessment = {
          model: 'fallback',
          classification: 'GENUINE_CONCERN',
          confidence: 0.5,
          reasoning: 'LLM unavailable, conservative default',
          latencyMs,
        };
        this.recordLLMMetrics(assessment);
        return assessment;
      }
    }
  }

  private recordLLMMetrics(assessment: LLMAssessment): void {
    this.metrics.increment('safety.llm_assessment_total', {
      model: assessment.model,
      classification: assessment.classification,
    });
    if (assessment.latencyMs !== undefined) {
      this.metrics.record?.('safety.llm_latency_ms', assessment.latencyMs, {
        model: assessment.model,
      });
    }
  }

  private logSafetyEvent(audit: SafetyAuditLog): void {
    logger.info({ safetyAudit: audit }, 'safety_protocol_audit');
  }
}

export const detectAllKeywords = (content: string): SafetyCheck[] => {
  const matches: SafetyCheck[] = [];
  const normalized = content ?? '';

  for (const pattern of SAFETY_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(normalized)) {
        matches.push({
          category: pattern.category,
          severity: pattern.severity,
          keyword: regex.source,
          requiresContextCheck: pattern.requiresContextCheck,
        });
      }
    }
  }

  return matches;
};

export const calculateDistressProbability = (
  content: string,
  author: Author | undefined,
  checks: SafetyCheck[],
  llmAssessment?: LLMAssessment
): number => {
  let probability = 0.0;

  const criticalCount = checks.filter((check) => check.severity === SafetySeverity.CRITICAL).length;
  const highCount = checks.filter((check) => check.severity === SafetySeverity.HIGH).length;

  if (criticalCount > 0) {
    probability += 0.7;
  } else if (highCount > 0) {
    probability += 0.4;
  }

  if (checks.length > 1) {
    probability += Math.min(checks.length * 0.1, 0.3);
  }

  if (llmAssessment) {
    if (llmAssessment.classification === 'GENUINE_CONCERN') {
      probability += 0.3 * llmAssessment.confidence;
    } else if (llmAssessment.classification === 'HYPERBOLE') {
      probability -= 0.4;
    }
  }

  const intensifiers = [
    /\bcan'?t\b/i,
    /\bwon'?t\b/i,
    /\bhelp\s+me\b/i,
    /\bplease\b/i,
    /\bdesperate\b/i,
    /\bscared\b/i,
    /\bworried\b/i,
  ];

  const intensifierCount = intensifiers.filter((pattern) => pattern.test(content)).length;
  probability += Math.min(intensifierCount * 0.05, 0.2);

  if (author?.interactionHistory) {
    const history = author.interactionHistory as Array<{ type?: string }>;
    const hasPriorSafetyConcern = history.some((entry) => entry?.type === 'safety_concern');
    if (hasPriorSafetyConcern) {
      probability += 0.15;
    }
  }

  return Math.max(0.0, Math.min(1.0, probability));
};

const buildResources = (categories: string[]): SafetyResource[] => {
  return categories
    .map((category) => SAFETY_RESOURCES[category])
    .filter((resource): resource is SafetyResource => Boolean(resource));
};

const uniqueCategories = (checks: SafetyCheck[]): string[] => {
  return Array.from(new Set(checks.map((check) => check.category)));
};

const compareSeverity = (a: SafetyCheck, b: SafetyCheck): number => {
  return SEVERITY_PRIORITY.indexOf(a.severity) - SEVERITY_PRIORITY.indexOf(b.severity);
};

const parseAssessment = (response: string, model: string, latencyMs?: number): LLMAssessment => {
  const normalized = response?.trim().toUpperCase() ?? '';

  let classification: LLMAssessment['classification'];
  let reasoning = '';

  if (normalized.startsWith('A')) {
    classification = 'GENUINE_CONCERN';
    reasoning = response.substring(1).trim();
  } else if (normalized.startsWith('B')) {
    classification = 'HYPERBOLE';
    reasoning = response.substring(1).trim();
  } else if (normalized.startsWith('C')) {
    classification = 'CASUAL_MENTION';
    reasoning = response.substring(1).trim();
  } else {
    logger.warn({ response, model }, 'Failed to parse LLM response, using conservative default');
    classification = 'GENUINE_CONCERN';
    reasoning = 'Failed to parse LLM response, using conservative default';
  }

  return {
    model,
    classification,
    confidence: 0.8,
    reasoning,
    latencyMs,
  };
};

const safetyProtocol = new SafetyProtocol();

export const checkSafetyProtocol = (
  content: string,
  author?: Author,
  postId?: string
): Promise<SafetySignal> => safetyProtocol.checkSafetyProtocol(content, author, postId);
