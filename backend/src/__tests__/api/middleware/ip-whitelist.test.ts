/**
 * Tests for IP Whitelist Middleware
 *
 * Validates:
 * - SEC-001: IP-based access control
 * - Individual IP whitelisting
 * - CIDR range whitelisting
 * - X-Forwarded-For header support
 * - Rejection of non-whitelisted IPs
 */

import { Hono } from 'hono';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ipWhitelistMiddleware } from '../../../api/middleware/ip-whitelist.js';

describe('IP Whitelist Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();

    // Protected route using IP whitelist middleware
    app.get('/protected', ipWhitelistMiddleware, (c) => {
      return c.json({ message: 'success' });
    });
  });

  afterEach(() => {
    delete process.env['ALLOWED_IPS'];
  });

  describe('Individual IP Whitelisting', () => {
    it('should allow request from whitelisted IP', async () => {
      process.env['ALLOWED_IPS'] = '192.168.1.100';

      const req = new Request('http://localhost/protected', {
        headers: {
          'X-Forwarded-For': '192.168.1.100',
        },
      });

      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ message: 'success' });
    });

    it('should allow request from any whitelisted IP in comma-separated list', async () => {
      process.env['ALLOWED_IPS'] = '192.168.1.100,10.0.0.50,172.16.0.10';

      const testIps = ['192.168.1.100', '10.0.0.50', '172.16.0.10'];

      for (const ip of testIps) {
        const req = new Request('http://localhost/protected', {
          headers: {
            'X-Forwarded-For': ip,
          },
        });

        const res = await app.fetch(req);

        expect(res.status).toBe(200);
      }
    });

    it('should reject request from non-whitelisted IP', async () => {
      process.env['ALLOWED_IPS'] = '192.168.1.100';

      const req = new Request('http://localhost/protected', {
        headers: {
          'X-Forwarded-For': '192.168.1.200',
        },
      });

      const res = await app.fetch(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Forbidden');
      expect(body.message).toContain('IP not whitelisted');
    });
  });

  describe('CIDR Range Whitelisting', () => {
    it('should allow request from IP within CIDR range', async () => {
      process.env['ALLOWED_IPS'] = '192.168.1.0/24';

      // Test multiple IPs in the range
      const testIps = ['192.168.1.1', '192.168.1.50', '192.168.1.255'];

      for (const ip of testIps) {
        const req = new Request('http://localhost/protected', {
          headers: {
            'X-Forwarded-For': ip,
          },
        });

        const res = await app.fetch(req);

        expect(res.status).toBe(200);
      }
    });

    it('should reject request from IP outside CIDR range', async () => {
      process.env['ALLOWED_IPS'] = '192.168.1.0/24';

      const req = new Request('http://localhost/protected', {
        headers: {
          'X-Forwarded-For': '192.168.2.1',
        },
      });

      const res = await app.fetch(req);

      expect(res.status).toBe(403);
    });

    it('should support multiple CIDR ranges', async () => {
      process.env['ALLOWED_IPS'] = '10.0.0.0/8,172.16.0.0/12,192.168.0.0/16';

      const testIps = ['10.1.2.3', '172.20.5.10', '192.168.100.50'];

      for (const ip of testIps) {
        const req = new Request('http://localhost/protected', {
          headers: {
            'X-Forwarded-For': ip,
          },
        });

        const res = await app.fetch(req);

        expect(res.status).toBe(200);
      }
    });
  });

  describe('Mixed Individual IPs and CIDR Ranges', () => {
    it('should support combination of individual IPs and CIDR ranges', async () => {
      process.env['ALLOWED_IPS'] = '192.168.1.100,10.0.0.0/8';

      const testIps = ['192.168.1.100', '10.5.10.20'];

      for (const ip of testIps) {
        const req = new Request('http://localhost/protected', {
          headers: {
            'X-Forwarded-For': ip,
          },
        });

        const res = await app.fetch(req);

        expect(res.status).toBe(200);
      }
    });
  });

  describe('Header Parsing', () => {
    it('should use X-Forwarded-For header when present', async () => {
      process.env['ALLOWED_IPS'] = '203.0.113.50';

      const req = new Request('http://localhost/protected', {
        headers: {
          'X-Forwarded-For': '203.0.113.50',
        },
      });

      const res = await app.fetch(req);

      expect(res.status).toBe(200);
    });

    it('should use X-Real-IP header when X-Forwarded-For not present', async () => {
      process.env['ALLOWED_IPS'] = '203.0.113.50';

      const req = new Request('http://localhost/protected', {
        headers: {
          'X-Real-IP': '203.0.113.50',
        },
      });

      const res = await app.fetch(req);

      expect(res.status).toBe(200);
    });

    it('should handle X-Forwarded-For with multiple IPs (use first)', async () => {
      process.env['ALLOWED_IPS'] = '203.0.113.50';

      const req = new Request('http://localhost/protected', {
        headers: {
          'X-Forwarded-For': '203.0.113.50, 10.0.0.1, 192.168.1.1',
        },
      });

      const res = await app.fetch(req);

      expect(res.status).toBe(200);
    });
  });

  describe('Configuration Validation', () => {
    it('should return 500 if ALLOWED_IPS not configured', async () => {
      delete process.env['ALLOWED_IPS'];

      const req = new Request('http://localhost/protected', {
        headers: {
          'X-Forwarded-For': '192.168.1.1',
        },
      });

      const res = await app.fetch(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toContain('IP whitelist not configured');
    });
  });

  describe('Security', () => {
    it('should not leak allowed IPs in error messages to unauthorized clients', async () => {
      process.env['ALLOWED_IPS'] = '192.168.1.100,10.0.0.0/8';

      const req = new Request('http://localhost/protected', {
        headers: {
          'X-Forwarded-For': '1.2.3.4',
        },
      });

      const res = await app.fetch(req);

      expect(res.status).toBe(403);
      const body = await res.json();

      // Error message should not contain specific allowed IPs
      expect(body.message).not.toContain('192.168.1.100');
      expect(body.message).not.toContain('10.0.0.0');
    });
  });
});
