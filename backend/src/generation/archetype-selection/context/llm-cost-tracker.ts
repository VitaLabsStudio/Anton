/**
 * LLM Cost Tracking Middleware
 * Story 2.10: Production Readiness - TODO-001
 *
 * Responsibilities:
 * - Track LLM API usage (calls, tokens, estimated costs)
 * - Monitor budget thresholds with alerts
 * - Provide fallback to ML-only mode when budget exceeded
 * - Emit cost metrics for observability
 */

import { logger } from '@/utils/logger';

export interface LLMUsageMetrics {
  provider: 'deepseek' | 'openai';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  timestamp: Date;
  requestId: string;
}

export interface BudgetThresholds {
  dailyBudgetUSD: number;
  weeklyBudgetUSD: number;
  monthlyBudgetUSD: number;
  warnThresholdPercent: number; // Default 80%
  criticalThresholdPercent: number; // Default 95%
}

export interface CostStats {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  dailyCost: number;
  weeklyCost: number;
  monthlyCost: number;
  budgetStatus: 'OK' | 'WARN' | 'CRITICAL' | 'EXCEEDED';
}

interface CostPerToken {
  deepseek: { input: number; output: number };
  openai: { input: number; output: number };
}

// Cost per 1M tokens (as of Dec 2024)
const COST_PER_TOKEN: CostPerToken = {
  deepseek: {
    input: 0.27 / 1_000_000, // $0.27 per 1M input tokens
    output: 1.1 / 1_000_000, // $1.10 per 1M output tokens
  },
  openai: {
    input: 3.0 / 1_000_000, // $3.00 per 1M input tokens (GPT-4)
    output: 6.0 / 1_000_000, // $6.00 per 1M output tokens
  },
};

const DEFAULT_THRESHOLDS: BudgetThresholds = {
  dailyBudgetUSD: 10.0,
  weeklyBudgetUSD: 50.0,
  monthlyBudgetUSD: 150.0,
  warnThresholdPercent: 80,
  criticalThresholdPercent: 95,
};

/**
 * In-memory storage for cost tracking
 * In production, this should be backed by Redis or analytics DB
 */
interface CostRecord {
  calls: LLMUsageMetrics[];
  dailyTotal: number;
  weeklyTotal: number;
  monthlyTotal: number;
  lastDayReset: Date;
  lastWeekReset: Date;
  lastMonthReset: Date;
}

export class LLMCostTracker {
  private thresholds: BudgetThresholds;
  private costRecord: CostRecord;
  private budgetExceeded = false;

  constructor(thresholds: Partial<BudgetThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.costRecord = {
      calls: [],
      dailyTotal: 0,
      weeklyTotal: 0,
      monthlyTotal: 0,
      lastDayReset: new Date(),
      lastWeekReset: new Date(),
      lastMonthReset: new Date(),
    };
    logger.info({ thresholds: this.thresholds }, 'LLMCostTracker initialized');
  }

  /**
   * Track an LLM API call
   */
  public async track(metrics: LLMUsageMetrics): Promise<void> {
    // Reset counters if needed
    this.resetIfNeeded();

    // Store the call
    this.costRecord.calls.push(metrics);

    // Update cumulative costs
    this.costRecord.dailyTotal += metrics.estimatedCost;
    this.costRecord.weeklyTotal += metrics.estimatedCost;
    this.costRecord.monthlyTotal += metrics.estimatedCost;

    // Check budget status
    const budgetStatus = this.checkBudgetStatus();

    // Log the tracking event
    logger.info(
      {
        requestId: metrics.requestId,
        provider: metrics.provider,
        tokens: metrics.totalTokens,
        cost: metrics.estimatedCost,
        dailyTotal: this.costRecord.dailyTotal,
        budgetStatus,
      },
      'LLM usage tracked'
    );

    // Emit budget alerts if needed
    this.emitBudgetAlerts(budgetStatus);

    // TODO: Flush to analytics DB periodically
  }

  /**
   * Check if budget allows LLM call
   */
  public canMakeLLMCall(): boolean {
    this.resetIfNeeded();
    const budgetStatus = this.checkBudgetStatus();

    if (budgetStatus === 'EXCEEDED') {
      logger.warn(
        {
          dailyCost: this.costRecord.dailyTotal,
          dailyBudget: this.thresholds.dailyBudgetUSD,
        },
        'Budget exceeded - LLM calls blocked'
      );
      this.budgetExceeded = true;
      return false;
    }

    return true;
  }

  /**
   * Get current cost statistics
   */
  public getStats(): CostStats {
    this.resetIfNeeded();

    return {
      totalCalls: this.costRecord.calls.length,
      totalTokens: this.costRecord.calls.reduce((sum, call) => sum + call.totalTokens, 0),
      totalCost: this.costRecord.calls.reduce((sum, call) => sum + call.estimatedCost, 0),
      dailyCost: this.costRecord.dailyTotal,
      weeklyCost: this.costRecord.weeklyTotal,
      monthlyCost: this.costRecord.monthlyTotal,
      budgetStatus: this.checkBudgetStatus(),
    };
  }

  /**
   * Calculate estimated cost for a call
   */
  public calculateCost(
    provider: 'deepseek' | 'openai',
    inputTokens: number,
    outputTokens: number
  ): number {
    const costs = COST_PER_TOKEN[provider];
    return inputTokens * costs.input + outputTokens * costs.output;
  }

  /**
   * Check budget status against thresholds
   */
  private checkBudgetStatus(): 'OK' | 'WARN' | 'CRITICAL' | 'EXCEEDED' {
    const dailyPercent = (this.costRecord.dailyTotal / this.thresholds.dailyBudgetUSD) * 100;
    const weeklyPercent = (this.costRecord.weeklyTotal / this.thresholds.weeklyBudgetUSD) * 100;
    const monthlyPercent =
      (this.costRecord.monthlyTotal / this.thresholds.monthlyBudgetUSD) * 100;

    // Check any budget period
    const maxPercent = Math.max(dailyPercent, weeklyPercent, monthlyPercent);

    if (maxPercent >= 100) {
      return 'EXCEEDED';
    }
    if (maxPercent >= this.thresholds.criticalThresholdPercent) {
      return 'CRITICAL';
    }
    if (maxPercent >= this.thresholds.warnThresholdPercent) {
      return 'WARN';
    }
    return 'OK';
  }

  /**
   * Emit budget alert events
   */
  private emitBudgetAlerts(status: 'OK' | 'WARN' | 'CRITICAL' | 'EXCEEDED'): void {
    if (status === 'OK') {
      return;
    }

    const stats = this.getStats();
    const severity = status === 'EXCEEDED' ? 'error' : status === 'CRITICAL' ? 'error' : 'warn';

    logger[severity](
      {
        budgetStatus: status,
        dailyCost: stats.dailyCost,
        dailyBudget: this.thresholds.dailyBudgetUSD,
        weeklyCost: stats.weeklyCost,
        weeklyBudget: this.thresholds.weeklyBudgetUSD,
        monthlyCost: stats.monthlyCost,
        monthlyBudget: this.thresholds.monthlyBudgetUSD,
        totalCalls: stats.totalCalls,
      },
      `Budget alert: ${status}`
    );

    // TODO: Emit metrics to monitoring system
    // TODO: Send alerts via webhook/email if CRITICAL or EXCEEDED
  }

  /**
   * Reset counters if time period has elapsed
   */
  private resetIfNeeded(): void {
    const now = new Date();

    // Reset daily counter
    if (this.shouldResetDaily(now)) {
      logger.info(
        { previousTotal: this.costRecord.dailyTotal },
        'Resetting daily cost counter'
      );
      this.costRecord.dailyTotal = 0;
      this.costRecord.lastDayReset = now;
    }

    // Reset weekly counter
    if (this.shouldResetWeekly(now)) {
      logger.info(
        { previousTotal: this.costRecord.weeklyTotal },
        'Resetting weekly cost counter'
      );
      this.costRecord.weeklyTotal = 0;
      this.costRecord.lastWeekReset = now;
    }

    // Reset monthly counter
    if (this.shouldResetMonthly(now)) {
      logger.info(
        { previousTotal: this.costRecord.monthlyTotal },
        'Resetting monthly cost counter'
      );
      this.costRecord.monthlyTotal = 0;
      this.costRecord.lastMonthReset = now;
    }

    // Clear budget exceeded flag if all periods reset
    if (this.budgetExceeded && this.checkBudgetStatus() !== 'EXCEEDED') {
      logger.info('Budget reset - LLM calls re-enabled');
      this.budgetExceeded = false;
    }
  }

  /**
   * Check if daily counter should reset
   */
  private shouldResetDaily(now: Date): boolean {
    const lastReset = this.costRecord.lastDayReset;
    return (
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    );
  }

  /**
   * Check if weekly counter should reset
   */
  private shouldResetWeekly(now: Date): boolean {
    const lastReset = this.costRecord.lastWeekReset;
    const daysDiff = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 7;
  }

  /**
   * Check if monthly counter should reset
   */
  private shouldResetMonthly(now: Date): boolean {
    const lastReset = this.costRecord.lastMonthReset;
    return (
      now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()
    );
  }

  /**
   * Clear all tracked data
   */
  public reset(): void {
    this.costRecord = {
      calls: [],
      dailyTotal: 0,
      weeklyTotal: 0,
      monthlyTotal: 0,
      lastDayReset: new Date(),
      lastWeekReset: new Date(),
      lastMonthReset: new Date(),
    };
    this.budgetExceeded = false;
    logger.info('LLMCostTracker reset');
  }

  /**
   * Get budget exceeded status
   */
  public isBudgetExceeded(): boolean {
    this.resetIfNeeded();
    return this.budgetExceeded;
  }

  /**
   * Update budget thresholds
   */
  public updateThresholds(newThresholds: Partial<BudgetThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info({ thresholds: this.thresholds }, 'Budget thresholds updated');
  }
}

/**
 * Singleton instance for convenience
 */
export const llmCostTracker = new LLMCostTracker();




