import { logger } from '../utils/logger.js';

export type MetricTags = Record<string, string | number | boolean>;

export interface MetricsAdapter {
  increment(name: string, tags?: Record<string, unknown>): void;
  record?(name: string, value: number, tags?: Record<string, unknown>): void;
}

class NoopMetricsAdapter implements MetricsAdapter {
  increment(name: string, tags?: Record<string, unknown>): void {
    logger.debug({ metric: name, tags }, 'metrics.increment');
  }

  record(name: string, value: number, tags?: Record<string, unknown>): void {
    logger.debug({ metric: name, value, tags }, 'metrics.record');
  }
}

export const noopMetricsAdapter = new NoopMetricsAdapter();
