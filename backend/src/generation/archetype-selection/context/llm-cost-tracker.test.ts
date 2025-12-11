/**
 * Tests for LLM Cost Tracking Middleware
 * Story 2.10: Production Readiness - TODO-001
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { LLMCostTracker, type LLMUsageMetrics } from './llm-cost-tracker';

describe('LLMCostTracker', () => {
  let tracker: LLMCostTracker;

  beforeEach(() => {
    tracker = new LLMCostTracker({
      dailyBudgetUSD: 10.0,
      weeklyBudgetUSD: 50.0,
      monthlyBudgetUSD: 150.0,
      warnThresholdPercent: 80,
      criticalThresholdPercent: 95,
    });
  });

  describe('Cost calculation', () => {
    it('should calculate DeepSeek cost correctly', () => {
      const cost = tracker.calculateCost('deepseek', 1000, 500);
      // $0.27 per 1M input tokens, $1.10 per 1M output tokens
      // (1000 * 0.27 / 1M) + (500 * 1.10 / 1M) = 0.00027 + 0.00055 = 0.00082
      expect(cost).toBeCloseTo(0.00082, 6);
    });

    it('should calculate OpenAI cost correctly', () => {
      const cost = tracker.calculateCost('openai', 1000, 500);
      // $3.00 per 1M input tokens, $6.00 per 1M output tokens
      // (1000 * 3.00 / 1M) + (500 * 6.00 / 1M) = 0.003 + 0.003 = 0.006
      expect(cost).toBeCloseTo(0.006, 6);
    });

    it('should calculate cost for large token counts', () => {
      const cost = tracker.calculateCost('deepseek', 100000, 50000);
      // Should handle large numbers correctly
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeCloseTo(0.082, 3);
    });
  });

  describe('Usage tracking', () => {
    it('should track single LLM call', async () => {
      const metrics: LLMUsageMetrics = {
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 0.001,
        timestamp: new Date(),
        requestId: 'req_test_1',
      };

      await tracker.track(metrics);

      const stats = tracker.getStats();
      expect(stats.totalCalls).toBe(1);
      expect(stats.totalTokens).toBe(1500);
      expect(stats.totalCost).toBeCloseTo(0.001, 5);
      expect(stats.dailyCost).toBeCloseTo(0.001, 5);
    });

    it('should track multiple LLM calls', async () => {
      const metrics1: LLMUsageMetrics = {
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 0.001,
        timestamp: new Date(),
        requestId: 'req_test_1',
      };

      const metrics2: LLMUsageMetrics = {
        provider: 'openai',
        inputTokens: 2000,
        outputTokens: 1000,
        totalTokens: 3000,
        estimatedCost: 0.012,
        timestamp: new Date(),
        requestId: 'req_test_2',
      };

      await tracker.track(metrics1);
      await tracker.track(metrics2);

      const stats = tracker.getStats();
      expect(stats.totalCalls).toBe(2);
      expect(stats.totalTokens).toBe(4500);
      expect(stats.totalCost).toBeCloseTo(0.013, 5);
    });

    it('should accumulate costs correctly', async () => {
      const calls = 5;
      for (let i = 0; i < calls; i++) {
        await tracker.track({
          provider: 'deepseek',
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1500,
          estimatedCost: 0.001,
          timestamp: new Date(),
          requestId: `req_test_${i}`,
        });
      }

      const stats = tracker.getStats();
      expect(stats.totalCalls).toBe(calls);
      expect(stats.dailyCost).toBeCloseTo(0.005, 5);
      expect(stats.weeklyCost).toBeCloseTo(0.005, 5);
      expect(stats.monthlyCost).toBeCloseTo(0.005, 5);
    });
  });

  describe('Budget status detection', () => {
    it('should return OK status when under budget', async () => {
      await tracker.track({
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 1.0, // $1 of $10 daily budget = 10%
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      const stats = tracker.getStats();
      expect(stats.budgetStatus).toBe('OK');
      expect(tracker.canMakeLLMCall()).toBe(true);
    });

    it('should return WARN status at 80% threshold', async () => {
      await tracker.track({
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 8.5, // $8.5 of $10 daily budget = 85%
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      const stats = tracker.getStats();
      expect(stats.budgetStatus).toBe('WARN');
      expect(tracker.canMakeLLMCall()).toBe(true);
    });

    it('should return CRITICAL status at 95% threshold', async () => {
      await tracker.track({
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 9.6, // $9.6 of $10 daily budget = 96%
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      const stats = tracker.getStats();
      expect(stats.budgetStatus).toBe('CRITICAL');
      expect(tracker.canMakeLLMCall()).toBe(true); // Still allowed
    });

    it('should return EXCEEDED status at 100% threshold', async () => {
      await tracker.track({
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 10.5, // $10.5 of $10 daily budget = 105%
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      const stats = tracker.getStats();
      expect(stats.budgetStatus).toBe('EXCEEDED');
      expect(tracker.canMakeLLMCall()).toBe(false);
      expect(tracker.isBudgetExceeded()).toBe(true);
    });

    it('should check weekly budget threshold', async () => {
      // Exceed weekly budget but not daily
      await tracker.track({
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 52.0, // $52 of $50 weekly budget = 104%
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      const stats = tracker.getStats();
      expect(stats.budgetStatus).toBe('EXCEEDED');
      expect(tracker.canMakeLLMCall()).toBe(false);
    });

    it('should check monthly budget threshold', async () => {
      // Exceed monthly budget but not daily/weekly
      await tracker.track({
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 155.0, // $155 of $150 monthly budget = 103%
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      const stats = tracker.getStats();
      expect(stats.budgetStatus).toBe('EXCEEDED');
      expect(tracker.canMakeLLMCall()).toBe(false);
    });
  });

  describe('Budget fallback mode', () => {
    it('should block LLM calls when budget exceeded', async () => {
      // Exceed budget
      await tracker.track({
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 11.0,
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      // Should block subsequent calls
      expect(tracker.canMakeLLMCall()).toBe(false);
      expect(tracker.isBudgetExceeded()).toBe(true);
    });

    it('should allow LLM calls when under budget', async () => {
      await tracker.track({
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 5.0,
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      expect(tracker.canMakeLLMCall()).toBe(true);
      expect(tracker.isBudgetExceeded()).toBe(false);
    });
  });

  describe('Reset functionality', () => {
    it('should reset all counters', async () => {
      await tracker.track({
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 5.0,
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      tracker.reset();

      const stats = tracker.getStats();
      expect(stats.totalCalls).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.dailyCost).toBe(0);
      expect(stats.budgetStatus).toBe('OK');
      expect(tracker.isBudgetExceeded()).toBe(false);
    });

    it('should clear budget exceeded flag after reset', async () => {
      // Exceed budget
      await tracker.track({
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 11.0,
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      // Call canMakeLLMCall to trigger budget exceeded flag
      expect(tracker.canMakeLLMCall()).toBe(false);
      expect(tracker.isBudgetExceeded()).toBe(true);

      tracker.reset();

      expect(tracker.isBudgetExceeded()).toBe(false);
      expect(tracker.canMakeLLMCall()).toBe(true);
    });
  });

  describe('Threshold updates', () => {
    it('should update budget thresholds', () => {
      tracker.updateThresholds({
        dailyBudgetUSD: 20.0,
        weeklyBudgetUSD: 100.0,
      });

      // Add a call that would exceed old budget but not new
      tracker.track({
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 15.0,
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      const stats = tracker.getStats();
      // 15 of 20 = 75%, should be OK
      expect(stats.budgetStatus).toBe('OK');
    });

    it('should update warning thresholds', () => {
      tracker.updateThresholds({
        warnThresholdPercent: 50,
        criticalThresholdPercent: 75,
      });

      tracker.track({
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 6.0, // 60% of $10 budget
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      const stats = tracker.getStats();
      // 60% should trigger WARN with 50% threshold
      expect(stats.budgetStatus).toBe('WARN');
    });
  });

  describe('Statistics reporting', () => {
    it('should provide accurate statistics', async () => {
      await tracker.track({
        provider: 'deepseek',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 0.001,
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      await tracker.track({
        provider: 'openai',
        inputTokens: 2000,
        outputTokens: 1000,
        totalTokens: 3000,
        estimatedCost: 0.012,
        timestamp: new Date(),
        requestId: 'req_test_2',
      });

      const stats = tracker.getStats();

      expect(stats.totalCalls).toBe(2);
      expect(stats.totalTokens).toBe(4500);
      expect(stats.totalCost).toBeCloseTo(0.013, 5);
      expect(stats.dailyCost).toBeCloseTo(0.013, 5);
      expect(stats.weeklyCost).toBeCloseTo(0.013, 5);
      expect(stats.monthlyCost).toBeCloseTo(0.013, 5);
      expect(stats.budgetStatus).toBe('OK');
    });

    it('should handle empty stats', () => {
      const stats = tracker.getStats();

      expect(stats.totalCalls).toBe(0);
      expect(stats.totalTokens).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.budgetStatus).toBe('OK');
    });
  });

  describe('Edge cases', () => {
    it('should handle zero cost calls', async () => {
      await tracker.track({
        provider: 'deepseek',
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      const stats = tracker.getStats();
      expect(stats.totalCalls).toBe(1);
      expect(stats.totalCost).toBe(0);
      expect(stats.budgetStatus).toBe('OK');
    });

    it('should handle very small costs', async () => {
      await tracker.track({
        provider: 'deepseek',
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
        estimatedCost: 0.0000082,
        timestamp: new Date(),
        requestId: 'req_test_1',
      });

      const stats = tracker.getStats();
      expect(stats.totalCalls).toBe(1);
      expect(stats.totalCost).toBeGreaterThan(0);
      expect(stats.budgetStatus).toBe('OK');
    });

    it('should handle rapid successive calls', async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          tracker.track({
            provider: 'deepseek',
            inputTokens: 100,
            outputTokens: 50,
            totalTokens: 150,
            estimatedCost: 0.0001,
            timestamp: new Date(),
            requestId: `req_test_${i}`,
          })
        );
      }

      await Promise.all(promises);

      const stats = tracker.getStats();
      expect(stats.totalCalls).toBe(100);
      expect(stats.dailyCost).toBeCloseTo(0.01, 5);
    });
  });
});

