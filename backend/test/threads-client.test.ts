import { beforeEach, describe, expect, it, vi } from 'vitest';
type ThreadsClientConstructor = typeof import('../src/platforms/threads/client.js').ThreadsClient;
type ThreadsClientInstance = InstanceType<ThreadsClientConstructor>;
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockRequestUse = vi.fn();
const mockResponseUse = vi.fn();
const mockAxiosInstance = Object.assign(vi.fn(), {
  get: mockGet,
  post: mockPost,
  interceptors: {
    request: { use: mockRequestUse },
    response: { use: mockResponseUse },
  },
});
const mockCreate = vi.fn(() => mockAxiosInstance);
const mockAxiosGlobalGet = vi.fn();
const axiosMock = {
  create: mockCreate,
  get: mockAxiosGlobalGet,
  AxiosError: class MockAxiosError extends Error {},
};

vi.mock('axios', () => ({
  __esModule: true,
  default: axiosMock,
  AxiosError: axiosMock.AxiosError,
}));

vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('ThreadsClient', () => {
let ThreadsClientClass: ThreadsClientConstructor;

  beforeEach(async () => {
    vi.resetModules();
    process.env['THREADS_ACCESS_TOKEN'] = 'EAA_TEST_TOKEN_1234567890';
    process.env['THREADS_CLIENT_ID'] = 'thread-client';
    process.env['THREADS_CLIENT_SECRET'] = 'thread-secret';
    process.env['DRY_RUN'] = 'false';
    process.env['REQUIRE_APPROVAL'] = 'false';

    mockGet.mockReset();
    mockPost.mockReset();
    mockCreate.mockReset();
    mockCreate.mockReturnValue(mockAxiosInstance);
    mockAxiosInstance.mockReset();
    mockRequestUse.mockReset();
    mockResponseUse.mockReset();
    mockAxiosGlobalGet.mockReset();

    const configModule = await import('../src/config/app-config.js');
    configModule.appConfig.dryRun = false;
    configModule.appConfig.requireApproval = false;

    const module = await import('../src/platforms/threads/client.js');
    ThreadsClientClass = module.ThreadsClient;
  });

  afterEach(() => {
    delete process.env['THREADS_ACCESS_TOKEN'];
    delete process.env['THREADS_CLIENT_ID'];
    delete process.env['THREADS_CLIENT_SECRET'];
    delete process.env['DRY_RUN'];
    delete process.env['REQUIRE_APPROVAL'];
  });

function buildClient(): ThreadsClientInstance {
    const client = new ThreadsClientClass();
    const healthHandle = (client as unknown as { healthCheckHandle?: number }).healthCheckHandle;
    if (healthHandle) {
      clearInterval(healthHandle);
    }
    return client;
  }

  it('maps search responses to Post model', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 'thread-1',
            text: 'Need hydration tips',
            author: { id: 'athr', username: 'antone' },
          },
        ],
      },
    });

    const client = buildClient();
    const posts = await client.search('hydrate');

    expect(posts).toEqual([
      {
        id: 'thread-1',
        content: 'Need hydration tips',
        author: { id: 'athr', name: 'antone' },
      },
    ]);
    expect(mockGet).toHaveBeenCalledWith('/threads/search', expect.any(Object));
  });

  it('posts replies and returns replyId', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 'reply-789' } });

    const client = buildClient();
    const response = await client.reply('thread-1', 'Stay hydrated');

    expect(response.replyId).toBe('reply-789');
    expect(mockPost).toHaveBeenCalledWith(
      '/threads/thread-1/replies',
      { text: 'Stay hydrated' }
    );
  });

  it('verifyCredentials returns status and keeps availability', async () => {
    mockGet.mockResolvedValueOnce({ data: { username: 'antone_threads' } });

    const client = buildClient();
    const status = await client.verifyCredentials();

    expect(status.available).toBe(true);
    expect(status.message).toContain('@antone_threads');
    expect(client.isOperational()).toBe(true);
  });

  it('refreshes the token after a 401, retries the original request, and updates credentials before rejecting', async () => {
    const refreshedToken = 'EAA_REFRESHED_TOKEN';
    mockAxiosGlobalGet.mockResolvedValueOnce({ data: { access_token: refreshedToken } });
    mockAxiosInstance.mockRejectedValueOnce(new Error('retry failure'));

    const client = buildClient();
    const [, errorHandler] = mockResponseUse.mock.calls[0] ?? [];
    if (!errorHandler) {
      throw new Error('Axios response interceptor error handler was not registered');
    }

    const axiosError = new axiosMock.AxiosError('Unauthorized');
    axiosError.response = { status: 401, headers: {} };
    axiosError.config = {
      url: '/threads/search',
      method: 'get',
      headers: {
        Authorization: 'Bearer EAA_TEST_TOKEN_1234567890',
      },
    };

    await expect(errorHandler(axiosError)).rejects.toThrow('retry failure');

    expect(mockAxiosGlobalGet).toHaveBeenCalledWith(
      'https://graph.facebook.com/v17.0/oauth/access_token',
      expect.objectContaining({
        params: expect.objectContaining({
          fb_exchange_token: 'EAA_TEST_TOKEN_1234567890',
        }),
      })
    );

    expect(mockAxiosInstance.mock.calls[0][0]).toMatchObject({
      headers: {
        Authorization: `Bearer ${refreshedToken}`,
      },
    });

    const { threadsCredentials } = await import('../src/platforms/threads/auth.js');

    expect(threadsCredentials.accessToken).toBe(refreshedToken);
    expect(process.env['THREADS_ACCESS_TOKEN']).toBe(refreshedToken);
  });

  it('performs health checks after markUnavailable and restores availability when /me succeeds', async () => {
    const client = buildClient();
    const privateClient = client as unknown as {
      markUnavailable: (reason: string) => void;
      performHealthCheck: () => Promise<void>;
    };

    privateClient.markUnavailable('manual');
    expect(client.isOperational()).toBe(false);

    mockGet.mockResolvedValueOnce({ data: { username: 'restored_user' } });

    const { logger } = await import('../src/utils/logger.js');
    const infoMock = logger.info as unknown as ReturnType<typeof vi.fn>;
    infoMock.mockClear();

    await privateClient.performHealthCheck();

    expect(mockGet).toHaveBeenCalledWith('/me', expect.any(Object));
    const recoveredCall = infoMock.mock.calls.find(([message]) => message === 'Threads API recovered during health check');
    expect(recoveredCall).toBeTruthy();
    expect(client.isOperational()).toBe(true);
  });
});
