/**
 * Workspace Verification Script (TECH-001 Mitigation)
 *
 * This script verifies that cross-package imports resolve correctly
 * in the pnpm monorepo. Run with: pnpm verify:workspace
 */

// Test importing from the shared package using workspace protocol
import { APP_NAME, APP_VERSION, PLATFORMS } from '@antone/shared';
import type { ApiResponse, HealthCheckResponse, Platform } from '@antone/shared';

// Test importing constants
console.info('🔍 Verifying workspace resolution...\n');

console.info('✅ Successfully imported APP_NAME:', APP_NAME);
console.info('✅ Successfully imported APP_VERSION:', APP_VERSION);
console.info('✅ Successfully imported PLATFORMS:', PLATFORMS);

// Test using types
const testPlatform: Platform = 'twitter';
console.info('✅ Successfully typed Platform:', testPlatform);

const testHealthCheck: HealthCheckResponse = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  version: APP_VERSION,
};
console.info('✅ Successfully typed HealthCheckResponse:', testHealthCheck);

const testApiResponse: ApiResponse<string> = {
  success: true,
  data: 'test',
};
console.info('✅ Successfully typed ApiResponse:', testApiResponse);

console.info('\n🎉 Workspace resolution is working correctly!');
console.info('   All @antone/shared imports resolved successfully.');
