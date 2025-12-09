import { DateTime } from 'luxon';
import { RRule } from 'rrule';

import type { HolidayConfig } from '../config/temporal-schema.js';

export interface Holiday extends HolidayConfig {
  date: string; // Local date in target timezone (YYYY-MM-DD)
}

export class HolidayService {
  private readonly holidays: HolidayConfig[];
  private readonly timezone: string;
  private lookup: Map<string, Holiday> = new Map();
  private coveredYears: Set<number> = new Set();

  constructor(
    holidays: HolidayConfig[],
    timezone: string = process.env.TARGET_TIMEZONE ?? 'America/New_York'
  ) {
    this.holidays = holidays;
    this.timezone = timezone;
    const currentYear = DateTime.now().setZone(this.timezone).year;
    this.preComputeLookupTable(currentYear);
  }

  public preComputeLookupTable(year: number): Map<string, Holiday> {
    const map = new Map<string, Holiday>();

    for (const holiday of this.holidays) {
      const occurrences = [
        ...this.computeOccurrencesForYear(holiday, year),
        ...this.computeOccurrencesForYear(holiday, year + 1),
      ];

      for (const occurrence of occurrences) {
        const key = occurrence.toISODate();
        map.set(key, { ...holiday, date: key });
      }
    }

    this.lookup = map;
    this.coveredYears.add(year);
    this.coveredYears.add(year + 1);
    return this.lookup;
  }

  public isHoliday(date: DateTime, holidayId?: string): boolean {
    this.ensureCoverage(date);
    const key = date.setZone(this.timezone).toISODate();
    const holiday = this.lookup.get(key);
    if (!holiday) return false;
    if (holidayId && holidayId !== 'any' && holiday.id !== holidayId) return false;
    return true;
  }

  public isDaysBeforeHoliday(date: DateTime, days: number, holidayId?: string): boolean {
    const target = date.setZone(this.timezone).plus({ days });
    this.ensureCoverage(target);
    const key = target.toISODate();
    const holiday = this.lookup.get(key);
    if (!holiday) return false;
    if (holidayId && holidayId !== 'any' && holiday.id !== holidayId) return false;
    return true;
  }

  public isDaysAfterHoliday(date: DateTime, days: number, holidayId?: string): boolean {
    const target = date.setZone(this.timezone).minus({ days });
    this.ensureCoverage(target);
    const key = target.toISODate();
    const holiday = this.lookup.get(key);
    if (!holiday) return false;
    if (holidayId && holidayId !== 'any' && holiday.id !== holidayId) return false;
    return true;
  }

  private ensureCoverage(date: DateTime): void {
    const year = date.setZone(this.timezone).year;
    if (!this.coveredYears.has(year) || !this.coveredYears.has(year + 1)) {
      this.preComputeLookupTable(year);
    }
  }

  private computeOccurrencesForYear(holiday: HolidayConfig, year: number): DateTime[] {
    const { recurrence } = holiday;
    const byMonthMatch = recurrence.match(/BYMONTH=([0-9]+)/);
    const byMonthDayMatch = recurrence.match(/BYMONTHDAY=([-0-9]+)/);
    const byDayMatch = recurrence.match(/BYDAY=([A-Z]{2})/);
    const bySetPosMatch = recurrence.match(/BYSETPOS=([-0-9]+)/);

    const byMonth = byMonthMatch ? Number.parseInt(byMonthMatch[1], 10) : null;
    const setPos = bySetPosMatch ? Number.parseInt(bySetPosMatch[1], 10) : null;
    const byMonthDay = byMonthDayMatch ? Number.parseInt(byMonthDayMatch[1], 10) : null;

    if (byMonth && byMonthDay) {
      return [
        DateTime.fromObject(
          { year, month: byMonth, day: byMonthDay },
          { zone: this.timezone }
        ).startOf('day'),
      ];
    }

    if (byMonth && byDayMatch && setPos) {
      const weekdayCode = byDayMatch[1];
      const weekdayLookup: Record<string, number> = {
        MO: 1,
        TU: 2,
        WE: 3,
        TH: 4,
        FR: 5,
        SA: 6,
        SU: 7,
      };
      const targetWeekday = weekdayLookup[weekdayCode];
      if (!targetWeekday) return [];

      const startOfMonth = DateTime.fromObject(
        { year, month: byMonth, day: 1 },
        { zone: this.timezone }
      ).startOf('day');
      const endOfMonth = startOfMonth.endOf('month');

      if (setPos > 0) {
        // nth weekday of month
        let cursor = startOfMonth;
        while (cursor.weekday !== targetWeekday) {
          cursor = cursor.plus({ days: 1 });
        }
        const occurrence = cursor.plus({ days: (setPos - 1) * 7 });
        return [occurrence];
      }

      if (setPos < 0) {
        // last weekday of month (or nth from end)
        let cursor = endOfMonth;
        while (cursor.weekday !== targetWeekday) {
          cursor = cursor.minus({ days: 1 });
        }
        const occurrence = cursor.minus({ days: (Math.abs(setPos) - 1) * 7 });
        return [occurrence];
      }
    }

    // Fallback to rrule parsing for any other recurrence shapes
    try {
      const start = DateTime.fromObject({ year, month: 1, day: 1 }, { zone: this.timezone })
        .startOf('day')
        .toJSDate();
      const end = DateTime.fromObject({ year: year + 1, month: 12, day: 31 }, { zone: this.timezone })
        .endOf('day')
        .toJSDate();
      const rule = RRule.fromString(recurrence, { dtstart: start });
      return rule.between(start, end, true).map((d) => DateTime.fromJSDate(d, { zone: this.timezone }));
    } catch {
      return [];
    }
  }
}
