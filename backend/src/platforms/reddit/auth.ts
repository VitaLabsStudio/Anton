import { logger } from '../../utils/logger.js';

export interface RedditCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  userAgent: string;
}

const MASK_PLACEHOLDER = '***';

function maskValue(value: string, visible: number): string {
  if (value.length <= visible) {
    return MASK_PLACEHOLDER;
  }
  return `${value.slice(0, visible)}${MASK_PLACEHOLDER}`;
}

export function validateRedditCredentials(): RedditCredentials {
  const credentials = {
    clientId: process.env['REDDIT_CLIENT_ID'],
    clientSecret: process.env['REDDIT_CLIENT_SECRET'],
    refreshToken: process.env['REDDIT_REFRESH_TOKEN'],
    userAgent:
      process.env['REDDIT_USER_AGENT'] ?? 'Antone/1.0.0 (by /u/antone_vita)',
  };

  const missing = Object.entries(credentials)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Reddit credentials: ${missing.join(', ')}`);
  }

  if (!credentials.refreshToken!.startsWith('refresh_token=')) {
    logger.warn(
      'REDDIT_REFRESH_TOKEN may have incorrect format (expected refresh_token=...)'
    );
  }

  logger.info(
    {
      clientId: maskValue(credentials.clientId!, 4),
      refreshToken: maskValue(credentials.refreshToken!, 12),
      userAgent: credentials.userAgent,
    },
    'Reddit credentials validated'
  );

  return credentials as RedditCredentials;
}

// Lazy initialization - only validate when accessed
let _redditCredentials: RedditCredentials | undefined;

export function getRedditCredentials(): RedditCredentials {
  if (!_redditCredentials) {
    _redditCredentials = validateRedditCredentials();
  }
  return _redditCredentials;
}
