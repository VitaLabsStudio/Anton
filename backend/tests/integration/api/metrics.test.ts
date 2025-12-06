import { describe, expect, it } from 'vitest';

import { metricsRouter } from '../../../src/api/routes/metrics.js';

describe('GET /metrics', () => {
  it('returns Prometheus-compatible metrics and exposes the health snapshot as JSON', async () => {
    const promResponse = await metricsRouter.fetch(new Request('http://localhost/'));
    expect(promResponse.status).toBe(200);
    expect(promResponse.headers.get('content-type')).toContain('text/plain');

    const textBody = await promResponse.text();
    expect(textBody).toContain('# HEALTH');
    expect(textBody).toContain('decision_latency_ms_bucket');

    const jsonResponse = await metricsRouter.fetch(new Request('http://localhost/?format=json'));
    expect(jsonResponse.status).toBe(200);
    const payload = await jsonResponse.json();
    expect(payload).toHaveProperty('metrics');
    expect(payload).toHaveProperty('health');
    expect(payload.health).toHaveProperty('cache');
    expect(payload.health).toHaveProperty('breakers');
    expect(payload.health).toHaveProperty('latency');
  });
});
