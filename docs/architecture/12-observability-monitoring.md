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
