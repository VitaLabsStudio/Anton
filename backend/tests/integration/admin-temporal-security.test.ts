import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { adminTemporalRouter } from '../../src/api/routes/admin-temporal.js';

// Mock dependencies
vi.mock('node:fs', () => ({
    default: {
        readFileSync: vi.fn().mockReturnValue('{"version": "0.1", "rules": []}'),
        writeFileSync: vi.fn(),
        existsSync: vi.fn().mockReturnValue(true),
        resolve: vi.fn()
    }
}));

vi.mock('../../src/utils/prisma.js', () => ({
    prisma: {
        temporalConfigHistory: { create: vi.fn() }
    }
}));

vi.mock('../../src/utils/logger.js', () => ({
    logger: { error: vi.fn(), info: vi.fn() }
}));

// We need to bypass the top-level fs.read/path.resolve in the module if possible
// But vitest mock hoisting should handle it.

describe('Admin Temporal API Security', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should enforce rate limits', async () => {
        // Send 10 requests (allowed)
        for (let i = 0; i < 10; i++) {
            const res = await adminTemporalRouter.request('http://localhost/rules', {
                method: 'GET',
                headers: { 'x-forwarded-for': '127.0.0.1' }
            });
            expect(res.status).not.toBe(429);
        }
        
        // 11th request (blocked)
        const res = await adminTemporalRouter.request('http://localhost/rules', {
            method: 'GET',
            headers: { 'x-forwarded-for': '127.0.0.1' }
        });
        expect(res.status).toBe(429);
        const body = await res.json();
        expect(body.error).toContain('Too many admin requests');
    });

    it('should reject malicious rule IDs', async () => {
        const maliciousPayload = {
            id: '../etc/passwd',
            name: 'Malicious Rule',
            priority: 100,
            enabled: true,
            condition: { type: 'time_range', day: 0, hourStart: 0, hourEnd: 1 },
            strategy: { phase: 'normal', monitoringMultiplier: 1 }
        };

        const res = await adminTemporalRouter.request('http://localhost/rules', {
            method: 'POST',
            body: JSON.stringify(maliciousPayload),
            headers: { 'Content-Type': 'application/json' }
        });

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toContain('Invalid rule ID');
    });
    
    it('should allow valid rule IDs', async () => {
        const validPayload = {
            id: 'valid_rule_1',
            name: 'Valid Rule',
            priority: 100,
            enabled: true,
            condition: { type: 'time_range', day: 0, hourStart: 0, hourEnd: 1 },
            strategy: { phase: 'normal', monitoringMultiplier: 1 }
        };

        const res = await adminTemporalRouter.request('http://localhost/rules', {
            method: 'POST',
            body: JSON.stringify(validPayload),
            headers: { 'Content-Type': 'application/json' }
        });

        expect(res.status).toBe(200); // Or 201 if the router returned that (code says 200 with {success:true})
        // Wait, the router returns c.json({ success: true, rule })
    });
});
