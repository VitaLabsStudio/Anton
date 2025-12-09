import { DateTime } from 'luxon';

import type { TemporalContext, TemporalStrategy } from '../config/temporal-schema.js';

export interface FeatureVector {
  hour_sin: number;
  hour_cos: number;
  day_sin: number;
  day_cos: number;
  phase_peak: 0 | 1;
  phase_prevention: 0 | 1;
  phase_holiday: 0 | 1;
  phase_normal: 0 | 1;
  monitoring_multiplier: number;
  sss_threshold_adjustment: number;
  is_holiday: 0 | 1;
  is_priority: 0 | 1;
  is_weekend: 0 | 1;
}

export class TemporalFeatureExtractor {
  constructor(private readonly fallbackTimezone: string = process.env.TARGET_TIMEZONE ?? 'America/New_York') {}

  extract(context: TemporalStrategy, timestamp: Date = new Date()): FeatureVector {
    const zone = (context as TemporalContext).timezone ?? this.fallbackTimezone;
    const localTime = (context as TemporalContext).localTime
      ? DateTime.fromISO((context as TemporalContext).localTime as string, { zone })
      : DateTime.fromJSDate(timestamp).setZone(zone);

    const hour = localTime.hour;
    const weekday = localTime.weekday % 7; // Luxon 1-7 -> make Sunday=0

    const hourRadians = (2 * Math.PI * hour) / 24;
    const dayRadians = (2 * Math.PI * weekday) / 7;

    const phase = context.phase ?? 'normal';

    const isHolidayPhase = phase === 'holiday';
    const isWeekend = weekday === 0 || weekday === 6;

    return {
      hour_sin: Math.sin(hourRadians),
      hour_cos: Math.cos(hourRadians),
      day_sin: Math.sin(dayRadians),
      day_cos: Math.cos(dayRadians),
      phase_peak: phase === 'peak_suffering' ? 1 : 0,
      phase_prevention: phase === 'prevention' ? 1 : 0,
      phase_holiday: isHolidayPhase ? 1 : 0,
      phase_normal: phase === 'normal' ? 1 : 0,
      monitoring_multiplier: context.monitoringMultiplier ?? 1,
      sss_threshold_adjustment: context.sssThresholdAdjustment ?? 0,
      is_holiday: isHolidayPhase ? 1 : 0,
      is_priority: context.isPriority ? 1 : 0,
      is_weekend: isWeekend ? 1 : 0,
    };
  }
}
