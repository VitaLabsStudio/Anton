import { z } from 'zod';
import { Hono } from 'hono';

import { buildFollowUpPlan, POWER_TIERS } from '../../analysis/tiered-user-detector.js';
import { logger } from '../../utils/logger.js';
import { prisma } from '../../utils/prisma.js';

const tierEnum = z.enum([
  'MEGA_POWER',
  'MACRO_POWER',
  'MICRO_POWER',
  'ENGAGED_REGULAR',
  'STANDARD',
  'SMALL',
  'NEW_UNKNOWN',
]);

const markPowerSchema = z
  .object({
    tier: tierEnum.optional(),
    notes: z.string().optional(),
    createdBy: z.string().optional(),
  })
  .optional();

const setTierSchema = z.object({
  tier: tierEnum,
  notes: z.string().optional(),
  createdBy: z.string().optional(),
});

export const authorsRouter = new Hono();

authorsRouter.post('/:id/mark-power-user', async (c) => {
  const { id } = c.req.param();
  const requestId = c.get('requestId') as string | undefined;
  const body = await c.req.json().catch(() => ({}));
  const parsed = markPowerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.format() }, 400);
  }

  const tier = parsed.data?.tier ?? 'MICRO_POWER';
  const notes = parsed.data?.notes;
  const createdBy = parsed.data?.createdBy ?? c.req.header('x-user-id') ?? null;

  const author = await prisma.author.findUnique({ where: { id } });
  if (!author) {
    return c.json({ error: 'Author not found' }, 404);
  }

  const now = new Date();
  const followUps = buildFollowUpPlan(tier);

  await prisma.$transaction(async (tx) => {
    await tx.author.update({
      where: { id },
      data: {
        isPowerUser: true,
        userTier: tier,
        lastTierUpdate: now,
      },
    });

    await tx.tierChange.create({
      data: {
        authorId: id,
        previousTier: author.userTier,
        newTier: tier,
        trigger: 'manual_override',
        growthRate: null,
        engagementRate: null,
        followerCount: author.followerCount,
        notes,
        createdBy,
        metadata: {
          manualOverride: true,
          reason: 'mark_power_user',
          requestId,
        },
      },
    });

    if (followUps.length > 0) {
      await tx.pendingAction.createMany({
        data: followUps.map((plan) => ({
          authorId: id,
          actionType: plan.actionType,
          targetCount: plan.targetCount,
          completed: 0,
          userTier: tier,
          triggerPost: plan.triggerPost ?? null,
          createdAt: now,
          expiresAt: plan.expiresAt,
        })),
      });
    }
  });

  logger.info({ authorId: id, tier, requestId }, 'Author marked as power user');

  return c.json({
    authorId: id,
    userTier: tier,
    isPowerUser: true,
    followUpsScheduled: followUps.length,
  });
});

authorsRouter.post('/:id/set-tier', async (c) => {
  const { id } = c.req.param();
  const requestId = c.get('requestId') as string | undefined;
  const body = await c.req.json().catch(() => ({}));
  const parsed = setTierSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.format() }, 400);
  }

  const { tier, notes, createdBy } = parsed.data;
  const author = await prisma.author.findUnique({ where: { id } });
  if (!author) {
    return c.json({ error: 'Author not found' }, 404);
  }

  const now = new Date();
  const isPowerUser = POWER_TIERS.has(tier);
  const followUps = buildFollowUpPlan(tier);

  await prisma.$transaction(async (tx) => {
    await tx.author.update({
      where: { id },
      data: {
        isPowerUser,
        userTier: tier,
        lastTierUpdate: now,
      },
    });

    await tx.tierChange.create({
      data: {
        authorId: id,
        previousTier: author.userTier,
        newTier: tier,
        trigger: 'manual_override',
        growthRate: null,
        engagementRate: null,
        followerCount: author.followerCount,
        notes,
        createdBy: createdBy ?? c.req.header('x-user-id') ?? null,
        metadata: {
          manualOverride: true,
          reason: 'set_tier',
          requestId,
        },
      },
    });

    if (followUps.length > 0) {
      await tx.pendingAction.createMany({
        data: followUps.map((plan) => ({
          authorId: id,
          actionType: plan.actionType,
          targetCount: plan.targetCount,
          completed: 0,
          userTier: tier,
          triggerPost: plan.triggerPost ?? null,
          createdAt: now,
          expiresAt: plan.expiresAt,
        })),
      });
    }
  });

  logger.info({ authorId: id, tier, isPowerUser, requestId }, 'Author tier updated');

  return c.json({
    authorId: id,
    userTier: tier,
    isPowerUser,
    followUpsScheduled: followUps.length,
  });
});
