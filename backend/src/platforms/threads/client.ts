import axios from 'axios';
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

import { appConfig } from '../../config/app-config.js';
import { CircuitBreaker } from '../../utils/circuit-breaker.js';
import { logger } from '../../utils/logger.js';
import { threadsRateLimiter } from '../../utils/rate-limiter.js';

import { getThreadsCredentials } from './auth.js';
import {
  ZodThreadsSearchResponse,
  toInternalPost,
} from './threads.schemas.js';
import type {
  ClientStatus,
  IPlatformClient,
  Post,
} from '../IPlatformClient.js';

const THREADS_API_BASE = 'https://graph.threads.net/v1.0';
const THREADS_HEALTH_CHECK_MS = 5 * 60 * 1000;
const THREADS_CIRCUIT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export class ThreadsClient implements IPlatformClient {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private isAvailable = true;
  private healthCheckHandle?: ReturnType<typeof setInterval>;

  constructor() {
    // Validate credentials on construction (will throw if missing)
    const credentials = getThreadsCredentials();

    this.circuitBreaker = new CircuitBreaker({
      threshold: 5,
      timeout: THREADS_CIRCUIT_TIMEOUT_MS,
    });

    this.client = axios.create({
      baseURL: THREADS_API_BASE,
      timeout: 30_000,
    });

    this.client.interceptors.request.use((config) => {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${credentials.accessToken}`;
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      this.handleApiError.bind(this)
    );

    this.healthCheckHandle = setInterval(
      () => this.performHealthCheck(),
      THREADS_HEALTH_CHECK_MS
    );
  }

  /**
   * Cleanup method to stop health check interval
   */
  shutdown(): void {
    if (this.healthCheckHandle) {
      clearInterval(this.healthCheckHandle);
      this.healthCheckHandle = undefined;
      logger.info('ThreadsClient health check interval cleared');
    }
  }

  private async performHealthCheck(): Promise<void> {
    if (this.isAvailable) {
      return;
    }

    logger.info('Threads availability check running after downtime');
    const status = await this.verifyCredentials();

    if (status.available) {
      logger.info('Threads API recovered during health check');
      this.isAvailable = true;
    }
  }

  private markUnavailable(reason: string): void {
    if (this.isAvailable) {
      logger.warn({ reason }, 'Marking Threads API as unavailable');
    }
    this.isAvailable = false;
  }

  private maskToken(token: string): string {
    if (token.length <= 12) {
      return `${token.slice(0, 4)}***`;
    }
    return `${token.slice(0, 6)}***${token.slice(-4)}`;
  }

  private async handleApiError(
    error: AxiosError
  ): Promise<AxiosResponse<unknown>> {
    const originalRequest = error.config as AxiosRequestConfig & {
      _isRetry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._isRetry
    ) {
      originalRequest._isRetry = true;
      try {
        logger.warn('Threads token expired, attempting refresh');
        const refreshedToken = await this.refreshToken();
        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${refreshedToken}`,
        };
        return this.client(originalRequest);
      } catch (refreshError) {
        logger.error({ refreshError }, 'Token refresh failed');
        this.markUnavailable('token_refresh_failure');
        return Promise.reject(refreshError) as Promise<AxiosResponse<unknown>>;
      }
    }

    if (error.response?.status === 429) {
      logger.warn(
        {
          headers: error.response.headers,
        },
        'Threads API responded with rate limit'
      );
    }

    return Promise.reject(error) as Promise<AxiosResponse<unknown>>;
  }

  private async refreshToken(): Promise<string> {
    const clientId = process.env['THREADS_CLIENT_ID'];
    const clientSecret = process.env['THREADS_CLIENT_SECRET'];
    const credentials = getThreadsCredentials();

    if (!clientId || !clientSecret) {
      throw new Error('Missing Threads client id/secret for token refresh');
    }

    const response = await axios.get(
      'https://graph.facebook.com/v17.0/oauth/access_token',
      {
        timeout: 15_000,
        params: {
          grant_type: 'fb_exchange_token',
          client_id: clientId,
          client_secret: clientSecret,
          fb_exchange_token: credentials.accessToken,
        },
      }
    );

    const newToken = response.data?.access_token;

    if (!newToken) {
      throw new Error('Token refresh response missing access_token');
    }

    credentials.update(newToken);
    process.env['THREADS_ACCESS_TOKEN'] = newToken;

    logger.info(
      { token: this.maskToken(newToken) },
      'Threads access token refreshed'
    );

    return newToken;
  }

  async verifyCredentials(): Promise<ClientStatus> {
    try {
      const response = await threadsRateLimiter.scheduleRead(() =>
        this.circuitBreaker.execute(async () => {
          return this.client.get('/me', {
            params: {
              fields: 'id,username',
            },
          });
        })
      );

      const username = response.data?.username ?? 'unknown';
      this.isAvailable = true;

      logger.info(
        { username },
        'Threads credentials verified successfully'
      );

      return {
        available: true,
        message: `Connected as @${username}`,
      };
    } catch (error) {
      logger.error({ error }, 'Threads credential verification failed');
      this.markUnavailable('credential_verification');

      return {
        available: false,
        message: 'Threads credentials invalid or service unavailable',
      };
    }
  }

  async search(query: string): Promise<Post[]> {
    if (!this.isAvailable) {
      logger.warn('Threads search skipped because Threads API is unavailable');
      return [];
    }

    try {
      const posts = await threadsRateLimiter.scheduleRead(() =>
        this.circuitBreaker.execute(async () => {
          const response = await this.client.get('/threads/search', {
            params: {
              q: query,
              limit: 50,
            },
          });

          const parsed = ZodThreadsSearchResponse.parse(response.data);

          const mapped = parsed.data.map(toInternalPost);

          logger.info(
            {
              query,
              results: mapped.length,
            },
            'Threads search completed'
          );

          logger.debug(
            {
              rateLimiter: threadsRateLimiter.getStatus(),
            },
            'Threads rate limiter status after search'
          );

          return mapped;
        })
      );

      return posts;
    } catch (error) {
      this.markUnavailable('search_failure');
      throw error;
    }
  }

  async reply(threadId: string, content: string): Promise<{ replyId: string }> {
    if (!this.isAvailable) {
      throw new Error('Threads API is currently unavailable');
    }

    if (appConfig.dryRun) {
      const dryRunId = `dry_run_threads_${Date.now()}`;
      logger.info(
        {
          dryRunId,
          threadId,
          content,
        },
        '[DRY RUN] Threads reply suppressed'
      );
      return { replyId: dryRunId };
    }

    if (appConfig.requireApproval) {
      throw new Error('Thread reply approval workflow not yet implemented');
    }

    try {
      const payload = await threadsRateLimiter.scheduleWrite(() =>
        this.circuitBreaker.execute(async () => {
          const response = await this.client.post(
            `/threads/${threadId}/replies`,
            { text: content }
          );

          logger.info(
            {
              threadId,
              replyId: response.data?.id,
            },
            'Threads reply posted'
          );

          logger.debug(
            {
              rateLimiter: threadsRateLimiter.getStatus(),
            },
            'Threads rate limiter status after reply'
          );

          return { replyId: response.data?.id ?? '' };
        })
      );

      if (!payload.replyId) {
        throw new Error('Threads reply failed to return a reply id');
      }

      return payload;
    } catch (error) {
      this.markUnavailable('reply_failure');
      throw error;
    }
  }

  getRateLimitStatus(): ReturnType<typeof threadsRateLimiter.getStatus> {
    return threadsRateLimiter.getStatus();
  }

  getCircuitBreakerStatus(): {
    state: 'CLOSED' | 'HALF_OPEN' | 'OPEN';
    failureCount: number;
  } {
    return {
      state: this.circuitBreaker.getState(),
      failureCount: this.circuitBreaker.getFailureCount(),
    };
  }

  isOperational(): boolean {
    void this.healthCheckHandle;
    return this.isAvailable;
  }
}
