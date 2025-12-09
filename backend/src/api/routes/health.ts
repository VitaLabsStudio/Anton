/**
 * Health Check Routes
 *
 * AC-1: Public and Protected Endpoints
 * - GET /health: Public, fast (<10ms), returns { status: "ok" }
 * - GET /health/detailed: Protected (Auth + IP Whitelist), returns full component status
 *
 * AC-2: Performance (PERF-001)
 * - Serves cached results from HealthCheckService
 * - Background checks run every 60s
 *
 * AC-3: Security (SEC-001)
 * - Detailed endpoint requires Bearer token auth
 * - Detailed endpoint enforces IP whitelisting
 * - No sensitive info in responses
 */

import { Hono } from 'hono';

import { HealthCheckService } from '../../services/health-check.js';
import { authMiddleware } from '../middleware/auth.js';
import { ipWhitelistMiddleware } from '../middleware/ip-whitelist.js';

const healthRouter = new Hono();

// Initialize health check service (singleton instance)
const healthCheckService = new HealthCheckService();

/**
 * GET /health
 * Public health endpoint - fast, minimal info
 * AC-1: Returns JSON { status: "ok" } in <10ms
 */
healthRouter.get('/', (c) => {
  return c.json({ status: 'ok' });
});

/**
 * GET /health/detailed
 * Protected health endpoint - full component status
 * AC-1: Requires authentication and IP whitelisting
 * AC-3: Returns detailed component health, no sensitive data
 * AC-4: Returns 503 if overall health is 'unhealthy'
 */
healthRouter.get('/detailed', authMiddleware, ipWhitelistMiddleware, async (c) => {
  const health = await healthCheckService.getHealth();

  // Return 503 Service Unavailable if system is unhealthy
  const statusCode = health.status === 'unhealthy' ? 503 : 200;

  return c.json(health, statusCode);
});

export { healthRouter };
