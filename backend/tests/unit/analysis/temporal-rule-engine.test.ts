import '../../env-config';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DateTime } from 'luxon';

import type { TimeContext } from '../../../src/services/time-provider.js';
import type { TemporalRule } from '../../../src/config/temporal-schema.js';
import { RuleEngine, type IHolidayService } from '../../../src/analysis/temporal-rule-engine.js';

describe('RuleEngine', () => {
  const mockHolidayService: IHolidayService = {
    isHoliday: vi.fn<boolean, [DateTime, string | undefined]>(),
    isDaysBeforeHoliday: vi.fn<boolean, [DateTime, number, string | undefined]>(),
    isDaysAfterHoliday: vi.fn<boolean, [DateTime, number, string | undefined]>(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create a TimeContext
  const createTimeContext = (
    isoDate: string,
    timezone: string = 'America/New_York'
  ): TimeContext => {
    const local = DateTime.fromISO(isoDate, { zone: timezone });
    return {
      utc: local.toUTC(),
      local: local,
      timezone: timezone,
    };
  };

  it('should evaluate rules in priority order and return all matches', () => {
    const rules: TemporalRule[] = [
      {
        id: 'rule-low-priority',
        name: 'Low Priority Rule',
        priority: 10,
        enabled: true,
        condition: { type: 'time_range', day: 1, hourStart: 9, hourEnd: 10 }, // Monday 9-10am
        strategy: { phase: 'normal' },
      },
      {
        id: 'rule-high-priority',
        name: 'High Priority Rule',
        priority: 100,
        enabled: true,
        condition: { type: 'time_range', day: 1, hourStart: 9, hourEnd: 10 }, // Monday 9-10am
        strategy: { phase: 'peak' },
      },
      {
        id: 'rule-medium-priority',
        name: 'Medium Priority Rule',
        priority: 50,
        enabled: true,
        condition: { type: 'time_range', day: 1, hourStart: 9, hourEnd: 10 }, // Monday 9-10am
        strategy: { phase: 'prevention' },
      },
    ];

    const engine = new RuleEngine(rules);
    const context = createTimeContext('2025-12-08T09:30:00', 'America/New_York'); // Monday 9:30am

    const matchedRules = engine.evaluate(context);

    expect(matchedRules).toHaveLength(3);
    // Expect rules to be sorted by priority in the output implicitly from RuleEngine's internal sorting
    // But evaluate returns based on rules array iteration, which is sorted in constructor.
    expect(matchedRules[0].ruleId).toBe('rule-high-priority');
    expect(matchedRules[1].ruleId).toBe('rule-medium-priority');
    expect(matchedRules[2].ruleId).toBe('rule-low-priority');
  });

  it('should only return enabled rules', () => {
    const rules: TemporalRule[] = [
      {
        id: 'rule-enabled',
        name: 'Enabled Rule',
        priority: 10,
        enabled: true,
        condition: { type: 'time_range', day: 1, hourStart: 9, hourEnd: 10 },
        strategy: { phase: 'normal' },
      },
      {
        id: 'rule-disabled',
        name: 'Disabled Rule',
        priority: 100,
        enabled: false,
        condition: { type: 'time_range', day: 1, hourStart: 9, hourEnd: 10 },
        strategy: { phase: 'peak' },
      },
    ];

    const engine = new RuleEngine(rules);
    const context = createTimeContext('2025-12-08T09:30:00', 'America/New_York'); // Monday 9:30am

    const matchedRules = engine.evaluate(context);
    expect(matchedRules).toHaveLength(1);
    expect(matchedRules[0].ruleId).toBe('rule-enabled');
  });

  describe('TimeRange Conditions', () => {
    it('should match time_range condition when current time is within range', () => {
      const rule: TemporalRule = {
        id: 'test-rule',
        name: 'Test Rule',
        priority: 1,
        enabled: true,
        condition: { type: 'time_range', day: 1, hourStart: 9, hourEnd: 17 }, // Monday 9am-5pm
        strategy: { phase: 'normal' },
      };
      const engine = new RuleEngine([rule]);
      const context = createTimeContext('2025-12-08T14:30:00', 'America/New_York'); // Monday 2:30pm

      const matchedRules = engine.evaluate(context);
      expect(matchedRules).toHaveLength(1);
      expect(matchedRules[0].ruleId).toBe('test-rule');
    });

    it('should not match time_range condition when current hour is before range', () => {
      const rule: TemporalRule = {
        id: 'test-rule',
        name: 'Test Rule',
        priority: 1,
        enabled: true,
        condition: { type: 'time_range', day: 1, hourStart: 9, hourEnd: 17 }, // Monday 9am-5pm
        strategy: { phase: 'normal' },
      };
      const engine = new RuleEngine([rule]);
      const context = createTimeContext('2025-12-08T08:30:00', 'America/New_York'); // Monday 8:30am

      const matchedRules = engine.evaluate(context);
      expect(matchedRules).toHaveLength(0);
    });

    it('should not match time_range condition when current hour is after range', () => {
      const rule: TemporalRule = {
        id: 'test-rule',
        name: 'Test Rule',
        priority: 1,
        enabled: true,
        condition: { type: 'time_range', day: 1, hourStart: 9, hourEnd: 17 }, // Monday 9am-5pm
        strategy: { phase: 'normal' },
      };
      const engine = new RuleEngine([rule]);
      const context = createTimeContext('2025-12-08T17:00:00', 'America/New_York'); // Monday 5:00pm
      
      const matchedRules = engine.evaluate(context);
      expect(matchedRules).toHaveLength(0);
    });

    it('should not match time_range condition when current day is different', () => {
      const rule: TemporalRule = {
        id: 'test-rule',
        name: 'Test Rule',
        priority: 1,
        enabled: true,
        condition: { type: 'time_range', day: 1, hourStart: 9, hourEnd: 17 }, // Monday 9am-5pm
        strategy: { phase: 'normal' },
      };
      const engine = new RuleEngine([rule]);
      const context = createTimeContext('2025-12-09T14:30:00', 'America/New_York'); // Tuesday 2:30pm

      const matchedRules = engine.evaluate(context);
      expect(matchedRules).toHaveLength(0);
    });

    it('should handle hourEnd at 24 (midnight boundary)', () => {
      const rule: TemporalRule = {
        id: 'test-rule-midnight',
        name: 'Test Rule Midnight',
        priority: 1,
        enabled: true,
        condition: { type: 'time_range', day: 1, hourStart: 23, hourEnd: 24 }, // Monday 11pm-midnight
        strategy: { phase: 'night' },
      };
      const engine = new RuleEngine([rule]);
      const context = createTimeContext('2025-12-08T23:30:00', 'America/New_York'); // Monday 11:30pm

      const matchedRules = engine.evaluate(context);
      expect(matchedRules).toHaveLength(1);
      expect(matchedRules[0].ruleId).toBe('test-rule-midnight');
    });

    it('should not match if hour is exactly hourEnd (exclusive)', () => {
      const rule: TemporalRule = {
        id: 'test-rule-exclusive',
        name: 'Test Rule Exclusive',
        priority: 1,
        enabled: true,
        condition: { type: 'time_range', day: 1, hourStart: 9, hourEnd: 10 }, // Monday 9am-10am
        strategy: { phase: 'morning' },
      };
      const engine = new RuleEngine([rule]);
      const context = createTimeContext('2025-12-08T10:00:00', 'America/New_York'); // Monday 10:00am

      const matchedRules = engine.evaluate(context);
      expect(matchedRules).toHaveLength(0);
    });

    it('should handle windows that wrap across midnight (start day segment)', () => {
      const rule: TemporalRule = {
        id: 'late-night',
        name: 'Late Night',
        priority: 1,
        enabled: true,
        condition: { type: 'time_range', day: 5, hourStart: 22, hourEnd: 2 }, // Friday 10pm -> Saturday 2am
        strategy: { phase: 'night' },
      };
      const engine = new RuleEngine([rule]);

      // Friday 23:00 should match
      const context = createTimeContext('2025-12-12T23:00:00', 'America/New_York'); // Friday
      const matchedRules = engine.evaluate(context);
      expect(matchedRules).toHaveLength(1);
      expect(matchedRules[0].ruleId).toBe('late-night');
    });

    it('should handle windows that wrap across midnight (next day segment)', () => {
      const rule: TemporalRule = {
        id: 'late-night',
        name: 'Late Night',
        priority: 1,
        enabled: true,
        condition: { type: 'time_range', day: 5, hourStart: 22, hourEnd: 2 }, // Friday 10pm -> Saturday 2am
        strategy: { phase: 'night' },
      };
      const engine = new RuleEngine([rule]);

      // Saturday 01:00 should match (wrap)
      const context = createTimeContext('2025-12-13T01:00:00', 'America/New_York'); // Saturday
      const matchedRules = engine.evaluate(context);
      expect(matchedRules).toHaveLength(1);
      expect(matchedRules[0].ruleId).toBe('late-night');
    });
  });

  describe('Holiday Conditions', () => {
    it('should defer holiday checks to HolidayService', () => {
      const rule: TemporalRule = {
        id: 'holiday-rule',
        name: 'Holiday Rule',
        priority: 1,
        enabled: true,
        condition: { type: 'holiday', holidayId: 'christmas' },
        strategy: { phase: 'holiday' },
      };
      const engine = new RuleEngine([rule], mockHolidayService);
      const context = createTimeContext('2025-12-25T10:00:00', 'America/New_York');

      mockHolidayService.isHoliday.mockReturnValue(true);

      const matchedRules = engine.evaluate(context);
      expect(mockHolidayService.isHoliday).toHaveBeenCalledTimes(1);
      expect(matchedRules).toHaveLength(1);
      expect(matchedRules[0].ruleId).toBe('holiday-rule');
    });

    it('should not match holiday conditions when HolidayService returns false', () => {
      const rule: TemporalRule = {
        id: 'holiday-rule',
        name: 'Holiday Rule',
        priority: 1,
        enabled: true,
        condition: { type: 'holiday', holidayId: 'christmas' },
        strategy: { phase: 'holiday' },
      };
      const engine = new RuleEngine([rule], mockHolidayService);
      const context = createTimeContext('2025-12-25T10:00:00', 'America/New_York');

      mockHolidayService.isHoliday.mockReturnValue(false);

      const matchedRules = engine.evaluate(context);
      expect(mockHolidayService.isHoliday).toHaveBeenCalledTimes(1);
      expect(matchedRules).toHaveLength(0);
    });
  });
});
