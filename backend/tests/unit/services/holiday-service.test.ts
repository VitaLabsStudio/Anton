import '../../env-config';
import { describe, it, expect, beforeEach } from 'vitest';
import { DateTime } from 'luxon';

import { HolidayService } from '../../../src/services/holiday-service.js';
import type { HolidayConfig } from '../../../src/config/temporal-schema.js';

const SAMPLE_HOLIDAYS: HolidayConfig[] = [
  {
    id: 'new_years_day',
    name: "New Year's Day",
    recurrence: 'FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1',
    prePreventionDays: 2,
    postRecoveryDays: 1,
  },
  {
    id: 'july_fourth',
    name: 'Independence Day',
    recurrence: 'FREQ=YEARLY;BYMONTH=7;BYMONTHDAY=4',
    postRecoveryDays: 1,
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    recurrence: 'FREQ=YEARLY;BYMONTH=11;BYDAY=TH;BYSETPOS=-1',
    postRecoveryDays: 1,
    prePreventionDays: 2,
  },
];

describe('HolidayService', () => {
  let service: HolidayService;

  beforeEach(() => {
    service = new HolidayService(SAMPLE_HOLIDAYS, 'America/New_York');
  });

  it('detects holiday by recurrence (Thanksgiving 2025)', () => {
    const date = DateTime.fromISO('2025-11-27T10:00:00', { zone: 'America/New_York' });
    expect(service.isHoliday(date, 'thanksgiving')).toBe(true);
  });

  it('detects holiday by recurrence (Thanksgiving 2026)', () => {
    const date = DateTime.fromISO('2026-11-26T10:00:00', { zone: 'America/New_York' });
    expect(service.isHoliday(date, 'thanksgiving')).toBe(true);
  });

  it('detects days before a holiday across year boundary', () => {
    const date = DateTime.fromISO('2025-12-30T10:00:00', { zone: 'America/New_York' });
    expect(service.isDaysBeforeHoliday(date, 2, 'new_years_day')).toBe(true);
  });

  it('detects days after a holiday', () => {
    const date = DateTime.fromISO('2025-07-05T12:00:00', { zone: 'America/New_York' });
    expect(service.isDaysAfterHoliday(date, 1, 'july_fourth')).toBe(true);
  });

  it('returns false when no holiday matches', () => {
    const date = DateTime.fromISO('2025-02-10T12:00:00', { zone: 'America/New_York' });
    expect(service.isHoliday(date)).toBe(false);
    expect(service.isDaysBeforeHoliday(date, 2)).toBe(false);
    expect(service.isDaysAfterHoliday(date, 1)).toBe(false);
  });
});
