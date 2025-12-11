import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';

import { requestTrace } from './api/middleware/request-trace.js';
import { decisionsRouter } from './api/routes/decisions.js';
import { healthRouter } from './api/routes/health.js';
import { metricsRouter } from './api/routes/metrics.js';
import { adminTemporalRouter } from './api/routes/admin-temporal.js';
import { redditRouter } from './api/routes/reddit.js';
import { threadsRouter } from './api/routes/threads.js';
import { twitterRouter } from './api/routes/twitter.js';
import { mlRouter } from './api/routes/ml.js';
import { analyticsTemporalRouter } from './api/routes/analytics-temporal.js';
import { authorsRouter } from './api/routes/authors.js';
import { competitiveRouter } from './api/routes/competitive.js';
import { startTemporalConfigWatcher } from './services/temporal-config-watcher.js';

const app = new Hono();

app.use('*', requestTrace);
app.use('*', logger());

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.route('/api/twitter', twitterRouter);
app.route('/api/reddit', redditRouter);
app.route('/api/threads', threadsRouter);
app.route('/api/admin/temporal', adminTemporalRouter);
app.route('/api/ml', mlRouter);
app.route('/api/analytics/temporal', analyticsTemporalRouter);
app.route('/health', healthRouter);
app.route('/metrics', metricsRouter);
app.route('/api/decisions', decisionsRouter);
app.route('/api/authors', authorsRouter);
app.route('/api/competitive', competitiveRouter);

// Start config watcher if enabled
startTemporalConfigWatcher();

const port = Number(process.env['PORT']) || 3001;
const hostname = '0.0.0.0'; // OPS-001: Required for Docker health checks

console.info('');
console.info('🚀 Antone API Server Starting...');
console.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.info(`📡 Listening on: http://${hostname}:${port}`);
console.info(`💚 Health check: http://${hostname}:${port}/health`);
console.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.info('');

serve({
  fetch: app.fetch,
  hostname, // CRITICAL: Must be 0.0.0.0 for Docker health checks (OPS-001)
  port,
});

export default app;
