/**
 * Build Verification Script (OPS-002 Mitigation)
 *
 * This script verifies that all expected build artifacts were created.
 * Run automatically via postbuild script or manually with: node scripts/verify-build.js
 */

const fs = require('fs');
const path = require('path');

const requiredOutputs = [
  // Backend build output
  'backend/dist/index.js',
  // Dashboard build output (Next.js)
  'dashboard/.next/BUILD_ID',
  // Shared package build output
  'shared/dist/index.js',
];

const optionalOutputs = [
  // Database build output (may not exist if no TypeScript files)
  'database/dist/index.js',
];

console.log('🔍 Verifying build outputs...\n');

const notFound = [];
const found = [];

// Check required outputs
for (const output of requiredOutputs) {
  const fullPath = path.join(__dirname, '..', output);
  if (fs.existsSync(fullPath)) {
    found.push(output);
    console.log(`✅ Found: ${output}`);
  } else {
    notFound.push(output);
    console.log(`❌ Missing: ${output}`);
  }
}

// Check optional outputs
console.log('\n📋 Optional outputs:');
for (const output of optionalOutputs) {
  const fullPath = path.join(__dirname, '..', output);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ Found: ${output}`);
  } else {
    console.log(`⚪ Not found (optional): ${output}`);
  }
}

console.log('\n' + '='.repeat(50));

if (notFound.length > 0) {
  console.error(`\n❌ Build verification failed!`);
  console.error(`Missing ${notFound.length} required output(s):`);
  notFound.forEach((f) => console.error(`   - ${f}`));
  console.error('\n💡 Try running: pnpm build');
  process.exit(1);
}

console.log(`\n✅ Build verification passed!`);
console.log(`   All ${found.length} required outputs found.`);
process.exit(0);
