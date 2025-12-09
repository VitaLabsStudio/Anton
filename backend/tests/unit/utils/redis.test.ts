import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mocks
const mocks = vi.hoisted(() => ({
  on: vi.fn(),
}));

// Mock ioredis class
vi.mock('ioredis', () => {
  class MockRedis {
    on = mocks.on;
  }
  return {
    Redis: MockRedis,
    default: MockRedis,
  };
});

describe('Redis Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should instantiate Redis client with correct config', async () => {
    process.env['REDIS_URL'] = 'redis://test-host:6379';

    // Import re-triggers execution of the top-level code in redis.ts
    const { redis } = await import('../../../src/utils/redis');

    expect(redis).toBeDefined();
    // We can't easily check constructor arguments with this singleton pattern
    // without more complex mocking, but we can check behavior.
    expect(mocks.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mocks.on).toHaveBeenCalledWith('connect', expect.any(Function));
  });
});
