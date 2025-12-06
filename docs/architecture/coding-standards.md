# Coding Standards & Development Guidelines

This document defines comprehensive coding standards for the Antone V2 project, ensuring consistency, maintainability, and quality across the codebase.

## 1. TypeScript Configuration Standards

**Base TypeScript Configuration (`tsconfig.base.json`)**:
```json
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["ES2024"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    
    // Type Checking - STRICT MODE
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Additional Type Checking
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    
    // Emit
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": false,
    "skipLibCheck": true,
    
    // Interop Constraints
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

**Key Requirements**:
- ✅ **Strict Mode**: All strict checks enabled - no exceptions
- ✅ **No `any` Types**: Use `unknown` or proper types
- ✅ **Explicit Return Types**: All functions must declare return types
- ✅ **Null Safety**: Handle `null` and `undefined` explicitly

## 2. ESLint Configuration Standards

**ESLint Configuration (`.eslintrc.js`)**:
```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'prettier',
    'security',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:security/recommended',
    'prettier', // Must be last
  ],
  rules: {
    // TypeScript Specific
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    
    // Import Organization
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
      ],
      'newlines-between': 'always',
      'alphabetize': { order: 'asc', caseInsensitive: true },
    }],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'error',
    
    // General Code Quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    
    // Security
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
  },
};
```

**Linting Commands**:
- `pnpm lint` - Check all files
- `pnpm lint:fix` - Auto-fix issues
- Pre-commit hook: Auto-run lint on staged files

## 3. Prettier Configuration Standards

**Prettier Configuration (`.prettierrc`)**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "quoteProps": "as-needed",
  "proseWrap": "preserve"
}
```

**Formatting Rules**:
- ✅ Single quotes for strings (except JSON)
- ✅ Semicolons required
- ✅ 100 character line length
- ✅ 2 spaces for indentation
- ✅ Trailing commas in ES5 (objects, arrays)
- ✅ Unix line endings (LF)

## 4. File Naming Conventions

**Backend Files**:
- Services: `kebab-case.ts` (e.g., `decision-engine.ts`)
- Classes: `PascalCase.ts` (e.g., `DecisionEngine.ts`)
- Utilities: `kebab-case.ts` (e.g., `rate-limiter.ts`)
- Types: `kebab-case.types.ts` (e.g., `decision.types.ts`)
- Tests: `*.test.ts` or `*.spec.ts` (e.g., `decision-engine.test.ts`)
- Constants: `kebab-case.constants.ts` (e.g., `api-routes.constants.ts`)

**Frontend Files**:
- Components: `PascalCase.tsx` (e.g., `MetricCard.tsx`)
- Pages: `kebab-case/page.tsx` (e.g., `kpis/page.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-websocket.ts`)
- Utils: `kebab-case.ts` (e.g., `format-date.ts`)
- Types: `kebab-case.types.ts`

**Database Files**:
- Migrations: Auto-generated by Prisma
- Seeds: `seed-{description}.ts` (e.g., `seed-initial-data.ts`)

## 5. Code Organization Patterns

**Function Organization**:
```typescript
// 1. Imports (grouped and sorted)
import { z } from 'zod';

import { DecisionMode } from '@/types/decision.types';
import { logger } from '@/utils/logger';

// 2. Type Definitions
interface AnalysisResult {
  score: number;
  mode: DecisionMode;
}

// 3. Constants
const THRESHOLD = 0.7;

// 4. Main Function
export async function analyzePost(postId: string): Promise<AnalysisResult> {
  // Implementation
}

// 5. Helper Functions (if needed)
function calculateScore(data: unknown): number {
  // Implementation
}
```

**Class Organization**:
```typescript
export class DecisionEngine {
  // 1. Private properties
  private readonly threshold: number;
  
  // 2. Constructor
  constructor(threshold: number) {
    this.threshold = threshold;
  }
  
  // 3. Public methods
  public async analyze(postId: string): Promise<AnalysisResult> {
    // Implementation
  }
  
  // 4. Protected methods
  protected validateInput(input: unknown): boolean {
    // Implementation
  }
  
  // 5. Private methods
  private calculateScore(data: unknown): number {
    // Implementation
  }
}
```

## 6. Comment Standards

**JSDoc for Public APIs**:
```typescript
/**
 * Analyzes a post and determines the appropriate engagement mode.
 * 
 * @param postId - The unique identifier of the post to analyze
 * @param options - Optional configuration for the analysis
 * @returns A promise resolving to the analysis result with score and mode
 * @throws {ValidationError} If the post ID is invalid
 * @throws {DatabaseError} If the post cannot be found
 * 
 * @example
 * ```typescript
 * const result = await analyzePost('post123');
 * console.log(result.mode); // 'HELPFUL'
 * ```
 */
export async function analyzePost(
  postId: string,
  options?: AnalysisOptions
): Promise<AnalysisResult> {
  // Implementation
}
```

**Inline Comments**:
- ✅ Explain **WHY**, not **WHAT**
- ✅ Complex algorithms require explanation
- ✅ Security-sensitive code needs justification
- ❌ Avoid obvious comments
- ❌ Don't comment out code (use git)

**TODO Comments**:
```typescript
// TODO(username): Optimize this query - currently O(n^2)
// FIXME: Race condition when multiple workers process same post
// HACK: Temporary workaround for API rate limiting
// NOTE: This threshold was determined through A/B testing
```

## 7. Error Handling Patterns

**Custom Error Classes**:
```typescript
// backend/src/utils/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR', true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 404, 'NOT_FOUND', true);
  }
}
```

**Error Handling in Functions**:
```typescript
export async function processPost(postId: string): Promise<void> {
  try {
    const post = await db.post.findUnique({ where: { id: postId } });
    
    if (!post) {
      throw new NotFoundError('Post', postId);
    }
    
    await analyzePost(post);
  } catch (error) {
    if (error instanceof AppError) {
      // Operational error - log and handle
      logger.error({ error, postId }, 'Failed to process post');
      throw error;
    }
    
    // Programming error - log and convert
    logger.fatal({ error, postId }, 'Unexpected error processing post');
    throw new AppError('An unexpected error occurred', 500, 'INTERNAL_ERROR', false);
  }
}
```

## 8. Testing Standards

**Test Structure (AAA Pattern)**:
```typescript
describe('DecisionEngine', () => {
  describe('analyze()', () => {
    it('should return HELPFUL mode for high-intent posts', async () => {
      // Arrange
      const engine = new DecisionEngine({ threshold: 0.7 });
      const mockPost = createMockPost({ intentScore: 0.9 });
      
      // Act
      const result = await engine.analyze(mockPost.id);
      
      // Assert
      expect(result.mode).toBe('HELPFUL');
      expect(result.score).toBeGreaterThan(0.7);
    });
    
    it('should throw ValidationError for invalid post ID', async () => {
      // Arrange
      const engine = new DecisionEngine({ threshold: 0.7 });
      
      // Act & Assert
      await expect(engine.analyze('')).rejects.toThrow(ValidationError);
    });
  });
});
```

**Test Coverage Requirements**:
- ✅ **Unit Tests**: 80% coverage minimum
- ✅ **Integration Tests**: All API endpoints
- ✅ **Critical Paths**: 100% coverage (decision engine, safety protocols)
- ✅ **Edge Cases**: Always test boundary conditions
- ✅ **Error Cases**: Test all error paths

**Test File Organization**:
```
backend/src/analysis/
├── decision-engine.ts
├── decision-engine.test.ts        # Unit tests
└── __tests__/
    └── decision-engine.integration.test.ts  # Integration tests
```

## 9. Git Workflow & Commit Standards

**Commit Message Format** (Conventional Commits):
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Build process or auxiliary tool changes
- `ci`: CI/CD changes

**Examples**:
```bash
feat(decision-engine): add temporal intelligence for holiday detection

- Add holiday calendar integration
- Adjust decision weights based on time of day
- Add tests for temporal logic

Closes #123
```

**Branch Naming**:
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/description` - New features (e.g., `feature/temporal-intelligence`)
- `fix/description` - Bug fixes (e.g., `fix/race-condition`)
- `refactor/description` - Code improvements
- `docs/description` - Documentation updates

## 10. API Design Standards

**RESTful Endpoint Naming**:
```typescript
// ✅ Good
GET    /api/decisions
GET    /api/decisions/:id
POST   /api/decisions
PATCH  /api/decisions/:id
DELETE /api/decisions/:id

GET    /api/posts/:postId/decisions
POST   /api/replies/:replyId/approve

// ❌ Bad
GET    /api/getDecisions
POST   /api/createDecision
GET    /api/decision_by_id/:id
```

**Request/Response Standards**:
```typescript
// Request Body Schema (using Zod)
const createDecisionSchema = z.object({
  postId: z.string().uuid(),
  mode: z.enum(['HELPFUL', 'ENGAGEMENT', 'HYBRID', 'DISENGAGED']),
  score: z.number().min(0).max(1),
  metadata: z.record(z.unknown()).optional(),
});

// Response Format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

## 11. Security Best Practices

**Input Validation**:
```typescript
// ✅ Always validate at API boundary
import { z } from 'zod';

const userInputSchema = z.object({
  email: z.string().email(),
  content: z.string().max(5000),
  postId: z.string().uuid(),
});

// Validate before processing
const validated = userInputSchema.parse(input);
```

**SQL Injection Prevention**:
```typescript
// ✅ Use Prisma (parameterized queries)
const post = await db.post.findUnique({
  where: { id: postId },
});

// ❌ NEVER use raw SQL with user input
const post = await db.$queryRaw`SELECT * FROM posts WHERE id = ${postId}`;
```

**Secret Management**:
```typescript
// ✅ Use environment variables
const apiKey = process.env.TWITTER_API_KEY;
if (!apiKey) {
  throw new Error('TWITTER_API_KEY is required');
}

// ❌ NEVER hardcode secrets
const apiKey = 'sk-1234567890abcdef'; // WRONG!
```

## 12. Performance Optimization Standards

**Database Query Optimization**:
- Select only needed fields
- Use proper indexing
- Batch operations
- Avoid N+1 queries

**Caching Strategy**:
- Use Redis for expensive calculations
- Cache TTLs appropriate for data freshness

## 13. Documentation Standards

**README.md Requirements**:
- Project overview and purpose
- Prerequisites and setup instructions
- Development workflow
- Testing procedures

**Code Documentation**:
- ✅ All public APIs have JSDoc
- ✅ Complex algorithms explained
- ✅ Architecture decisions documented (ADR format)

## 14. Code Review Checklist

Before submitting a PR, verify:

**Functionality**:
- [ ] Code works as intended
- [ ] All tests pass
- [ ] No console errors or warnings

**Code Quality**:
- [ ] Follows TypeScript strict mode
- [ ] No ESLint warnings or errors
- [ ] Proper error handling

**Documentation**:
- [ ] Public APIs have JSDoc
- [ ] README updated if needed

**Security**:
- [ ] Input validation present
- [ ] No hardcoded secrets
- [ ] SQL injection prevented

**Performance**:
- [ ] No N+1 queries
- [ ] Proper indexing used
