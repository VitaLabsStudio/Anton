import { Hono } from 'hono';

import { decisionEngine } from '../../analysis/decision-engine.js';
import { metricsCollector } from '../../observability/metrics-registry.js';

const metricsRouter = new Hono();

const formatLatencyValue = (value: number | null) =>
  value === null || !Number.isFinite(value) ? 'NaN' : value.toString();

metricsRouter.get('/', (c) => {
  const snapshot = decisionEngine.getHealthSnapshot();
  const latencyMetrics = decisionEngine.getLatencyMetrics();
  const formatQuery = c.req.query('format');
  if (formatQuery?.toLowerCase() === 'json') {
    return c.json({
      metrics: metricsCollector.getSnapshot(),
      health: snapshot,
    });
  }

  const lines: string[] = [];
  const prometheusPayload = metricsCollector.toPrometheus();
  if (prometheusPayload) {
    lines.push(prometheusPayload, '');
  }
  lines.push('# HELP decision_latency_ms_bucket Decision latency histogram buckets (milliseconds)');
  lines.push('# TYPE decision_latency_ms_bucket histogram');
  latencyMetrics.buckets.forEach((bucket) => {
    lines.push(`decision_latency_ms_bucket{le="${bucket.le}"} ${bucket.count}`);
  });
  lines.push(`decision_latency_ms_bucket{le="+Inf"} ${latencyMetrics.count}`);

  lines.push('# HELP decision_latency_ms_p95 95th percentile decision latency in milliseconds');
  lines.push('# TYPE decision_latency_ms_p95 gauge');
  lines.push(`decision_latency_ms_p95 ${formatLatencyValue(latencyMetrics.p95)}`);

  lines.push('# HELP decision_latency_ms_max Maximum decision latency in milliseconds');
  lines.push('# TYPE decision_latency_ms_max gauge');
  lines.push(`decision_latency_ms_max ${formatLatencyValue(latencyMetrics.max)}`);

  lines.push('# HELP decision_latency_ms_sum Total sum of decision latencies in milliseconds');
  lines.push('# TYPE decision_latency_ms_sum gauge');
  lines.push(`decision_latency_ms_sum ${latencyMetrics.sum}`);

  lines.push('# HELP decision_latency_ms_count Total latency samples recorded');
  lines.push('# TYPE decision_latency_ms_count gauge');
  lines.push(`decision_latency_ms_count ${latencyMetrics.count}`);

  lines.push(`# HEALTH ${JSON.stringify(snapshot)}`);

  return c.text(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
  });
});

export { metricsRouter };
