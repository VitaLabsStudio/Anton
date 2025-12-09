import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StreamMonitorWorker } from '../../src/workers/stream-monitor.js';
import * as temporalIntelligence from '../../src/analysis/temporal-intelligence.js';
import { logger } from '../../src/utils/logger.js';

// Mock dependencies
vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    author: { upsert: vi.fn() },
    post: { upsert: vi.fn() },
    workerHeartbeat: { upsert: vi.fn() },
  },
}));

// Mock monitors and clients
vi.mock('../../src/platforms/reddit/monitor.js', () => ({
  RedditMonitor: vi.fn().mockImplementation(() => ({
    scan: vi.fn().mockResolvedValue([]),
  })),
}));
vi.mock('../../src/platforms/twitter/monitor.js', () => ({
  TwitterMonitor: vi.fn().mockImplementation(() => ({
    scan: vi.fn().mockResolvedValue([]),
  })),
}));
vi.mock('../../src/platforms/threads/monitor.js', () => ({
  ThreadsMonitor: vi.fn().mockImplementation(() => ({
    scan: vi.fn().mockResolvedValue([]),
  })),
}));
vi.mock('../../src/platforms/reddit/client.js', () => ({
  RedditClient: vi.fn(),
}));
vi.mock('../../src/guards/karma-gate.js', () => ({
  karmaGate: {
    checkCached: vi.fn().mockResolvedValue({ allowed: true }),
    logStatus: vi.fn(),
    getCacheStatus: vi.fn(),
  },
}));
vi.mock('../../src/analysis/temporal-intelligence.js');

describe('Temporal Monitoring Integration', () => {
  let worker: StreamMonitorWorker;
  const baseInterval = 60000; // 60 seconds

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    process.env.TEMPORAL_MIGRATION_MODE = 'new_only';
    worker = new StreamMonitorWorker({ baseInterval, enabled: true });
    
    // Stub scanCycle to avoid complex logic execution
    // We are only testing the interval calculation in the loop
    vi.spyOn(worker as any, 'scanCycle').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    worker.stop();
  });

  it('should speed up monitoring by 3x during high-intensity periods (Sunday Morning)', async () => {
    // Arrange: Mock high multiplier context
    vi.mocked(temporalIntelligence.getTemporalContext).mockReturnValue({
      phase: 'peak_suffering',
      monitoringMultiplier: 3.0,
      matchedRules: ['sunday_morning_peak'],
      timezone: 'UTC',
      localTime: '2025-12-14T09:00:00', // Sunday 9am
    });

    // Act: Trigger one loop iteration manually
    (worker as any).isRunning = true;
    await (worker as any).loop();
    
    // Assert: Check logs for adjusted interval
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        baseInterval,
        adjustedInterval: 20000, // 60000 / 3
        monitoringMultiplier: 3.0,
      }),
      'temporal_monitoring_adjusted'
    );
  });

  it('should speed up monitoring by 1.5x during medium-intensity periods (Thursday Evening)', async () => {
    // Arrange: Mock medium multiplier context
    vi.mocked(temporalIntelligence.getTemporalContext).mockReturnValue({
      phase: 'prevention',
      monitoringMultiplier: 1.5,
      matchedRules: ['thursday_prevention'],
      timezone: 'UTC',
      localTime: '2025-12-11T18:00:00', // Thursday 6pm
    });

    // Act
    (worker as any).isRunning = true;
    await (worker as any).loop();

    // Assert
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        baseInterval,
        adjustedInterval: 40000, // 60000 / 1.5
        monitoringMultiplier: 1.5,
      }),
      'temporal_monitoring_adjusted'
    );
  });

  it('should use base interval when no multiplier is present (Normal)', async () => {
    // Arrange: Mock normal context
    vi.mocked(temporalIntelligence.getTemporalContext).mockReturnValue({
      phase: 'normal',
      monitoringMultiplier: 1.0,
      matchedRules: [],
      timezone: 'UTC',
      localTime: '2025-12-10T12:00:00',
    });

    // Act
    (worker as any).isRunning = true;
    await (worker as any).loop();

    // Assert
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        baseInterval,
        adjustedInterval: 60000, // 60000 / 1
        monitoringMultiplier: 1.0,
      }),
      'temporal_monitoring_adjusted'
    );
  });
});