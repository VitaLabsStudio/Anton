import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.info('🔌 Testing database connection...');
  try {
    await prisma.$connect();
    console.info('✅ Connected to database successfully');

    // CRUD Test
    console.info('📝 Testing CRUD...');
    const count = await prisma.author.count();
    console.info(`📊 Found ${count} authors`);

    const newAuthor = await prisma.author.create({
      data: {
        platform: 'TWITTER',
        platformId: `test_conn_${Date.now()}`,
        handle: `test_conn_${Date.now()}`,
      },
    });
    console.info('✅ Created author:', newAuthor.id);

    await prisma.author.delete({ where: { id: newAuthor.id } });
    console.info('✅ Deleted author');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
