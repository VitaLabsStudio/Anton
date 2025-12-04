import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';

import { redditRouter } from './api/routes/reddit.js';
import { threadsRouter } from './api/routes/threads.js';
import { twitterRouter } from './api/routes/twitter.js';
import { healthRouter } from './api/routes/health.js';

const app = new Hono();

app.use('*', logger());

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.route('/api/twitter', twitterRouter);
app.route('/api/reddit', redditRouter);
app.route('/api/threads', threadsRouter);
app.route('/health', healthRouter);

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
