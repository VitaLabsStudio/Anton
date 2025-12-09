import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTemporalContext } from '../../src/analysis/temporal-migration.js';
import * as temporalIntelligence from '../../src/analysis/temporal-intelligence.js';
import { temporalMultiplier } from '../../src/workers/temporal-multiplier.js';
import { logger } from '../../src/utils/logger.js';

vi.mock('../../src/analysis/temporal-intelligence.js');
vi.mock('../../src/workers/temporal-multiplier.js', () => ({
  temporalMultiplier: {
    getContext: vi.fn(),
  }
}));
vi.mock('../../src/utils/logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
}));

describe('Temporal Migration', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('should use legacy system in legacy_only mode', () => {
    process.env.TEMPORAL_MIGRATION_MODE = 'legacy_only';
    
    vi.mocked(temporalMultiplier.getContext).mockReturnValue({
      multiplier: 3,
      dayOfWeek: 0,
      hour: 9,
      reason: 'mock legacy'
    });

    const result = getTemporalContext(new Date());

    expect(result.monitoringMultiplier).toBe(3);
    expect((result as any)._legacy_reason).toBe('mock legacy');
    expect(temporalIntelligence.getTemporalContext).not.toHaveBeenCalled();
  });

  it('should use new system in new_only mode', () => {
    process.env.TEMPORAL_MIGRATION_MODE = 'new_only';

    vi.mocked(temporalIntelligence.getTemporalContext).mockReturnValue({
      phase: 'holiday',
      monitoringMultiplier: 5,
    } as any);

    const result = getTemporalContext(new Date());

    expect(result.monitoringMultiplier).toBe(5);
    expect(result.phase).toBe('holiday');
    expect(temporalMultiplier.getContext).not.toHaveBeenCalled();
  });

  it('should run both and log discrepancy in parallel mode', () => {
    process.env.TEMPORAL_MIGRATION_MODE = 'parallel';

    // Legacy says 1.0
    vi.mocked(temporalMultiplier.getContext).mockReturnValue({
      multiplier: 1.0,
      dayOfWeek: 1,
      hour: 12,
      reason: 'baseline'
    });

    // New says 2.0
    vi.mocked(temporalIntelligence.getTemporalContext).mockReturnValue({
      phase: 'prevention',
      monitoringMultiplier: 2.0,
    } as any);

    const result = getTemporalContext(new Date());

    // Should return NEW context (as per prompt implementation)
    expect(result.monitoringMultiplier).toBe(2.0);
    
    // Should verify legacy was called
    expect(temporalMultiplier.getContext).toHaveBeenCalled();

    // Should log warning due to discrepancy (abs(1.0 - 2.0) > 0.1)
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ 
        diff: expect.objectContaining({
          multiplier_delta: 1.0,
          legacy_multiplier: 1.0,
          new_multiplier: 2.0
        }) 
      }),
      'temporal_migration_discrepancy'
    );
  });
});
