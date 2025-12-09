import '../../env-config';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import NodeCache from 'node-cache';

import { TemporalIntelligence } from '../../../src/analysis/temporal-intelligence.js';
import { RuleEngine } from '../../../src/analysis/temporal-rule-engine.js';
import { defaultStrategy, StrategyMerger } from '../../../src/analysis/temporal-strategy-merger.js';
import { LuxonTimeProvider, MockTimeProvider } from '../../../src/services/time-provider.js';
import type { TemporalRule } from '../../../src/config/temporal-schema.js';

describe('TemporalIntelligence Service', () => {
  let timeProvider: MockTimeProvider;
  let cache: NodeCache;
  let ruleEngine: RuleEngine;
  let strategyMerger: StrategyMerger;
  let temporalIntelligence: TemporalIntelligence;

  const ruleA: TemporalRule = {
    id: 'rule-A',
    name: 'Rule A',
    priority: 10,
    enabled: true,
    condition: { type: 'time_range', day: 1, hourStart: 9, hourEnd: 10 },
    strategy: { phase: 'phase-A', monitoringMultiplier: 1.5, isPriority: true },
  };

  const ruleB: TemporalRule = {
    id: 'rule-B',
    name: 'Rule B',
    priority: 20,
    enabled: true,
    condition: { type: 'time_range', day: 1, hourStart: 9, hourEnd: 10 },
    strategy: { phase: 'phase-B', monitoringMultiplier: 2, toneAdjustment: 'urgent' },
  };

  const conflictingRule: TemporalRule = {
    id: 'rule-conflict',
    name: 'Rule Conflict',
    priority: 15, // Between A and B
    enabled: true,
    condition: { type: 'time_range', day: 1, hourStart: 9, hourEnd: 10 },
    strategy: { phase: 'phase-Conflict', monitoringMultiplier: 0.9 },
  };

  const nonMatchingRule: TemporalRule = {
    id: 'rule-non-matching',
    name: 'Rule Non Matching',
    priority: 50,
    enabled: true,
    condition: { type: 'time_range', day: 2, hourStart: 9, hourEnd: 10 }, // Tuesday
    strategy: { phase: 'non-match' },
  };

  const baseRules = [ruleA, ruleB, conflictingRule, nonMatchingRule];

  beforeEach(() => {
    timeProvider = new MockTimeProvider(undefined, 'America/New_York');
    cache = new NodeCache({ stdTTL: 60 });
    strategyMerger = new StrategyMerger();
    ruleEngine = new RuleEngine(baseRules);
    temporalIntelligence = new TemporalIntelligence({
      ruleEngine,
      strategyMerger,
      timeProvider,
      cache,
    });
  });

  it('should return default strategy if no rules match', () => {
    timeProvider.setFixedTime('2025-12-08T03:00:00-05:00'); // Monday 3am, outside any rule window
    const result = temporalIntelligence.getTemporalContext();

    expect(result.matchedRules).toEqual([]);
    expect(result.phase).toBe(defaultStrategy.phase);
    expect(result.monitoringMultiplier).toBe(defaultStrategy.monitoringMultiplier);
    expect(result.timezone).toBe('America/New_York');
    expect(result.cacheHit).toBe(false);
  });

  it('should merge matching rules and prefer higher priority fields', () => {
    timeProvider.setFixedTime('2025-12-08T09:30:00-05:00'); // Monday 9:30am
    const result = temporalIntelligence.getTemporalContext();

    expect(result.matchedRules).toEqual(['rule-B', 'rule-conflict', 'rule-A']);
    expect(result.phase).toBe('phase-B');
    expect(result.monitoringMultiplier).toBe(2);
    expect(result.isPriority).toBe(true);
  });

  it('should honor cache for repeated calls within the same hour', () => {
    timeProvider.setFixedTime('2025-12-08T09:30:00-05:00'); // Monday 9:30am

    const evaluateSpy = vi.spyOn(ruleEngine, 'evaluate');
    const cacheGetSpy = vi.spyOn(cache, 'get');
    const cacheSetSpy = vi.spyOn(cache, 'set');

    const first = temporalIntelligence.getTemporalContext();
    const second = temporalIntelligence.getTemporalContext(); // Same window, should hit cache

    expect(cacheGetSpy).toHaveBeenCalledTimes(2);
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
    expect(evaluateSpy).toHaveBeenCalledTimes(1);
    expect(first.cacheHit).toBe(false);
    expect(second.cacheHit).toBe(true);
    expect({ ...second, cacheHit: false }).toEqual(first);
  });

  describe('TimeProvider Integration', () => {
    it('LuxonTimeProvider should correctly set timezone', () => {
      const provider = new LuxonTimeProvider('Europe/Berlin');
      const context = provider.getContext(new Date('2025-01-01T12:00:00Z')); // UTC noon
      expect(context.timezone).toBe('Europe/Berlin');
      expect(context.local.hour).toBe(13); // Berlin is UTC+1 in winter
    });

    it('MockTimeProvider should provide fixed time', () => {
      const provider = new MockTimeProvider('2025-01-01T10:00:00Z', 'America/New_York'); // 10am UTC = 5am NY
      const context = provider.getContext();
      expect(context.utc.toISO()).toContain('2025-01-01T10:00:00.000Z');
      expect(context.local.toISO()).toContain('2025-01-01T05:00:00.000-05:00');
    });

    it('getContext with specific date should use that date', () => {
      const provider = new MockTimeProvider();
      const specificDate = new Date('2025-03-15T18:00:00Z'); // 6pm UTC
      const context = provider.getContext(specificDate);
      expect(context.utc.toISO()).toContain('2025-03-15T18:00:00.000Z');
      expect(context.local.toISO()).toContain('2025-03-15T14:00:00.000-04:00'); // NY is EDT in March
    });
  });

  describe('Dynamic Holiday Rule Generation', () => {
    it('should generate rules from holiday config', () => {
      const holidays = [
        {
          id: 'new_year',
          name: 'New Year',
          recurrence: 'FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1',
          monitoringBoost: 3.0,
          prePreventionDays: 1,
          postRecoveryDays: 1,
        },
      ];

      // Don't pass ruleEngine, let it be built internally with dynamic rules
      const ti = new TemporalIntelligence({
        holidays,
        timeProvider,
        // Mock cache to avoid real TTL issues if any
        cache: new NodeCache({ stdTTL: 60 }),
      });

      // Mock time to New Year's Day (Jan 1)
      timeProvider.setFixedTime('2025-01-01T10:00:00-05:00');
      const result = ti.getTemporalContext();

      expect(result.matchedRules).toContain('new_year_morning');
      expect(result.monitoringMultiplier).toBe(3.0);

      // Check pre-prevention (Dec 31)
      timeProvider.setFixedTime('2024-12-31T10:00:00-05:00');
      const preResult = ti.getTemporalContext();
      expect(preResult.matchedRules).toContain('new_year_pre');
      expect(preResult.monitoringMultiplier).toBe(1.5);

      // Check post-recovery (Jan 2)
      timeProvider.setFixedTime('2025-01-02T10:00:00-05:00');
      const postResult = ti.getTemporalContext();
      expect(postResult.matchedRules).toContain('new_year_post');
      expect(postResult.monitoringMultiplier).toBe(2.0);
    });
  });
});
