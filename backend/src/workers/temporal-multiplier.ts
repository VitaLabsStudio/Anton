/**
 * Temporal Intelligence: Adjusts polling frequency based on time of week.
 * Targets peak hangover times (Sunday morning, Saturday morning, weekend nights).
 */

import { logger } from '../utils/logger.js';

export interface TemporalContext {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  hour: number; // 0-23
  multiplier: number;
  reason: string;
}

export class TemporalMultiplier {
  /**
   * Calculate frequency multiplier based on current time
   * @returns multiplier value (1x = baseline, 2x = double frequency, etc.)
   */
  getMultiplier(date: Date = new Date()): number {
    const context = this.getContext(date);
    return context.multiplier;
  }

  /**
   * Get detailed temporal context for logging/telemetry
   */
  getContext(date: Date = new Date()): TemporalContext {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = date.getHours(); // 0-23

    // Sunday 6am-11am: 3x frequency (peak hangover time)
    if (dayOfWeek === 0 && hour >= 6 && hour < 11) {
      return {
        dayOfWeek,
        hour,
        multiplier: 3,
        reason: 'Sunday morning peak (6am-11am)',
      };
    }

    // Saturday 6am-11am: 2x frequency
    if (dayOfWeek === 6 && hour >= 6 && hour < 11) {
      return {
        dayOfWeek,
        hour,
        multiplier: 2,
        reason: 'Saturday morning peak (6am-11am)',
      };
    }

    // Friday night (10pm-2am): 1.5x frequency
    if (dayOfWeek === 5 && ((hour >= 22 && hour <= 23) || (hour >= 0 && hour < 2))) {
      return {
        dayOfWeek,
        hour,
        multiplier: 1.5,
        reason: 'Friday night (10pm-2am)',
      };
    }

    // Saturday night (10pm-2am): 1.5x frequency
    if (dayOfWeek === 6 && hour >= 22) {
      return {
        dayOfWeek,
        hour,
        multiplier: 1.5,
        reason: 'Saturday night (10pm onwards)',
      };
    }

    // Sunday early morning continuation (12am-2am): 1.5x frequency
    if (dayOfWeek === 0 && hour >= 0 && hour < 2) {
      return {
        dayOfWeek,
        hour,
        multiplier: 1.5,
        reason: 'Saturday night continuation (12am-2am Sunday)',
      };
    }

    // Default: 1x frequency
    return {
      dayOfWeek,
      hour,
      multiplier: 1,
      reason: 'Baseline frequency',
    };
  }

  /**
   * Calculate adjusted poll interval in milliseconds
   * @param baseInterval - Base polling interval in ms (e.g., 60000 = 1 minute)
   */
  getAdjustedInterval(baseInterval: number, date: Date = new Date()): number {
    const multiplier = this.getMultiplier(date);

    // Higher multiplier = shorter interval (more frequent polling)
    const adjusted = Math.floor(baseInterval / multiplier);

    return adjusted;
  }

  /**
   * Log current temporal context
   */
  logContext(date: Date = new Date()): void {
    const context = this.getContext(date);

    logger.info(
      {
        dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][context.dayOfWeek],
        hour: context.hour,
        multiplier: context.multiplier,
        reason: context.reason,
      },
      'Temporal multiplier context'
    );
  }

  /**
   * Get statistics about temporal patterns
   */
  getStats() {
    return {
      peakTimes: [
        { period: 'Sunday 6am-11am', multiplier: 3 },
        { period: 'Saturday 6am-11am', multiplier: 2 },
        { period: 'Friday night 10pm-2am', multiplier: 1.5 },
        { period: 'Saturday night 10pm+', multiplier: 1.5 },
      ],
      baseline: 1,
    };
  }
}

// Export singleton instance
export const temporalMultiplier = new TemporalMultiplier();
