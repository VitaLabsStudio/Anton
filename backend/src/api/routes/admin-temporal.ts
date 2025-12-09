import fs from 'node:fs';
import path from 'node:path';

import { Hono } from 'hono';

import {
  TemporalRuleSchema,
  TemporalRulesConfigSchema,
  type TemporalRule,
  type TemporalRulesConfig,
} from '../../config/temporal-schema.js';
import { reloadTemporalConfig } from '../../analysis/temporal-intelligence.js';
import { logger } from '../../utils/logger.js';
import { prisma } from '../../utils/prisma.js';
import type { Context, Next } from 'hono';

const rulesPath = process.env.TEMPORAL_RULES_PATH
  ? path.resolve(process.cwd(), process.env.TEMPORAL_RULES_PATH)
  : path.resolve(process.cwd(), 'backend/src/config/temporal-rules.json');

const adminTemporalRouter = new Hono();

// Simple in-memory rate limiter
const rateLimit = (limit: number, windowMs: number) => {
  const ipRequests = new Map<string, number[]>();
  
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    let timestamps = ipRequests.get(ip) || [];
    timestamps = timestamps.filter(t => now - t < windowMs);
    
    if (timestamps.length >= limit) {
      return c.json({ error: 'Too many admin requests, please try again later' }, 429);
    }
    
    timestamps.push(now);
    ipRequests.set(ip, timestamps);
    
    await next();
  };
};

adminTemporalRouter.use('*', rateLimit(10, 60_000));

const sanitizeRuleId = (id: string): string => {
  // Only allow alphanumeric + underscore + hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error('Invalid rule ID: Only alphanumeric, underscore, and hyphen allowed');
  }
  if (id.length > 100) {
    throw new Error('Rule ID too long: Max 100 characters');
  }
  return id;
};

const loadConfig = (): TemporalRulesConfig => {
  const raw = fs.readFileSync(rulesPath, 'utf-8');
  return TemporalRulesConfigSchema.parse(JSON.parse(raw));
};

const saveConfig = (config: TemporalRulesConfig): void => {
  const serialized = JSON.stringify(config, null, 2);
  fs.writeFileSync(rulesPath, serialized, 'utf-8');
};

const recordHistory = async (
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  configId: string,
  configBefore: TemporalRule | null,
  configAfter: TemporalRule | null,
  changedBy?: string,
  reason?: string
): Promise<void> => {
  try {
    await prisma.temporalConfigHistory.create({
      data: {
        configType: 'rule',
        action,
        configId,
        configBefore: configBefore ?? undefined,
        configAfter: configAfter ?? undefined,
        changedBy,
        reason,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to record temporal config history');
  }
};

adminTemporalRouter.get('/rules', (c) => {
  try {
    const config = loadConfig();
    return c.json(config);
  } catch (error) {
    logger.error({ error }, 'Failed to load temporal rules');
    return c.json({ error: 'Failed to load temporal rules' }, 500);
  }
});

adminTemporalRouter.post('/rules', async (c) => {
  try {
    const body = await c.req.json();
    const rule = TemporalRuleSchema.parse(body);
    rule.id = sanitizeRuleId(rule.id);
    const config = loadConfig();
    if (config.rules.find((r) => r.id === rule.id)) {
      return c.json({ error: 'Rule with this id already exists' }, 400);
    }
    config.rules.push(rule);
    saveConfig(config);
    await recordHistory('CREATE', rule.id, null, rule, c.req.header('x-user'));
    reloadTemporalConfig();
    return c.json({ success: true, rule });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    return c.json({ error: message }, 400);
  }
});

adminTemporalRouter.patch('/rules/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    
    // Validate ID from param first (security check)
    sanitizeRuleId(id);
    
    const config = loadConfig();
    const existing = config.rules.find((r) => r.id === id);
    if (!existing) {
      return c.json({ error: 'Rule not found' }, 404);
    }

    const updated = TemporalRuleSchema.parse({ ...existing, ...body, id });
    // Sanitize again just in case body tried to sneak in bad chars (though schema valid check implies structure)
    // But ID is usually immutable in REST PATCH if taken from URL. 
    // We enforce ID matches URL or is unmodified.
    if (updated.id !== id) {
         // If attempting to change ID, sanitize new ID
         updated.id = sanitizeRuleId(updated.id);
    }
    
    config.rules = config.rules.map((r) => (r.id === id ? updated : r));
    saveConfig(config);
    await recordHistory('UPDATE', id, existing, updated, c.req.header('x-user'));
    reloadTemporalConfig();
    return c.json({ success: true, rule: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    return c.json({ error: message }, 400);
  }
});

adminTemporalRouter.delete('/rules/:id', (c) => {
  const id = c.req.param('id');
  try {
    const config = loadConfig();
    const before = config.rules.length;
    config.rules = config.rules.filter((r) => r.id !== id);
    if (config.rules.length === before) {
      return c.json({ error: 'Rule not found' }, 404);
    }
    saveConfig(config);
    void recordHistory('DELETE', id, null, null, c.req.header('x-user'));
    reloadTemporalConfig();
    return c.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Failed to delete rule');
    return c.json({ error: 'Failed to delete rule' }, 500);
  }
});

adminTemporalRouter.post('/rules/reload', (c) => {
  try {
    const result = reloadTemporalConfig();
    return c.json({ success: true, loadedRules: result.rules.length, loadedHolidays: result.holidays.length });
  } catch (error) {
    logger.error({ error }, 'Failed to reload temporal config');
    return c.json({ error: 'Failed to reload temporal config' }, 500);
  }
});

export { adminTemporalRouter };
