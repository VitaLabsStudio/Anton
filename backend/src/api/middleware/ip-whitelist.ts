/**
 * IP Whitelist Middleware
 *
 * SEC-001: Restricts access to internal monitoring IPs only
 * Whitelist is configured via ALLOWED_IPS environment variable (comma-separated)
 * Example: ALLOWED_IPS="127.0.0.1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
 *
 * Supports both individual IPs and CIDR ranges
 */

import type { Context, Next } from 'hono';

import { logger } from '../../utils/logger.js';

/**
 * Parse CIDR notation and check if IP is in range
 */
function isIpInCidr(ip: string, cidr: string): boolean {
  const parts = cidr.split('/');
  const range = parts[0];
  const bits = parts[1];

  if (!range) {
    return false;
  }

  const mask = bits ? ~(2 ** (32 - parseInt(bits)) - 1) : -1;

  const ipInt = ip.split('.').reduce((int, octet) => (int << 8) + parseInt(octet), 0) >>> 0;
  const rangeInt = range.split('.').reduce((int, octet) => (int << 8) + parseInt(octet), 0) >>> 0;

  return (ipInt & mask) === (rangeInt & mask);
}

/**
 * Extract client IP from request
 * Checks X-Forwarded-For header first (for proxied requests)
 */
function getClientIp(c: Context): string {
  // Check X-Forwarded-For header (common in load balancers/proxies)
  const forwardedFor = c.req.header('X-Forwarded-For');
  if (forwardedFor) {
    // Take first IP in the chain
    const firstIp = forwardedFor.split(',')[0];
    return firstIp ? firstIp.trim() : '127.0.0.1';
  }

  // Check X-Real-IP header
  const realIp = c.req.header('X-Real-IP');
  if (realIp) {
    return realIp;
  }

  // Fallback to direct connection IP
  // Note: This may not be available in all environments
  return '127.0.0.1'; // Default for local development
}

export async function ipWhitelistMiddleware(c: Context, next: Next): Promise<Response | void> {
  const allowedIpsRaw = process.env['ALLOWED_IPS'];

  if (!allowedIpsRaw) {
    logger.error('IP whitelist middleware: ALLOWED_IPS not configured');
    return c.json({ error: 'Internal Server Error', message: 'IP whitelist not configured' }, 500);
  }

  const allowedIps = allowedIpsRaw.split(',').map((ip) => ip.trim());
  const clientIp = getClientIp(c);

  // Check if client IP matches any allowed IP or CIDR range
  const isAllowed = allowedIps.some((allowed) => {
    if (allowed.includes('/')) {
      // CIDR range
      return isIpInCidr(clientIp, allowed);
    } else {
      // Exact IP match
      return clientIp === allowed;
    }
  });

  if (!isAllowed) {
    logger.warn(
      {
        path: c.req.path,
        clientIp,
        allowedIps,
      },
      'IP whitelist middleware: Blocked'
    );
    return c.json({ error: 'Forbidden', message: 'IP not whitelisted' }, 403);
  }

  logger.debug({ path: c.req.path, clientIp }, 'IP whitelist middleware: Allowed');
  await next();
}
