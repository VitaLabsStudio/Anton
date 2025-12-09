import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

import NodeCache from 'node-cache';
import seedrandom from 'seedrandom';
import { trace } from '@opentelemetry/api';

import type {
  HolidayConfig,
  TemporalContext,
  TemporalRule,
  TemporalStrategy,
  TemporalExperiment,
} from '../config/temporal-schema.js';
import { TemporalHolidaysConfigSchema, TemporalRulesConfigSchema } from '../config/temporal-schema.js';
import { logger } from '../utils/logger.js';

import type { IHolidayService } from './temporal-rule-engine.js';
import { RuleEngine } from './temporal-rule-engine.js';
import { defaultStrategy, StrategyMerger } from './temporal-strategy-merger.js';
import { LuxonTimeProvider, TimeProvider } from '../services/time-provider.js';
import { HolidayService } from '../services/holiday-service.js';
import { metricsCollector } from '../observability/metrics-registry.js';

const DEFAULT_CACHE_TTL_MS = 60_000;

const toSeconds = (ms: number): number => Math.max(1, Math.floor(ms / 1000));
const resolveCacheTtlMs = (override?: number): number => {
  if (typeof override === 'number' && Number.isFinite(override) && override > 0) {
    return override;
  }

  const envValue = process.env.TEMPORAL_CACHE_TTL;
  if (envValue) {
    const parsed = Number.parseInt(envValue, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return DEFAULT_CACHE_TTL_MS;
};

const resolveDefaultRulesPath = (): string => {
  const envPath = process.env.TEMPORAL_RULES_PATH;
  if (envPath) {
    return path.resolve(process.cwd(), envPath);
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '../config/temporal-rules.json');
};

const resolveDefaultHolidaysPath = (): string => {
  const envPath = process.env.TEMPORAL_HOLIDAYS_PATH;
  if (envPath) {
    return path.resolve(process.cwd(), envPath);
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '../config/temporal-holidays.json');
};

class RuleLoader {
  private readonly rulesPath: string;

  constructor(rulesPath: string = resolveDefaultRulesPath()) {
    this.rulesPath = rulesPath;
  }

  loadRules(): TemporalRule[] {
    if (!fs.existsSync(this.rulesPath)) {
      logger.warn({ rulesPath: this.rulesPath }, 'temporal-rules.json not found. Using empty rule set.');
      return [];
    }

    try {
      const fileContent = fs.readFileSync(this.rulesPath, 'utf-8');
      const config = JSON.parse(fileContent);
      const validatedConfig = TemporalRulesConfigSchema.parse(config);
      return validatedConfig.rules.filter((rule) => rule.enabled);
    } catch (error) {
      logger.error({ error, rulesPath: this.rulesPath }, 'Failed to load or parse temporal-rules.json');
      return [];
    }
  }
}

class HolidayLoader {
  private readonly holidaysPath: string;

  constructor(holidaysPath: string = resolveDefaultHolidaysPath()) {
    this.holidaysPath = holidaysPath;
  }

  loadHolidays(): HolidayConfig[] {
    if (!fs.existsSync(this.holidaysPath)) {
      logger.warn({ holidaysPath: this.holidaysPath }, 'temporal-holidays.json not found. Using empty holiday set.');
      return [];
    }

    try {
      const fileContent = fs.readFileSync(this.holidaysPath, 'utf-8');
      const config = JSON.parse(fileContent);
      const validated = TemporalHolidaysConfigSchema.parse(config);
      return validated.holidays;
    } catch (error) {
      logger.error({ error, holidaysPath: this.holidaysPath }, 'Failed to load or parse temporal-holidays.json');
      return [];
    }
  }
}

interface TemporalIntelligenceOptions {
  rules?: TemporalRule[];
  holidays?: HolidayConfig[];
  experiments?: TemporalExperiment[];
  holidayService?: IHolidayService;
  timeProvider?: TimeProvider;
  cache?: NodeCache;
  cacheTtlMs?: number;
  ruleEngine?: RuleEngine;
  strategyMerger?: StrategyMerger;
}

export class TemporalIntelligence {
  private ruleEngine: RuleEngine;
  private strategyMerger: StrategyMerger;
  private readonly timeProvider: TimeProvider;
  private readonly cache: NodeCache;
  private experiments: TemporalExperiment[] = [];

  constructor(options: TemporalIntelligenceOptions = {}) {
    this.timeProvider = options.timeProvider ?? new LuxonTimeProvider();
    const staticRules = options.rules ?? [];
    const holidays = options.holidays ?? [];
    this.experiments = options.experiments ?? [];
    
    const holidayService =
      options.holidayService ??
      (options.holidays ? new HolidayService(options.holidays) : undefined);
      
    // Generate dynamic rules from holidays
    const dynamicRules = this.generateHolidayRules(holidays);
    const allRules = [...staticRules, ...dynamicRules];

    this.ruleEngine = options.ruleEngine ?? new RuleEngine(allRules, holidayService);
    this.strategyMerger = options.strategyMerger ?? new StrategyMerger();

    const cacheTtlMs = resolveCacheTtlMs(options.cacheTtlMs);
    this.cache =
      options.cache ??
      new NodeCache({
        stdTTL: toSeconds(cacheTtlMs),
        checkperiod: toSeconds(cacheTtlMs),
      });
  }

  private generateHolidayRules(holidays: HolidayConfig[]): TemporalRule[] {
    const rules: TemporalRule[] = [];

    for (const holiday of holidays) {
      // Morning rule for this specific holiday
      rules.push({
        id: `${holiday.id}_morning`,
        name: `${holiday.name} Morning Boost`,
        priority: 100,
        enabled: true,
        condition: { type: 'holiday', holidayId: holiday.id },
        strategy: {
          phase: 'holiday',
          monitoringMultiplier: holiday.monitoringBoost || 5.0,
          isPriority: true,
        },
      });

      // Pre-holiday rule
      if (holiday.prePreventionDays) {
        rules.push({
          id: `${holiday.id}_pre`,
          name: `${holiday.name} Pre-Prevention`,
          priority: 90,
          enabled: true,
          condition: { type: 'pre_holiday', days: holiday.prePreventionDays },
          strategy: {
            phase: 'prevention',
            monitoringMultiplier: 1.5,
            sssThresholdAdjustment: -0.1,
          },
        });
      }

      // Post-holiday rule
      if (holiday.postRecoveryDays) {
        rules.push({
          id: `${holiday.id}_post`,
          name: `${holiday.name} Post-Recovery`,
          priority: 85,
          enabled: true,
          condition: { type: 'post_holiday', days: holiday.postRecoveryDays },
          strategy: {
            phase: 'holiday',
            monitoringMultiplier: 2.0,
            archetypePreferences: ['COACH', 'CREDIBILITY_ANCHOR'],
          },
        });
      }
    }

    return rules;
  }

  setConfig(rules: TemporalRule[], holidays?: HolidayConfig[], experiments?: TemporalExperiment[]): void {
    const holidayService = holidays ? new HolidayService(holidays) : undefined;
    const dynamicRules = holidays ? this.generateHolidayRules(holidays) : [];
    const allRules = [...rules, ...dynamicRules];
    
    this.ruleEngine = new RuleEngine(allRules, holidayService);
    if (experiments) this.experiments = experiments;
    this.cache.flushAll();
  }

  private applyExperiment(context: TemporalContext): TemporalContext {
    // 1. Legacy env var support
    const experimentId = process.env.TEMPORAL_EXPERIMENT_ID;
    if (experimentId) {
      const seed = `${experimentId}:${context.phase ?? 'normal'}:${context.localTime ?? ''}`;
      const rng = seedrandom(seed);
      const variant = rng() < 0.5 ? 'A' : 'B';

      return {
        ...context,
        experimentId,
        variant,
      };
    }

    // 2. Multi-experiment support
    for (const exp of this.experiments) {
      if (exp.status !== 'running') continue;

      const seed = `${exp.id}:${context.phase ?? 'normal'}:${context.localTime ?? ''}`;
      const rng = seedrandom(seed);
      
      if (rng() < exp.trafficAllocation) {
        // Simple 50/50 variant selection for now
        const variantKey = rng() < 0.5 ? 'A' : 'B';
        const variant = exp.variants.find(v => v.id === (variantKey === 'A' ? exp.variants[0].id : exp.variants[1].id));
        
        if (variant) {
            return {
                ...context,
                experimentId: exp.id,
                variant: variant.id,
                // In a full implementation, we would merge variant.ruleOverrides here
            };
        }
      }
    }

    return context;
  }

  getTemporalContext(date?: Date): TemporalContext {
    const tracer = trace.getTracer('temporal-intelligence');
    const span = tracer.startSpan('temporal.evaluate_rules');

    const start = performance.now();
    const context = this.timeProvider.getContext(date);
    const cacheKey = `${context.timezone}:${context.local.toISODate()}:${context.local.hour}`;

    const cachedStrategy = this.cache.get<TemporalContext>(cacheKey);
    if (cachedStrategy) {
      metricsCollector.increment('temporal_strategy_cache_hit');
      span.addEvent('cache_hit');
      span.end();
      return { ...cachedStrategy, cacheHit: true };
    }

    metricsCollector.increment('temporal_strategy_cache_miss');

    try {
      const matchedRules = this.ruleEngine.evaluate(context);
      const finalStrategy = this.strategyMerger.merge(matchedRules);

      let strategyWithContext: TemporalContext = {
        ...finalStrategy,
        matchedRules: matchedRules.map((r) => r.ruleId),
        evaluatedAt: context.local.toISO(),
        timezone: context.timezone,
        localTime: context.local.toISO(),
        cacheHit: false,
      };
      strategyWithContext = this.applyExperiment(strategyWithContext);

      const duration = performance.now() - start;
      matchedRules.forEach((r) =>
        metricsCollector.increment('temporal_rule_evaluation', { rule_id: r.ruleId })
      );
      metricsCollector.record('temporal_context_latency_ms', duration);
      metricsCollector.increment('temporal_context_latency_count');

      span.setAttributes({
        'temporal.phase': strategyWithContext.phase,
        'temporal.rules_matched': strategyWithContext.matchedRules.length,
        'temporal.multiplier': strategyWithContext.monitoringMultiplier,
        'temporal.experiment': strategyWithContext.experimentId,
        'temporal.variant': strategyWithContext.variant,
      });

      logger.info(
        {
          phase: strategyWithContext.phase,
          rules_matched: strategyWithContext.matchedRules,
          multiplier: strategyWithContext.monitoringMultiplier ?? 1,
          sss_threshold_adjustment: strategyWithContext.sssThresholdAdjustment ?? 0,
          evaluation_time_ms: Number(duration.toFixed(3)),
          cache_hit: false,
          timezone: strategyWithContext.timezone,
          local_time: strategyWithContext.localTime,
        },
        'temporal_context_evaluated'
      );

      this.cache.set(cacheKey, strategyWithContext);
      return strategyWithContext;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2 }); // Error
      logger.error({ error }, 'Failed to compute temporal context, returning default strategy');
      const fallback: TemporalContext = {
        ...defaultStrategy,
        matchedRules: [],
        evaluatedAt: context.local.toISO(),
        timezone: context.timezone,
        localTime: context.local.toISO(),
        cacheHit: false,
      };
      metricsCollector.increment('temporal_context_latency_count');
      return fallback;
    } finally {
      span.end();
    }
  }
}

// Singleton instance + helpers
const ruleLoader = new RuleLoader();
const holidayLoader = new HolidayLoader();
const temporalIntelligence = new TemporalIntelligence({
  rules: ruleLoader.loadRules(),
  holidays: holidayLoader.loadHolidays(),
});

export const getTemporalContext = temporalIntelligence.getTemporalContext.bind(temporalIntelligence);
export const reloadTemporalConfig = (): { rules: TemporalRule[]; holidays: HolidayConfig[] } => {
  const rules = ruleLoader.loadRules();
  const holidays = holidayLoader.loadHolidays();
  temporalIntelligence.setConfig(rules, holidays);
  return { rules, holidays };
};

// For decision-engine compatibility
export interface TemporalSignal {
  context: TemporalContext;
  timestamp: Date;
}
