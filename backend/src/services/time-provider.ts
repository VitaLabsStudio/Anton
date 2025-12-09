import { DateTime } from 'luxon';

export interface TimeContext {
  utc: DateTime;
  local: DateTime;
  timezone: string;
}

export interface TimeProvider {
  now(): DateTime;
  getContext(date?: Date): TimeContext;
}

export class LuxonTimeProvider implements TimeProvider {
  private readonly targetTimezone: string;

  constructor(targetTimezone: string = process.env.TARGET_TIMEZONE ?? 'America/New_York') {
    this.targetTimezone = targetTimezone;
  }

  now(): DateTime {
    return DateTime.now().setZone(this.targetTimezone);
  }

  getContext(date?: Date): TimeContext {
    const utc = date ? DateTime.fromJSDate(date).toUTC() : DateTime.now().toUTC();
    const local = utc.setZone(this.targetTimezone);

    return {
      utc,
      local,
      timezone: this.targetTimezone,
    };
  }
}

export class MockTimeProvider implements TimeProvider {
  private fixedTime: DateTime | null = null;
  private readonly targetTimezone: string;

  constructor(
    fixedIsoTime?: string,
    targetTimezone: string = 'America/New_York'
  ) {
    this.targetTimezone = targetTimezone;
    if (fixedIsoTime) {
      this.fixedTime = DateTime.fromISO(fixedIsoTime).setZone(this.targetTimezone);
    }
  }

  setFixedTime(isoTime: string): void {
    this.fixedTime = DateTime.fromISO(isoTime).setZone(this.targetTimezone);
  }

  now(): DateTime {
    return this.fixedTime ?? DateTime.now().setZone(this.targetTimezone);
  }

  getContext(date?: Date): TimeContext {
    if (date) {
      const utc = DateTime.fromJSDate(date).toUTC();
      const local = utc.setZone(this.targetTimezone);
      return { utc, local, timezone: this.targetTimezone };
    }

    const current = this.now();
    return {
      utc: current.toUTC(),
      local: current,
      timezone: this.targetTimezone,
    };
  }
}
