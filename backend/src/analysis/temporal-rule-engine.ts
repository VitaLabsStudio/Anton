import type { DateTime } from 'luxon';

import type { TemporalRule, RuleCondition, TemporalStrategy } from '../config/temporal-schema.js';
import type { TimeContext } from '../services/time-provider.js';

export interface MatchedRule {
  ruleId: string;
  ruleName: string;
  priority: number;
  strategy: TemporalStrategy;
}

// Interface for HolidayService to be injected later
export interface IHolidayService {
  isHoliday(date: DateTime, holidayId?: string): boolean;
  isDaysBeforeHoliday(date: DateTime, days: number, holidayId?: string): boolean;
  isDaysAfterHoliday(date: DateTime, days: number, holidayId?: string): boolean;
}

export class RuleEngine {
  private readonly rules: TemporalRule[];
  private readonly holidayService?: IHolidayService;

  constructor(rules: TemporalRule[], holidayService?: IHolidayService) {
    // Sort rules by priority descending
    this.rules = [...rules].sort((a, b) => b.priority - a.priority);
    this.holidayService = holidayService;
  }

  evaluate(context: TimeContext): MatchedRule[] {
    const matches: MatchedRule[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      if (this.matchesCondition(rule.condition, context)) {
        matches.push({
          ruleId: rule.id,
          ruleName: rule.name,
          priority: rule.priority,
          strategy: rule.strategy,
        });
      }
    }

    return matches;
  }

  private matchesCondition(condition: RuleCondition, context: TimeContext): boolean {
    switch (condition.type) {
      case 'time_range':
        return this.checkTimeRange(condition, context);
      case 'holiday':
        return this.checkHoliday(condition, context);
      case 'pre_holiday':
        return this.checkPreHoliday(condition, context);
      case 'post_holiday':
        return this.checkPostHoliday(condition, context);
      default:
        return false;
    }
  }

  private checkTimeRange(
    condition: Extract<RuleCondition, { type: 'time_range' }>,
    context: TimeContext
  ): boolean {
    const local = context.local;
    const currentDay = local.weekday === 7 ? 0 : local.weekday;
    const currentHour = local.hour;

    // Standard window (no wrap across midnight)
    if (condition.hourStart <= condition.hourEnd) {
      if (currentDay !== condition.day) return false;
      return currentHour >= condition.hourStart && currentHour < condition.hourEnd;
    }

    // Wrapped window (e.g., 22 -> 2 means same-day late night and next-day early morning)
    const nextDay = (condition.day + 1) % 7;
    const isStartDayMatch =
      currentDay === condition.day && currentHour >= condition.hourStart && currentHour <= 23;
    const isNextDayMatch =
      currentDay === nextDay && currentHour < condition.hourEnd && currentHour >= 0;

    return isStartDayMatch || isNextDayMatch;
  }

  private checkHoliday(
    condition: Extract<RuleCondition, { type: 'holiday' }>,
    context: TimeContext
  ): boolean {
    if (!this.holidayService) return false;
    return this.holidayService.isHoliday(context.local, condition.holidayId);
  }

  private checkPreHoliday(
    condition: Extract<RuleCondition, { type: 'pre_holiday' }>,
    context: TimeContext
  ): boolean {
    if (!this.holidayService) return false;
    return this.holidayService.isDaysBeforeHoliday(context.local, condition.days);
  }

  private checkPostHoliday(
    condition: Extract<RuleCondition, { type: 'post_holiday' }>,
    context: TimeContext
  ): boolean {
    if (!this.holidayService) return false;
    return this.holidayService.isDaysAfterHoliday(context.local, condition.days);
  }
}
