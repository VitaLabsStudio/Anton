import { PrismaClient } from '@prisma/client';
import type { Platform } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.info('🌱 Starting seed...');

  // 1. Seed Reference Tables
  console.info('...seeding reference tables');

  // Archetypes
  const archetypes = [
    { name: 'CHECKLIST', description: 'Provides a structured list of steps' },
    { name: 'MYTHBUST', description: 'Corrects misconceptions with facts' },
    { name: 'COACH', description: 'Encouraging and guiding tone' },
    { name: 'STORYLET', description: 'Uses a short narrative to explain' },
    { name: 'HUMOR_LIGHT', description: 'Uses light humor to engage' },
    { name: 'CREDIBILITY_ANCHOR', description: 'Cites sources and establishes authority' },
    { name: 'CONFIDENT_RECOMMENDER', description: 'Strong, direct recommendations' },
    { name: 'PROBLEM_SOLUTION_DIRECT', description: 'Identifies problem and offers solution' },
  ];

  for (const arch of archetypes) {
    await prisma.archetype.upsert({
      where: { name: arch.name },
      update: {},
      create: arch,
    });
  }

  // PowerTiers
  const powerTiers = [
    { name: 'MICRO', minFollowers: 1000, priorityWeight: 1.2 },
    { name: 'MACRO', minFollowers: 10000, priorityWeight: 1.5 },
    { name: 'MEGA', minFollowers: 100000, priorityWeight: 2.0 },
  ];

  for (const tier of powerTiers) {
    await prisma.powerTier.upsert({
      where: { name: tier.name },
      update: {},
      create: tier,
    });
  }

  // CompetitorCategories
  const compCategories = [
    { name: 'DIRECT', description: 'Direct competitors' },
    { name: 'INDIRECT', description: 'Alternative solutions' },
    { name: 'ASPIRATIONAL', description: 'Higher end market' },
  ];

  for (const cat of compCategories) {
    await prisma.competitorCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // KpiTypes
  const kpiTypes = [
    { name: 'ENGAGEMENT_RATE', aggregationType: 'AVG', unit: 'percentage' },
    { name: 'CLICK_THROUGH', aggregationType: 'SUM', unit: 'count' },
    { name: 'CONVERSION', aggregationType: 'SUM', unit: 'count' },
  ];

  for (const kpi of kpiTypes) {
    await prisma.kpiType.upsert({
      where: { name: kpi.name },
      update: {},
      create: kpi,
    });
  }

  // EscalationReasons
  const escReasons = [
    { name: 'SENSITIVE_TOPIC', severity: 'HIGH' as const },
    { name: 'BRAND_RISK', severity: 'CRITICAL' as const },
    { name: 'COMPLEX_QUERY', severity: 'MEDIUM' as const },
  ];

  for (const reason of escReasons) {
    await prisma.escalationReason.upsert({
      where: { name: reason.name },
      update: {},
      create: reason,
    });
  }

  // ChampionTiers
  const champTiers = [
    { name: 'BRONZE', minEngagement: 5, priorityScore: 1.0 },
    { name: 'SILVER', minEngagement: 20, priorityScore: 1.5 },
    { name: 'GOLD', minEngagement: 50, priorityScore: 2.0 },
  ];

  for (const tier of champTiers) {
    await prisma.championTier.upsert({
      where: { name: tier.name },
      update: {},
      create: tier,
    });
  }

  // 2. Seed Authors
  console.info('...seeding authors');
  const platforms: Platform[] = ['TWITTER', 'REDDIT', 'THREADS'];

  for (const platform of platforms) {
    for (let i = 1; i <= 5; i++) {
      await prisma.author.upsert({
        where: {
          platform_platformId: {
            platform,
            platformId: `user_${platform.toLowerCase()}_${i}`,
          },
        },
        update: {},
        create: {
          platform,
          platformId: `user_${platform.toLowerCase()}_${i}`,
          handle: `user_${platform.toLowerCase()}_${i}`,
          displayName: `User ${i} on ${platform}`,
          followerCount: i * 1000,
          isVerified: i % 2 === 0,
        },
      });
    }
  }

  // Get a reference author
  const author = await prisma.author.findFirst();
  if (!author) throw new Error('No author created');

  // 3. Seed Posts
  console.info('...seeding posts');
  const post = await prisma.post.create({
    data: {
      platform: author.platform,
      platformPostId: `post_${Date.now()}`,
      authorId: author.id,
      content: 'This is a sample post about our product keywords.',
      detectedAt: new Date(),
      keywordMatches: ['product', 'keywords'],
      keywordCategories: ['general'],
    },
  });

  // 4. Seed Decisions & Replies
  console.info('...seeding decisions and replies');

  // Get a reference archetype
  const arch = await prisma.archetype.findFirst();

  const decision = await prisma.decision.create({
    data: {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      platform: post.platform,
      postId: post.id,
      sssScore: 0.8,
      arsScore: 0.5,
      evsScore: 0.6,
      trsScore: 0.9,
      compositeScore: 0.75,
      mode: 'HELPFUL',
      compositeCredibleIntervalLower: 0.7,
      compositeCredibleIntervalUpper: 0.8,
      modeConfidence: 0.9,
      archetypeId: arch?.id,
      safetyFlags: [],
    },
  });

  await prisma.reply.create({
    data: {
      decisionId: decision.id,
      decisionCreatedAt: decision.createdAt,
      content: 'Here is a helpful reply! —Antone (Vita)',
      platform: post.platform,
      replyType: 'AUTO',
      approvalStatus: 'APPROVED',
      postedAt: new Date(),
      archetypeId: arch?.id,
    },
  });

  // 5. Seed Experiments
  console.info('...seeding experiments');
  await prisma.experiment.create({
    data: {
      name: 'Tone Test A/B',
      description: 'Testing polite vs direct tone',
      variantA: { tone: 'polite' },
      variantB: { tone: 'direct' },
      metric: 'ENGAGEMENT_RATE',
      status: 'RUNNING',
      startDate: new Date(),
    },
  });

  console.info('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
