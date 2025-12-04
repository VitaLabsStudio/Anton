import { Hono } from 'hono';

import { RedditClient } from '../../platforms/reddit/client.js';
import { validateSubreddits } from '../../platforms/reddit/subreddit-config.js';

const redditRouter = new Hono();
const redditClient = new RedditClient();

function parseRequestedSubreddits(param?: string | null): string[] {
  if (!param) {
    return ['hangover'];
  }

  return param
    .split(',')
    .map((subreddit) => subreddit.trim())
    .filter(Boolean);
}

redditRouter.get('/verify', async (c) => {
  const requestedSubreddits = parseRequestedSubreddits(c.req.query('subreddits'));
  const approvedSubreddits = validateSubreddits(requestedSubreddits);
  const verification = await redditClient.verifyCredentials();
  const cached = redditClient.getLastVerifiedInfo();

  return c.json({
    status: verification.available ? 'success' : 'error',
    data: {
      username: cached.username,
      karma: cached.karma,
      requestedSubreddits,
      approvedSubreddits,
      rateLimiter: redditClient.getRateLimitStatus(),
    },
    message: verification.message,
  });
});

redditRouter.get('/rate-limit-status', async (c) => {
  try {
    const karma = await redditClient.getKarma();

    return c.json({
      status: 'success',
      data: {
        karma,
        redditEnabled: process.env['REDDIT_ENABLED'] !== 'false',
        rateLimiter: redditClient.getRateLimitStatus(),
        circuitBreaker: redditClient.getCircuitBreakerStatus(),
      },
    });
  } catch (error) {
    return c.json(
      {
        status: 'error',
        message: (error as Error).message,
        data: {
          redditEnabled: process.env['REDDIT_ENABLED'] !== 'false',
          rateLimiter: redditClient.getRateLimitStatus(),
          circuitBreaker: redditClient.getCircuitBreakerStatus(),
        },
      },
      500
    );
  }
});

export { redditRouter };
