/**
 * Tests for Auth Middleware
 *
 * Validates:
 * - SEC-001: Bearer token authentication
 * - Missing Authorization header rejection
 * - Invalid token format rejection
 * - Invalid credentials rejection
 * - Successful authentication
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware } from '../../../api/middleware/auth.js';

describe('Auth Middleware', () => {
  let app: Hono;
  const testToken = 'test-secret-token-12345';

  beforeEach(() => {
    app = new Hono();

    // Set test environment variable
    process.env['HEALTH_CHECK_TOKEN'] = testToken;

    // Protected route using auth middleware
    app.get('/protected', authMiddleware, (c) => {
      return c.json({ message: 'success' });
    });
  });

  afterEach(() => {
    delete process.env['HEALTH_CHECK_TOKEN'];
  });

  describe('Authentication Success', () => {
    it('should allow request with valid Bearer token', async () => {
      const req = new Request('http://localhost/protected', {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      });

      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ message: 'success' });
    });
  });

  describe('Authentication Failures', () => {
    it('should reject request without Authorization header', async () => {
      const req = new Request('http://localhost/protected');

      const res = await app.fetch(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toContain('Missing Authorization header');
    });

    it('should reject request with invalid scheme (not Bearer)', async () => {
      const req = new Request('http://localhost/protected', {
        headers: {
          Authorization: `Basic ${testToken}`,
        },
      });

      const res = await app.fetch(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toContain('Invalid Authorization format');
    });

    it('should reject request with missing token', async () => {
      const req = new Request('http://localhost/protected', {
        headers: {
          Authorization: 'Bearer',
        },
      });

      const res = await app.fetch(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should reject request with invalid token', async () => {
      const req = new Request('http://localhost/protected', {
        headers: {
          Authorization: 'Bearer wrong-token',
        },
      });

      const res = await app.fetch(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toContain('Invalid credentials');
    });

    it('should return 500 if HEALTH_CHECK_TOKEN not configured', async () => {
      delete process.env['HEALTH_CHECK_TOKEN'];

      const req = new Request('http://localhost/protected', {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      });

      const res = await app.fetch(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toContain('Auth not configured');
    });
  });

  describe('Security', () => {
    it('should not leak token information in error messages', async () => {
      const req = new Request('http://localhost/protected', {
        headers: {
          Authorization: 'Bearer wrong-token',
        },
      });

      const res = await app.fetch(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(JSON.stringify(body)).not.toContain('wrong-token');
      expect(JSON.stringify(body)).not.toContain(testToken);
    });
  });
});
