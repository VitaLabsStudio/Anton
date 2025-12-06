import { temporalMultiplier } from '../workers/temporal-multiplier.js';

export interface TemporalSignal {
  context: Awaited<ReturnType<typeof temporalMultiplier.getContext>>;
  timestamp: Date;
}

export class TemporalIntelligence {
  async getTemporalContext(date?: Date): Promise<TemporalSignal> {
    const now = date ?? new Date();
    const context = temporalMultiplier.getContext(now);
    return { context, timestamp: now };
  }
}

const intelligence = new TemporalIntelligence();

export const getTemporalContext = (date?: Date): Promise<TemporalSignal> =>
  intelligence.getTemporalContext(date);
