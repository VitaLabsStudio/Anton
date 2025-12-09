/**
 * Authentication Middleware
 *
 * SEC-001: Protects sensitive endpoints with Bearer token authentication
 * Token must be provided in Authorization header: "Bearer <token>"
 * Token value is configured via HEALTH_CHECK_TOKEN environment variable
 */

import type { Context, Next } from 'hono';

import { logger } from '../../utils/logger.js';

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    logger.warn({ path: c.req.path }, 'Auth middleware: No Authorization header');
    return c.json({ error: 'Unauthorized', message: 'Missing Authorization header' }, 401);
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    logger.warn({ path: c.req.path, scheme }, 'Auth middleware: Invalid auth scheme');
    return c.json({ error: 'Unauthorized', message: 'Invalid Authorization format' }, 401);
  }

  const expectedToken = process.env['HEALTH_CHECK_TOKEN'];

  if (!expectedToken) {
    logger.error('Auth middleware: HEALTH_CHECK_TOKEN not configured');
    return c.json({ error: 'Internal Server Error', message: 'Auth not configured' }, 500);
  }

  if (token !== expectedToken) {
    logger.warn({ path: c.req.path }, 'Auth middleware: Invalid token');
    return c.json({ error: 'Unauthorized', message: 'Invalid credentials' }, 401);
  }

  logger.debug({ path: c.req.path }, 'Auth middleware: Authenticated');
  await next();
}
