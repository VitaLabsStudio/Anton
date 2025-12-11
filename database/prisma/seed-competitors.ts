import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.info('🌱 Seeding competitors...');

  const competitorsPath = path.join(__dirname, '../../backend/src/data/competitors.json');
  
  if (!fs.existsSync(competitorsPath)) {
    console.error(`❌ Competitors data file not found at ${competitorsPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(competitorsPath, 'utf-8'));
  const competitors = data.competitors;

  for (const comp of competitors) {
    // 1. Ensure Category exists
    const categoryName = comp.category;
    
    const category = await prisma.competitorCategory.upsert({
      where: { name: categoryName },
      update: {},
      create: {
        name: categoryName,
        description: `Category for ${categoryName}`,
      },
    });

    // 2. Upsert Competitor
    await prisma.competitor.upsert({
      where: { name: comp.name },
      update: {
        categoryId: category.id,
        primaryMechanism: comp.primaryMechanism,
        pricePoint: comp.pricePoint,
        brandKeywords: comp.brandKeywords,
      },
      create: {
        name: comp.name,
        categoryId: category.id,
        primaryMechanism: comp.primaryMechanism,
        pricePoint: comp.pricePoint,
        brandKeywords: comp.brandKeywords,
      },
    });
    
    console.info(`   - Upserted ${comp.name} (${categoryName})`);
  }
  
  console.info('✅ Competitors seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
