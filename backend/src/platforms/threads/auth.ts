import { logger } from '../../utils/logger.js';

const MASK_PLACEHOLDER = '***';

function maskToken(value: string): string {
  if (value.length <= 12) {
    return `${value.slice(0, 4)}${MASK_PLACEHOLDER}`;
  }
  return `${value.slice(0, 6)}${MASK_PLACEHOLDER}${value.slice(-4)}`;
}

class ThreadsCredentialsStore {
  #token: string;

  constructor(token: string) {
    this.#token = token;
  }

  get accessToken(): string {
    return this.#token;
  }

  update(token: string): void {
    this.#token = token;
  }
}

export function validateThreadsCredentials(): ThreadsCredentialsStore {
  const token = process.env['THREADS_ACCESS_TOKEN']?.trim();

  if (!token) {
    throw new Error('Missing THREADS_ACCESS_TOKEN environment variable');
  }

  if (!token.startsWith('EAA')) {
    logger.warn('THREADS_ACCESS_TOKEN does not appear to use the Meta/EAA prefix');
  }

  logger.info({ token: maskToken(token) }, 'Threads credentials validated (token masked)');

  return new ThreadsCredentialsStore(token);
}

// Lazy initialization - only validate when accessed
let _threadsCredentials: ThreadsCredentialsStore | undefined;

export function getThreadsCredentials(): ThreadsCredentialsStore {
  if (!_threadsCredentials) {
    _threadsCredentials = validateThreadsCredentials();
  }
  return _threadsCredentials;
}
