import { z } from 'zod';

// -- Temporal Strategy --

export const TemporalPhaseSchema = z.enum([
  'peak_suffering',
  'prevention',
  'holiday',
  'normal',
]);

export type TemporalPhase = z.infer<typeof TemporalPhaseSchema>;

export const TemporalStrategySchema = z.object({
  phase: TemporalPhaseSchema.optional(),
  monitoringMultiplier: z.number().min(0).optional(),
  archetypePreferences: z.array(z.string()).optional(),
  archetypeWeights: z.array(z.number()).optional(),
  toneAdjustment: z.string().optional(),
  sssThresholdAdjustment: z.number().optional(),
  isPriority: z.boolean().optional(),
  keywordTargets: z.array(z.string()).optional(),
  experimentId: z.string().optional(),
  variant: z.string().optional(),
});

export type TemporalStrategy = z.infer<typeof TemporalStrategySchema>;

export const TemporalContextSchema = TemporalStrategySchema.extend({
  matchedRules: z.array(z.string()).default([]),
  evaluatedAt: z.string().optional(),
  timezone: z.string().optional(),
  localTime: z.string().optional(),
  cacheHit: z.boolean().optional(),
  mlFeatures: z
    .object({
      hour_sin: z.number(),
      hour_cos: z.number(),
      day_sin: z.number(),
      day_cos: z.number(),
      phase_peak: z.number(),
      phase_prevention: z.number(),
      phase_holiday: z.number(),
      phase_normal: z.number(),
      monitoring_multiplier: z.number(),
      sss_threshold_adjustment: z.number(),
      is_holiday: z.number(),
      is_priority: z.number(),
      is_weekend: z.number(),
    })
    .optional(),
});

export type TemporalContext = z.infer<typeof TemporalContextSchema>;

// -- Rule Conditions --

export const TimeRangeConditionSchema = z.object({
  type: z.literal('time_range'),
  day: z.number().min(0).max(6), // 0 = Sunday, 6 = Saturday
  hourStart: z.number().min(0).max(23),
  hourEnd: z.number().min(0).max(24), // Allow 24 for end of day
});

export const HolidayConditionSchema = z.object({
  type: z.literal('holiday'),
  holidayId: z.string(),
});

export const PreHolidayConditionSchema = z.object({
  type: z.literal('pre_holiday'),
  days: z.number().min(1),
});

export const PostHolidayConditionSchema = z.object({
  type: z.literal('post_holiday'),
  days: z.number().min(1),
});

export const RuleConditionSchema = z.discriminatedUnion('type', [
  TimeRangeConditionSchema,
  HolidayConditionSchema,
  PreHolidayConditionSchema,
  PostHolidayConditionSchema,
]);

export type RuleCondition = z.infer<typeof RuleConditionSchema>;

// -- Temporal Rules --

export const TemporalRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  priority: z.number().int(),
  enabled: z.boolean(),
  condition: RuleConditionSchema,
  strategy: TemporalStrategySchema,
  metadata: z.record(z.unknown()).optional(),
});

export type TemporalRule = z.infer<typeof TemporalRuleSchema>;

export const TemporalRulesConfigSchema = z.object({
  version: z.string(),
  rules: z.array(TemporalRuleSchema),
});

export type TemporalRulesConfig = z.infer<typeof TemporalRulesConfigSchema>;

// -- Holiday Configuration --

export const HolidayConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  recurrence: z.string(), // RRULE string
  category: z.string().optional(),
  region: z.union([z.string(), z.array(z.string())]).optional(),
  monitoringBoost: z.number().min(0).optional(),
  prePreventionDays: z.number().min(0).optional(),
  postRecoveryDays: z.number().min(0).optional(),
});

export type HolidayConfig = z.infer<typeof HolidayConfigSchema>;

export const TemporalHolidaysConfigSchema = z.object({
  version: z.string(),
  holidays: z.array(HolidayConfigSchema),
});

export type TemporalHolidaysConfig = z.infer<typeof TemporalHolidaysConfigSchema>;

// -- A/B Experiments --

export const TemporalExperimentSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['draft', 'running', 'completed']),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    ruleOverrides: z.record(z.unknown()), // Partial<TemporalStrategy>
  })),
  trafficAllocation: z.number().min(0).max(1),
  startDate: z.string(),
  endDate: z.string().optional(),
});

export type TemporalExperiment = z.infer<typeof TemporalExperimentSchema>;

