import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/utils/prisma.js', () => ({
  prisma: {
    segmentedWeight: { findUnique: vi.fn(async () => null) },
    decision: { create: vi.fn(async () => null) },
    post: { update: vi.fn(async () => null) },
    archetype: { findUnique: vi.fn(async () => null) },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<void>) => cb({})),
  },
}));

class FakeBreaker<T> {
  public action: () => Promise<T>;
  public state: string | undefined = 'closed';
  private readonly listeners = new Map<string, Array<() => void>>();

  constructor(action: () => Promise<T>) {
    this.action = action;
  }

  on(event: string, handler: () => void) {
    const handlers = this.listeners.get(event) ?? [];
    handlers.push(handler);
    this.listeners.set(event, handlers);
  }

  async fire(): Promise<T> {
    try {
      const result = await this.action();
      this.state = 'closed';
      this.emit('close');
      return result;
    } catch (error) {
      this.state = 'open';
      this.emit('open');
      this.emit('fallback');
      throw error;
    }
  }

  private emit(event: string) {
    for (const handler of this.listeners.get(event) ?? []) {
      handler();
    }
  }

  forceClose() {
    this.state = 'closed';
    this.emit('close');
  }
}

vi.doMock('opossum', () => ({
  default: FakeBreaker,
}));

function createMetricsSpy() {
  const counts = new Map<string, number>();
  return {
    counts,
    increment(name: string) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    },
  };
}

describe('DecisionEngine circuit breakers', () => {
  it('emits metrics on breaker open/close and serves fallbacks', async () => {
    vi.resetModules();
    const { DecisionEngine, DEFAULT_THRESHOLDS } = await import('../../../src/analysis/decision-engine.js');
    const metrics = createMetricsSpy();
    const engine = new DecisionEngine({
      thresholds: DEFAULT_THRESHOLDS,
      prismaClient: {} as any,
      metrics,
    });

    const result = await (engine as any).fetchSignalWithBreaker(
      'BreakerTestFail',
      async () => {
        throw new Error('boom');
      },
      'fallback'
    );

    expect(result).toBe('fallback');

    const recovered = await (engine as any).fetchSignalWithBreaker(
      'BreakerTestOk',
      async () => 'recovered',
      'fallback'
    );

    const successBreaker = (engine as any).breakers.get('BreakerTestOk') as FakeBreaker<string>;
    successBreaker.forceClose();

    expect(recovered).toBe('recovered');
    expect(metrics.counts.get('breaker_state_open')).toBeGreaterThanOrEqual(1);
    expect(metrics.counts.get('breaker_state_close')).toBeGreaterThanOrEqual(1);
    expect(metrics.counts.get('signal.failure')).toBeGreaterThanOrEqual(1);
  });
});
