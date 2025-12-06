import { analyzeLinguisticIntent, type SignalResult } from '../../analysis/signal-1-linguistic.js';
import {
  analyzeSemanticTopic,
  type SemanticTopicSignalResult,
} from '../../analysis/signal-4-semantic.js';
import { logger } from '../../utils/logger.js';

export interface SignalAnalysisResult {
  linguistic: SignalResult;
  semantic: SemanticTopicSignalResult;
  durationMs: number;
}

export const MAX_SIGNAL_LATENCY_MS = 2000;

export async function analyzePostSignals(content: string): Promise<SignalAnalysisResult> {
  const start = Date.now();

  const [linguistic, semantic] = await Promise.all([
    analyzeLinguisticIntent(content),
    analyzeSemanticTopic(content),
  ]);

  const durationMs = Date.now() - start;

  if (durationMs > MAX_SIGNAL_LATENCY_MS) {
    logger.warn(
      { durationMs, snippet: content.slice(0, 120) },
      'Signal analysis exceeded latency budget'
    );
  }

  return {
    linguistic,
    semantic,
    durationMs,
  };
}
