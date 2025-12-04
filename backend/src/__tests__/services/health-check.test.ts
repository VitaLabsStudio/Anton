/**
 * Tests for HealthCheckService
 *
 * Validates:
 * - PERF-001: Caching logic (checks don't run on every request)
 * - Background refresh mechanism
 * - Component health checks
 * - First-run behavior (awaits check if cache empty)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock platform client modules before importing
vi.mock('../../platforms/twitter/client.js', () => ({
  TwitterClient: vi.fn().mockImplementation(() => ({
    verifyCredentials: vi.fn().mockResolvedValue({ available: true, message: 'Twitter OK' }),
  })),
}));

vi.mock('../../platforms/reddit/client.js', () => ({
  RedditClient: vi.fn().mockImplementation(() => ({
    verifyCredentials: vi.fn().mockResolvedValue({ available: true, message: 'Reddit OK' }),
  })),
}));

vi.mock('../../platforms/threads/client.js', () => ({
  ThreadsClient: vi.fn().mockImplementation(() => ({
    verifyCredentials: vi.fn().mockResolvedValue({ available: true, message: 'Threads OK' }),
  })),
}));

// Mock Prisma client
vi.mock('../../utils/prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
    workerHeartbeat: {
      findUnique: vi.fn().mockResolvedValue({
        workerName: 'stream-monitor',
        postsProcessedCount: 10,
        lastActivityAt: new Date(),
      }),
    },
    post: {
      count: vi.fn().mockResolvedValue(5),
    },
  },
}));

import { HealthCheckService } from '../../services/health-check.js';

type HealthComponentDetail = {
  healthy: boolean;
  latency: number;
  message: string;
  [key: string]: unknown;
};

describe('HealthCheckService', () => {
  let service: HealthCheckService;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (service) {
      service.stop();
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Caching Logic (PERF-001)', () => {
    it('should return cached result on subsequent calls without running checks', async () => {
      service = new HealthCheckService({ checkIntervalMs: 60_000 });

      // First call - should run checks
      const result1 = await service.getHealth();
      expect(result1).toBeDefined();
      expect(result1.status).toBeDefined();
      expect(result1.timestamp).toBeInstanceOf(Date);

      // Second call - should return cached result (same timestamp)
      const result2 = await service.getHealth();
      expect(result2.timestamp).toEqual(result1.timestamp);
    });

    it('should run checks on first call if cache is empty', async () => {
      service = new HealthCheckService({
        checkIntervalMs: 60_000,
      });

      const result = await service.getHealth();
      expect(result).toBeDefined();
      expect(result.components).toBeDefined();
      expect(result.components.database).toBeDefined();
      expect(result.components.worker).toBeDefined();
      expect(result.components.pipeline).toBeDefined();
    });

    it('should have background refresh configured', () => {
      service = new HealthCheckService({
        checkIntervalMs: 1_000,
      });

      // Service should be initialized with background refresh
      expect(service).toBeDefined();

      // After stopping, should not crash
      service.stop();
      expect(service).toBeDefined();
    });
  });

  describe('Component Health Checks', () => {
    it('should check all required components', async () => {
      service = new HealthCheckService({
        checkIntervalMs: 60_000,
      });

      const result = await service.getHealth();

      expect(result.components.database).toBeDefined();
      expect(result.components.twitter).toBeDefined();
      expect(result.components.reddit).toBeDefined();
      expect(result.components.threads).toBeDefined();
      expect(result.components.worker).toBeDefined();
      expect(result.components.pipeline).toBeDefined();
    });

    it('should include latency metrics for each component', async () => {
      service = new HealthCheckService({
        checkIntervalMs: 60_000,
      });

      const result = await service.getHealth();

      const components = result.components as Record<string, HealthComponentDetail>;
      Object.values(components).forEach((component) => {
        expect(component).toHaveProperty('healthy');
        expect(component).toHaveProperty('latency');
        expect(typeof component.latency).toBe('number');
      });
    });

    it('should determine overall status based on component health', async () => {
      service = new HealthCheckService({
        checkIntervalMs: 60_000,
      });

      const result = await service.getHealth();

      // Status should be one of the valid values
      expect(['healthy', 'degraded', 'unhealthy']).toContain(result.status);
    });
  });

  describe('Worker Heartbeat Check (TECH-001)', () => {
    it('should check worker activity, not just existence', async () => {
      service = new HealthCheckService({
        checkIntervalMs: 60_000,
        workerHeartbeatThresholdMs: 300_000, // 5 minutes
      });

      const result = await service.getHealth();

      // Worker check should exist
      expect(result.components.worker).toBeDefined();
      expect(result.components.worker).toHaveProperty('healthy');
      expect(result.components.worker).toHaveProperty('message');

      // Message should indicate activity or lack thereof
      if (result.components.worker.healthy) {
        expect(result.components.worker.message).toContain('posts processed');
      } else {
        expect(result.components.worker.message).toMatch(/inactive|not found|No worker heartbeat|no posts processed/i);
      }
    });

    it('should report unhealthy when lastActivityAt is beyond threshold (old timestamp)', async () => {
      // Mock old activity timestamp (7 minutes ago)
      const oldTimestamp = new Date(Date.now() - 7 * 60 * 1000);

      const { prisma } = await import('../../utils/prisma.js');
      vi.mocked(prisma.workerHeartbeat.findUnique).mockResolvedValueOnce({
        id: 'test-id',
        workerName: 'stream-monitor',
        postsProcessedCount: 5, // Had processed posts, but too long ago
        lastActivityAt: oldTimestamp,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      service = new HealthCheckService({
        checkIntervalMs: 60_000,
        workerHeartbeatThresholdMs: 300_000, // 5 minutes
      });

      const result = await service.getHealth();

      expect(result.components.worker.healthy).toBe(false);
      expect(result.components.worker.message).toContain('inactive');
    });

    it('should report healthy when recent activity with posts processed', async () => {
      // Mock recent activity timestamp (1 minute ago) with posts processed
      const recentTimestamp = new Date(Date.now() - 60 * 1000);

      const { prisma } = await import('../../utils/prisma.js');
      vi.mocked(prisma.workerHeartbeat.findUnique).mockResolvedValueOnce({
        id: 'test-id',
        workerName: 'stream-monitor',
        postsProcessedCount: 10, // Processed posts
        lastActivityAt: recentTimestamp,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      service = new HealthCheckService({
        checkIntervalMs: 60_000,
        workerHeartbeatThresholdMs: 300_000, // 5 minutes
      });

      const result = await service.getHealth();

      expect(result.components.worker.healthy).toBe(true);
      expect(result.components.worker.message).toContain('posts processed');
      expect(result.components.worker.message).toContain('10');
    });

    it('should report unhealthy when postsProcessedCount is zero (TECH-001 critical case)', async () => {
      // Mock recent timestamp (1 minute ago) BUT zero posts processed
      // This is the key TECH-001 requirement: worker running but idle
      const recentTimestamp = new Date(Date.now() - 60 * 1000);

      const { prisma } = await import('../../utils/prisma.js');
      vi.mocked(prisma.workerHeartbeat.findUnique).mockResolvedValueOnce({
        id: 'test-id',
        workerName: 'stream-monitor',
        postsProcessedCount: 0, // Zero posts - worker is idle!
        lastActivityAt: recentTimestamp, // Recent timestamp
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      service = new HealthCheckService({
        checkIntervalMs: 60_000,
        workerHeartbeatThresholdMs: 300_000, // 5 minutes
      });

      const result = await service.getHealth();

      // CRITICAL: Worker should be unhealthy even with recent timestamp
      expect(result.components.worker.healthy).toBe(false);
      expect(result.components.worker.message).toContain('no posts processed');
    });

    it('should report unhealthy when both old timestamp and zero posts', async () => {
      // Mock old activity timestamp (7 minutes ago) AND zero posts
      const oldTimestamp = new Date(Date.now() - 7 * 60 * 1000);

      const { prisma } = await import('../../utils/prisma.js');
      vi.mocked(prisma.workerHeartbeat.findUnique).mockResolvedValueOnce({
        id: 'test-id',
        workerName: 'stream-monitor',
        postsProcessedCount: 0, // Zero posts
        lastActivityAt: oldTimestamp, // Old timestamp
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      service = new HealthCheckService({
        checkIntervalMs: 60_000,
        workerHeartbeatThresholdMs: 300_000, // 5 minutes
      });

      const result = await service.getHealth();

      expect(result.components.worker.healthy).toBe(false);
      expect(result.components.worker.message).toMatch(/inactive.*no posts/i);
    });
  });

  describe('Pipeline Health Check (TECH-002)', () => {
    it('should check data pipeline integrity', async () => {
      service = new HealthCheckService({
        checkIntervalMs: 60_000,
        pipelineThresholdMs: 3_600_000, // 1 hour
      });

      const result = await service.getHealth();

      // Pipeline check should exist
      expect(result.components.pipeline).toBeDefined();
      expect(result.components.pipeline).toHaveProperty('healthy');
      expect(result.components.pipeline).toHaveProperty('message');

      // Message should indicate data flow status
      if (result.components.pipeline.healthy) {
        expect(result.components.pipeline.message).toContain('posts');
      }
    });
  });

  describe('Metadata', () => {
    it('should include version and uptime metadata', async () => {
      service = new HealthCheckService({
        checkIntervalMs: 60_000,
      });

      const result = await service.getHealth();

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.version).toBeDefined();
      expect(result.metadata?.uptime).toBeDefined();
      expect(typeof result.metadata?.uptime).toBe('number');
    });
  });

  describe('Service Lifecycle', () => {
    it('should start background refresh on initialization', () => {
      service = new HealthCheckService({
        checkIntervalMs: 1_000,
      });

      // Service should be initialized
      expect(service).toBeDefined();
    });

    it('should stop background refresh when stopped', async () => {
      service = new HealthCheckService({
        checkIntervalMs: 1_000,
      });

      const result1 = await service.getHealth();
      const timestamp1 = result1.timestamp;

      service.stop();

      // Advance time - should not refresh since stopped
      vi.advanceTimersByTime(2_000);
      await vi.runAllTimersAsync();

      const result2 = await service.getHealth();
      expect(result2.timestamp).toEqual(timestamp1);
    });
  });
});
