# 12. Observability & Monitoring

## 12.1 Structured Logging

```typescript
// backend/src/utils/logger.ts

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' } 
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: 'antone',
    version: process.env.npm_package_version,
  },
  redact: [
    'req.headers.authorization',
    'password',
    'apiKey',
    'accessToken',
    'refreshToken',
  ],
});

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] || uuid();
  
  req.log = logger.child({ requestId });
  
  const start = Date.now();
  
  res.on('finish', () => {
    req.log.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - start,
    }, 'Request completed');
  });
  
  next();
}
```

## 12.2 Metrics Collection

```typescript
// backend/src/monitoring/metrics.ts

export const metrics = {
  // Counters
  postsScanned: new Counter('antone_posts_scanned_total'),
  postsQueued: new Counter('antone_posts_queued_total'),
  decisionsCreated: new Counter('antone_decisions_created_total'),
  repliesGenerated: new Counter('antone_replies_generated_total'),
  repliesPosted: new Counter('antone_replies_posted_total'),
  repliesDeleted: new Counter('antone_replies_deleted_total'),
  
  // Gauges
  queueDepth: new Gauge('antone_queue_depth'),
  pendingApprovals: new Gauge('antone_pending_approvals'),
  redditKarma: new Gauge('antone_reddit_karma'),
  
  // Histograms
  analysisLatency: new Histogram('antone_analysis_duration_seconds'),
  generationLatency: new Histogram('antone_generation_duration_seconds'),
  postingLatency: new Histogram('antone_posting_duration_seconds'),
  
  // Labels
  byPlatform: (platform: string) => ({ platform }),
  byMode: (mode: string) => ({ mode }),
  byArchetype: (archetype: string) => ({ archetype }),
};
```

## 12.3 Health Checks

```typescript
// backend/src/monitoring/health-check.ts

export class HealthChecker {
  async check(): Promise<HealthStatus> {
    const [db, twitter, reddit, threads, worker] = await Promise.all([
      this.checkDatabase(),
      this.checkTwitter(),
      this.checkReddit(),
      this.checkThreads(),
      this.checkWorker(),
    ]);

    const components = { db, twitter, reddit, threads, worker };
    const allHealthy = Object.values(components).every(c => c.status === 'healthy');
    const anyUnhealthy = Object.values(components).some(c => c.status === 'unhealthy');

    return {
      status: allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded',
      components,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  private async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { 
        status: 'healthy', 
        latencyMs: Date.now() - start 
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message 
      };
    }
  }

  private async checkWorker(): Promise<ComponentHealth> {
    const lastPoll = await this.getLastPollTime();
    const minutesSinceLastPoll = (Date.now() - lastPoll.getTime()) / 60000;
    
    if (minutesSinceLastPoll > 30) {
      return { status: 'unhealthy', error: 'Worker not polling' };
    }
    if (minutesSinceLastPoll > 15) {
      return { status: 'degraded', warning: 'Worker slow' };
    }
    return { status: 'healthy', lastPollAt: lastPoll.toISOString() };
  }
}
```

## 12.4 Alerting Configuration

```typescript
// backend/src/monitoring/alerting.ts

export const alertRules: AlertRule[] = [
  // Critical alerts
  {
    name: 'platform_strike',
    condition: (metrics) => metrics.platformStrikes > 0,
    severity: 'critical',
    channels: ['sms', 'email', 'slack'],
    message: 'CRITICAL: Platform strike received',
  },
  {
    name: 'safety_kpi_breach',
    condition: (metrics) => metrics.removalRate > 1.5,
    severity: 'critical',
    channels: ['sms', 'email'],
    message: 'CRITICAL: Safety KPI breach - removal rate >1.5x baseline',
  },
  {
    name: 'system_down',
    condition: (health) => health.status === 'unhealthy',
    severity: 'critical',
    channels: ['sms', 'email', 'slack'],
    cooldown: 5 * 60_000, // 5 minutes
  },
  
  // High alerts
  {
    name: 'ctr_low',
    condition: (metrics) => metrics.ctr < 1.5,
    severity: 'high',
    channels: ['email', 'slack'],
    message: 'HIGH: CTR dropped below 1.5%',
  },
  {
    name: 'sentiment_low',
    condition: (metrics) => metrics.positiveSentiment < 60,
    severity: 'high',
    channels: ['email', 'slack'],
    message: 'HIGH: Positive sentiment below 60%',
  },
  
  // Medium alerts
  {
    name: 'queue_depth_high',
    condition: (metrics) => metrics.queueDepth > 100,
    severity: 'medium',
    channels: ['slack'],
    message: 'Queue depth exceeds 100 posts',
  },
  {
    name: 'algorithm_drift',
    condition: (metrics) => metrics.impressionsDrift > 20,
    severity: 'medium',
    channels: ['email'],
    message: 'Algorithm drift detected: impressions down >20%',
  },
];
```

---

---

## 12.5 Decision Engine Observability

### 12.5.1 Request tracing and structured logs

Decision requests pass through `requestTrace()` (`backend/src/api/middleware/request-trace.ts`) before hitting the route handlers. The middleware:

- Generates or honors `X-Request-ID`.
- Injects the header into every response.
- Logs request start/finish with a `pino` child logger that includes the `requestId`.
- Stores the ID in the context so downstream handlers can correlate business logs.

This keeps the decision engine logs searchable by request and satisfies the structured-logging requirement (request ID + JSON fields). Any additional middleware or cron-like worker that touches the decision flow should copy the same `requestId`.

### 12.5.2 Metrics and health snapshot

The decision engine exposes the following metrics (available via the configurable metrics adapter):

- `decision_latency_count_total` plus the histogram buckets (`decision_latency_ms_bucket`), along with `decision_latency_ms_p95`, `decision_latency_ms_max`, `decision_latency_ms_sum`, and `decision_latency_ms_count` derived from the rolling latency histogram.
- `decision_weight_cache_hits_total` / `decision_weight_cache_misses_total`: tracks cache effectiveness and is surfaced in `decisionEngine.getHealthSnapshot().cache`.
- `decision_weights_validation_failure_total`: outlines invalid or stale weights (sum, non-finite values, interactions).
- `decision_nan_infinity_detected_total`: increments when any signal, composite score, or uncertainty value is NaN/Infinity.
- `decision_composite_score_out_of_range_total` / `decision_composite_score_clamped_total`: show how often clamps happen.
- `decision_signal_score_clamped_total`: captures individual signal clamping events.
- `decision_mode_confidence_bucket`: offers the probability assigned to each mode bucket so threshold drift can be monitored.
- `decision_signal_failures_total`: track downstream failures per signal to feed alert rules.
- `decision_breaker_state_open_total`, `decision_breaker_state_close_total`, `decision_breaker_state_failures_total`, and `decision_breaker_fallback_total` (per signal): emitted when opossum circuit breakers change state.

The `/health` endpoint already pulls `decisionEngine.getHealthSnapshot()`, which packages:

```json
{
  "cache": { "hits": 42, "misses": 3, "keys": 6, "ksize": 512, "vsize": 2048 },
  "breakers": [
    { "signal": "SSS", "state": "closed" },
    { "signal": "EVS", "state": "half-open" }
  ],
  "latency": { "count": 1234, "p95": 312, "max": 660 }
}
```

Alerting/monitoring dashboards can consume the health snapshot and the metrics above to answer questions such as “When did EVS start timing out?”, “Does the cache hit ratio stay above 90%?”, and “What is the current P95 decision latency?”.

### 12.5.3 Monitoring dashboard queries

Example PromQL queries worth exposing:

```
decision_latency_ms_sum / decision_latency_ms_count
histogram_quantile(0.95, sum(rate(decision_latency_ms_bucket[5m])) by (le))
sum(rate(decision_weight_cache_hits_total[5m])) /
  (sum(rate(decision_weight_cache_hits_total[5m])) +
    sum(rate(decision_weight_cache_misses_total[5m])))
sum(rate(decision_breaker_state_open_total{signal="EVS"}[5m]))
sum(rate(decision_nan_infinity_detected_total[5m]))
sum(rate(decision_mode_confidence_bucket[5m])) by (mode)
```

JSON or Prometheus dashboards should pair the histograms with the `/health` snapshot (for the P95 and breaker states) and emit alerts when `mode_confidence_distribution{mode="HELPFUL"}` falls below a configurable floor or when `breaker_state_open` spikes for multiple signals.

### 12.5.4 /metrics export

`GET /metrics` now returns Prometheus-formatted text by default. The response includes the counters listed above (e.g., `decision_weight_cache_hits_total`, `decision_mode_confidence_bucket`, `decision_breaker_state_open_total`) with the classic `# HELP`/`# TYPE` headers, plus the latency histogram buckets (`decision_latency_ms_bucket`), and summary gauges for the P95, max, sum, and sample count. The final line is a `# HEALTH` comment that mirrors the cached stats, breaker states, and rolling latency snapshot from `decisionEngine.getHealthSnapshot()`, so humans can still spot garbage-in/garbage-out signals in the scrape.

If you need the legacy JSON payload, append `?format=json` to the request and you will receive `{ metrics: [...], health: { cache, breakers, latency } }`, exactly as before.

Sample Prometheus payload:
```
# HELP decision_weight_cache_hits_total Decisions served using cached weights
# TYPE decision_weight_cache_hits_total counter
decision_weight_cache_hits_total 42
# HELP decision_latency_ms_bucket Decision latency histogram buckets (milliseconds)
# TYPE decision_latency_ms_bucket histogram
decision_latency_ms_bucket{le="50"} 10
decision_latency_ms_bucket{le="100"} 37
decision_latency_ms_bucket{le="+Inf"} 120
# HELP decision_latency_ms_p95 95th percentile decision latency in milliseconds
# TYPE decision_latency_ms_p95 gauge
decision_latency_ms_p95 312
# HEALTH {"cache":{"hits":42,"misses":3,"keys":6,"ksize":512,"vsize":2048},"breakers":[{"signal":"SSS","state":"closed"}],"latency":{"count":120,"p95":312,"max":660}}
```

Monitoring dashboards should scrape `/metrics` as usual (prometheus or Grafana), pairing the histogram/latency counters with the embedded `# HEALTH` snapshot for quick debugging without extra HTTP calls.
