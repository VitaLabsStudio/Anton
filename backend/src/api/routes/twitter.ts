import { Hono } from 'hono';

import { TwitterClient } from '../../platforms/twitter/client.js';

const twitterRouter = new Hono();
const twitterClient = new TwitterClient();

twitterRouter.get('/verify', async (c) => {
  const status = await twitterClient.verifyCredentials();
  return c.json({
    status: status.available ? 'success' : 'error',
    message: status.message,
    data: {
      available: status.available,
    },
  });
});

twitterRouter.get('/rate-limit-status', (c) => {
  const rateLimitStatus = twitterClient.getRateLimitStatus();
  const circuitBreakerStatus = twitterClient.getCircuitBreakerStatus();
  return c.json({
    status: 'success',
    data: {
      rateLimiter: rateLimitStatus,
      circuitBreaker: circuitBreakerStatus,
    },
  });
});

export { twitterRouter };
