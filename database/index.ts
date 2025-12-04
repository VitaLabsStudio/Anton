/**
 * Database package entry point
 * Exports Prisma client and types
 */

export { PrismaClient } from '@prisma/client';
export type { Prisma } from '@prisma/client';

// Export secure singleton instance
export { prisma } from './prisma/connection-security.js';
