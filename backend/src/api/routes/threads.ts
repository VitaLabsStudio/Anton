import { Hono } from 'hono';

import { ThreadsClient } from '../../platforms/threads/client.js';
import { logger } from '../../utils/logger.js';

const threadsRouter = new Hono();
const threadsClient = new ThreadsClient();

threadsRouter.use('*', async (c, next) => {
  const secret = process.env['THREADS_ROUTE_SECRET'];
  if (!secret) {
    return next();
  }

  const provided =
    c.req.header('x-antone-threads-secret') ??
    c.req.header('authorization')?.replace(/^Bearer\s+/i, '');

  if (provided !== secret) {
    logger.warn(
      {
        path: c.req.path,
        provided,
      },
      'Unauthorized Threads API request'
    );
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  return next();
});

threadsRouter.get('/verify', async (c) => {
  const status = await threadsClient.verifyCredentials();

  if (!status.available) {
    logger.warn(
      {
        message: status.message,
      },
      'Threads verification failed'
    );
  }

  return c.json({
    status: status.available ? 'success' : 'error',
    message: status.message,
    data: {
      available: status.available,
      info: status.message,
    },
  });
});

threadsRouter.get('/rate-limit-status', (c) => {
  const rateLimiter = threadsClient.getRateLimitStatus();
  const circuitBreaker = threadsClient.getCircuitBreakerStatus();
  const isAvailable = threadsClient.isOperational();

  logger.info(
    {
      rateLimiter,
      circuitBreaker,
      available: isAvailable,
    },
    'Threads rate limit status requested'
  );

  return c.json({
    status: 'success',
    data: {
      available: isAvailable,
      rateLimiter,
      circuitBreaker,
    },
  });
});

export { threadsRouter };
