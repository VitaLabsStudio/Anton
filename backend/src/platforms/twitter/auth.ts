import { logger } from '../../utils/logger.js';

interface TwitterCredentials {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
  bearerToken: string;
}

export function validateTwitterCredentials(): TwitterCredentials {
  const credentials = {
    appKey: process.env['TWITTER_API_KEY'],
    appSecret: process.env['TWITTER_API_SECRET'],
    accessToken: process.env['TWITTER_ACCESS_TOKEN'],
    accessSecret: process.env['TWITTER_ACCESS_SECRET'],
    bearerToken: process.env['TWITTER_BEARER_TOKEN'],
  };

  // Validate all credentials present
  const missing = Object.entries(credentials)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Twitter credentials: ${missing.join(', ')}`);
  }

  // Validate credential format (basic checks)
  if (credentials.appKey!.length < 10) {
    throw new Error('TWITTER_API_KEY appears invalid (too short)');
  }

  if (credentials.bearerToken!.length < 50) {
    throw new Error('TWITTER_BEARER_TOKEN appears invalid (too short)');
  }

  // SECURITY: Never log actual credentials
  logger.info(
    {
      appKey: `${credentials.appKey!.substring(0, 4)}...`,
      accessToken: `${credentials.accessToken!.substring(0, 4)}...`,
      bearerToken: `${credentials.bearerToken!.substring(0, 8)}...`,
    },
    'Twitter credentials validated'
  );

  return credentials as TwitterCredentials;
}

export const twitterCredentials = validateTwitterCredentials();
