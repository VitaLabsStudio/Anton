import type { MetricTags, MetricsAdapter } from './metrics-adapter.js';

type PromMetricType = 'counter' | 'gauge';

const PROMETHEUS_METRIC_DEFINITIONS: Record<
  string,
  { promName: string; help: string; type: PromMetricType; skip?: boolean }
> = {
  weight_cache_hit: {
    promName: 'decision_weight_cache_hits_total',
    help: 'Decisions served using cached signal weights',
    type: 'counter',
  },
  weight_cache_miss: {
    promName: 'decision_weight_cache_misses_total',
    help: 'Decisions that required fetching fresh signal weights',
    type: 'counter',
  },
  weights_validation_failure_count: {
    promName: 'decision_weights_validation_failure_total',
    help: 'Weight records that failed validation',
    type: 'counter',
  },
  nan_infinity_detected_count: {
    promName: 'decision_nan_infinity_detected_total',
    help: 'NaN or Infinity values detected during decision processing',
    type: 'counter',
  },
  composite_score_out_of_range: {
    promName: 'decision_composite_score_out_of_range_total',
    help: 'Composite scores that violated the [0,1] range',
    type: 'counter',
  },
  composite_score_clamped: {
    promName: 'decision_composite_score_clamped_total',
    help: 'Composite scores that were clamped into [0,1]',
    type: 'counter',
  },
  'score.clamped': {
    promName: 'decision_signal_score_clamped_total',
    help: 'Individual signal scores that were clamped',
    type: 'counter',
  },
  mode_confidence_distribution: {
    promName: 'decision_mode_confidence_bucket',
    help: 'Mode confidence bucketed distribution',
    type: 'counter',
  },
  'signal.failure': {
    promName: 'decision_signal_failures_total',
    help: 'Failure counts for each signal fetch',
    type: 'counter',
  },
  breaker_state_failure: {
    promName: 'decision_breaker_state_failures_total',
    help: 'Circuit breaker failure events',
    type: 'counter',
  },
  breaker_state_open: {
    promName: 'decision_breaker_state_open_total',
    help: 'Circuit breaker openings',
    type: 'counter',
  },
  breaker_state_close: {
    promName: 'decision_breaker_state_close_total',
    help: 'Circuit breaker closings',
    type: 'counter',
  },
  breaker_fallback: {
    promName: 'decision_breaker_fallback_total',
    help: 'Circuit breaker fallback invocations',
    type: 'counter',
  },
  decision_latency_count: {
    promName: 'decision_latency_count_total',
    help: 'Total number of processed decisions',
    type: 'counter',
  },
  decision_latency_ms: {
    promName: 'decision_latency_ms_sum',
    help: 'Sum of decision latencies in milliseconds',
    type: 'counter',
    skip: true,
  },
};

const DROPPED_PROM_LABELS = new Set(['key', 'raw', 'clamped']);

export interface MetricSnapshot {
  name: string;
  tags?: MetricTags;
  value: number;
}

interface MetricEntry extends MetricSnapshot {}

class MetricsRegistry implements MetricsAdapter {
  private readonly entries = new Map<string, MetricEntry>();

  increment(name: string, tags?: Record<string, unknown>): void {
    this.update(name, tags, 1);
  }

  record(name: string, value: number, tags?: Record<string, unknown>): void {
    this.update(name, tags, value);
  }

  getSnapshot(): MetricSnapshot[] {
    return Array.from(this.entries.values()).map((entry) => ({ ...entry }));
  }

  toPrometheus(): string {
    const snapshot = this.getSnapshot();
    if (snapshot.length === 0) {
      return '';
    }

    const rows = snapshot
      .map((entry) => {
        const definition = PROMETHEUS_METRIC_DEFINITIONS[entry.name];
        const promName = definition?.promName ?? this.defaultPromName(entry.name);
        const labelString = this.formatPromLabels(entry.tags);
        return { entry, promName, definition, labelString };
      })
      .filter((row) => !row.definition?.skip)
      .sort((a, b) => {
        if (a.promName !== b.promName) {
          return a.promName.localeCompare(b.promName);
        }
        return a.labelString.localeCompare(b.labelString);
      });

    const lines: string[] = [];
    const emitted = new Set<string>();

    for (const row of rows) {
      if (!emitted.has(row.promName)) {
        const help = row.definition?.help ?? 'Decision engine metric';
        const type = row.definition?.type ?? 'counter';
        lines.push(`# HELP ${row.promName} ${help}`);
        lines.push(`# TYPE ${row.promName} ${type}`);
        emitted.add(row.promName);
      }

      lines.push(`${row.promName}${row.labelString} ${row.entry.value}`);
    }

    return lines.join('\n');
  }

  private update(name: string, tags: Record<string, unknown> | undefined, delta: number): void {
    const parsedTags = this.normalizeTags(tags);
    const key = this.formatKey(name, parsedTags);
    const entry = this.entries.get(key);
    if (entry) {
      entry.value += delta;
    } else {
      this.entries.set(key, {
        name,
        tags: parsedTags,
        value: delta,
      });
    }
  }

  private normalizeTags(tags?: Record<string, unknown>): MetricTags | undefined {
    if (!tags || Object.keys(tags).length === 0) {
      return undefined;
    }
    const normalized: MetricTags = {};
    const keys = Object.keys(tags).sort();
    for (const key of keys) {
      const value = tags[key];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        normalized[key] = value;
      } else if (value !== undefined && value !== null) {
        normalized[key] = String(value);
      }
    }
    return normalized;
  }

  private formatKey(name: string, tags?: MetricTags): string {
    if (!tags) {
      return name;
    }
    const tagString = Object.entries(tags)
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `${name}|${tagString}`;
  }

  private formatPromLabels(tags?: MetricTags): string {
    if (!tags) {
      return '';
    }
    const filtered = Object.entries(tags).filter(([key]) => !DROPPED_PROM_LABELS.has(key));
    if (filtered.length === 0) {
      return '';
    }
    const components = filtered.map(
      ([key, value]) => `${key}="${this.escapeLabelValue(value)}"`
    );
    return `{${components.join(',')}}`;
  }

  private escapeLabelValue(value: string | number | boolean): string {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  private defaultPromName(name: string): string {
    return `decision_${name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  }
}

export const metricsCollector = new MetricsRegistry();
