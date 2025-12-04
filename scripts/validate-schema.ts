import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../database/prisma/schema.prisma');

console.info(`🔍 Validating schema at: ${schemaPath}`);

if (!fs.existsSync(schemaPath)) {
  console.error('❌ Schema file not found!');
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf-8');

const errors: string[] = [];

// Rule 1: All models must have @map directive for table names
const modelRegex = /model\s+(\w+)\s+\{([^}]*)\}/g;
let match;

while ((match = modelRegex.exec(schema)) !== null) {
  const modelName = match[1];
  const modelContent = match[2];

  if (!modelContent.includes('@@map(')) {
    errors.push(`Model ${modelName} missing @@map directive for table name`);
  }
}

// Rule 2: All relations must have onDelete behavior specified
const lines = schema.split('\n');
lines.forEach((line, index) => {
  if (line.includes('@relation') && !line.includes('//') && !line.includes('onDelete:')) {
    errors.push(`Line ${index + 1}: Relation found without onDelete behavior specified`);
  }
});

// Rule 3: DateTime fields should use @default(now()) or explicit default or be updatedBy
const dateTimeRegex = /(\w+)\s+DateTime(?!\?)(?!.*@updatedAt)(?!.*@default)/g;
while ((match = dateTimeRegex.exec(schema)) !== null) {
  const fieldName = match[1];
  errors.push(
    `DateTime field '${fieldName}' appears to be missing @default directive (and is not @updatedAt)`
  );
}

// Rule 4: Critical indexes must exist
const requiredIndexDefinitions = [
  '@@unique([platform, platformId])',
  '@@unique([platform, platformPostId])',
  '@@index([createdAt])',
  '@@index([postedAt])',
];

requiredIndexDefinitions.forEach((def) => {
  if (!schema.includes(def)) {
    // Try to be flexible with spacing
    const normalizedDef = def.replace(/\s/g, '');
    const normalizedSchema = schema.replace(/\s/g, '');
    if (!normalizedSchema.includes(normalizedDef)) {
      errors.push(`Required index/constraint missing: ${def}`);
    }
  }
});

if (errors.length > 0) {
  console.error('❌ Schema validation failed:');
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
}

console.info('✅ Schema validation passed');
