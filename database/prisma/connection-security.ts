import { PrismaClient } from '@prisma/client';

// SECURITY: Validate DATABASE_URL format
function validateDatabaseUrl(url: string): void {
  // Never allow localhost or 127.0.0.1 in production
  if (process.env['NODE_ENV'] === 'production') {
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      throw new Error('SECURITY: Cannot use localhost database in production');
    }

    // Ensure SSL mode for production
    if (!url.includes('sslmode=require')) {
      console.warn('WARNING: DATABASE_URL should include sslmode=require for production');
    }
  }

  // Never log the actual URL
  try {
    const urlObj = new URL(url.replace('postgresql://', 'http://'));
    console.info(`Database connection: ${urlObj.hostname}:${urlObj.port}${urlObj.pathname}`);
  } catch {
    console.info('Database connection: [Redacted/Invalid URL format]');
  }
}

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

validateDatabaseUrl(databaseUrl);

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'], // Never log queries in production (may contain sensitive data)
});

// SECURITY: Graceful shutdown
const cleanup = async (): Promise<void> => {
  await prisma.$disconnect();
};

process.on('beforeExit', cleanup);
// Handle other signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
