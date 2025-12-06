import crypto from 'node:crypto';

import type { MiddlewareHandler } from 'hono';

import { logger } from '../../utils/logger.js';

export const requestTrace: MiddlewareHandler = async (c, next) => {
  const requestId = c.req.headers.get('x-request-id') ?? crypto.randomUUID();
  c.header('x-request-id', requestId);
  c.set('requestId', requestId);

  const start = process.hrtime.bigint();
  const requestLogger = logger.child({ requestId });
  requestLogger.debug({ method: c.req.method, path: c.req.url }, 'request.trace.start');

  await next();

  const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
  requestLogger.info(
    { status: c.res.status ?? 200, durationMs, path: c.req.url },
    'request.trace.complete'
  );
};
