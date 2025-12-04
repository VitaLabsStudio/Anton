# 3. Repository Structure

## 3.1 Monorepo Layout

```
antone/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI pipeline
│       └── deploy.yml                # Deployment workflow
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Application entry point
│   │   ├── server.ts                 # Hono server setup
│   │   ├── config/
│   │   │   ├── index.ts              # Configuration loader
│   │   │   ├── keywords.json         # 200+ keyword taxonomy
│   │   │   ├── temporal-calendar.json # Holiday/time targeting
│   │   │   ├── learning.json         # Learning system parameters (sample sizes, thresholds)
│   │   │   └── env.ts                # Environment validation
│   │   ├── analysis/
│   │   │   ├── signal-1-linguistic.ts    # Solution-Seeking Score
│   │   │   ├── signal-2-author.ts        # Author Relationship Score
│   │   │   ├── signal-3-velocity.ts      # Engagement Velocity Score
│   │   │   ├── signal-4-semantic.ts      # Topic Relevance Score
│   │   │   ├── decision-engine.ts        # Composite scoring & mode selection
│   │   │   ├── safety-protocol.ts        # Primary Safety Protocol
│   │   │   ├── temporal-intelligence.ts  # Time-based adjustments
│   │   │   ├── power-user-detector.ts    # High-impact user detection
│   │   │   ├── competitive-detector.ts   # Competitor mention detection
│   │   │   └── misinformation-detector.ts # Myth detection
│   │   ├── generation/
│   │   │   ├── archetype-selector.ts     # Archetype selection logic
│   │   │   ├── reply-generator.ts        # DeepSeek integration
│   │   │   ├── platform-personality.ts   # Platform-specific adaptation
│   │   │   └── competitive-replies.ts    # Defensive positioning
│   │   ├── compliance/
│   │   │   ├── validator.ts              # Claims compliance validation
│   │   │   └── claims-library.json       # Approved/prohibited terms
│   │   ├── platforms/
│   │   │   ├── twitter/
│   │   │   │   ├── auth.ts               # OAuth 2.0 authentication
│   │   │   │   ├── client.ts             # Twitter API client
│   │   │   │   ├── monitor.ts            # Tweet monitoring
│   │   │   │   └── poster.ts             # Tweet posting
│   │   │   ├── reddit/
│   │   │   │   ├── auth.ts               # OAuth authentication
│   │   │   │   ├── client.ts             # Reddit API client
│   │   │   │   ├── monitor.ts            # Subreddit monitoring
│   │   │   │   └── poster.ts             # Comment posting
│   │   │   └── threads/
│   │   │       ├── auth.ts               # Token authentication
│   │   │       ├── client.ts             # Threads API client
│   │   │       ├── monitor.ts            # Thread monitoring
│   │   │       └── poster.ts             # Reply posting
│   │   ├── workers/
│   │   │   ├── stream-monitor.ts         # Main monitoring worker
│   │   │   ├── queue-processor.ts        # Post analysis processor
│   │   │   ├── feedback-collector.ts     # Outcome collection
│   │   │   ├── self-correction.ts        # Backlash monitoring
│   │   │   └── relationship-updater.ts   # Author score updates
│   │   ├── analytics/
│   │   │   ├── commercial-kpis.ts        # CTR, conversions tracking
│   │   │   ├── love-kpis.ts              # Engagement tracking
│   │   │   ├── safety-kpis.ts            # Removal/report tracking
│   │   │   ├── community-champions.ts    # Champion identification
│   │   │   └── product-gap-analyzer.ts   # Competitive intelligence
│   │   ├── learning/
│   │   │   ├── ab-testing.ts             # Experiment framework
│   │   │   ├── thompson-sampling.ts      # Multi-armed bandit (Priority 2)
│   │   │   ├── weight-optimizer.ts       # Strategy adjustment
│   │   │   ├── segmented-optimizer.ts    # Platform/time-specific weights (Priority 2)
│   │   │   ├── algorithm-monitor.ts      # Platform drift detection
│   │   │   ├── keyword-optimizer.ts      # Keyword performance
│   │   │   ├── causal-inference.ts       # Randomization-based causality (Priority 3)
│   │   │   └── meta-learner.ts           # Learning accuracy tracking (Priority 3)
│   │   ├── monitoring/
│   │   │   ├── alerting.ts               # Alert engine
│   │   │   └── health-check.ts           # System health
│   │   ├── services/
│   │   │   ├── reddit-content-poster.ts  # r/VitaWellness content
│   │   │   └── dm-campaign.ts            # Champion outreach
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── health.ts             # Health check endpoints
│   │   │   │   ├── decisions.ts          # Decision API
│   │   │   │   ├── replies.ts            # Reply management
│   │   │   │   ├── approvals.ts          # Manual approval
│   │   │   │   ├── analytics.ts          # KPI endpoints
│   │   │   │   ├── experiments.ts        # A/B testing
│   │   │   │   ├── competitive.ts        # Competitive intelligence
│   │   │   │   └── export.ts             # LLM-ready export
│   │   │   └── middleware/
│   │   │       ├── auth.ts               # API authentication
│   │   │       ├── rate-limit.ts         # Rate limiting
│   │   │       ├── error-handler.ts      # Error handling
│   │   │       └── request-logger.ts     # Request logging
│   │   ├── utils/
│   │   │   ├── rate-limiter.ts           # Token bucket rate limiter
│   │   │   ├── logger.ts                 # Pino logger setup
│   │   │   ├── utm-generator.ts          # UTM link generation
│   │   │   ├── robust-statistics.ts      # Winsorized mean, Tukey's method, outlier detection (P1)
│   │   │   ├── statistical-inference.ts  # Confidence intervals, Cohen's d, t-tests (P1)
│   │   │   └── bayesian-stats.ts         # Beta distribution sampling for Thompson Sampling (P2)
│   │   └── data/
│   │       ├── claims-library.json       # Legal-approved claims
│   │       ├── message-archetypes.json   # 8 archetype templates
│   │       └── competitors.json          # Competitor database
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── analysis/
│   │   │   ├── generation/
│   │   │   └── compliance/
│   │   └── integration/
│   │       ├── api/
│   │       └── platforms/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── dashboard/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                # Root layout
│   │   │   ├── page.tsx                  # Mission Control (View 1)
│   │   │   ├── filtering/
│   │   │   │   └── page.tsx              # Filtering Funnel (View 2)
│   │   │   ├── revenue/
│   │   │   │   └── page.tsx              # Revenue Attribution (View 3)
│   │   │   ├── customers/
│   │   │   │   └── page.tsx              # Customer Journey (View 4)
│   │   │   ├── kpis/
│   │   │   │   └── page.tsx              # Triple Bottom Line (View 5)
│   │   │   ├── content/
│   │   │   │   └── page.tsx              # Content Quality (View 6)
│   │   │   ├── experiments/
│   │   │   │   └── page.tsx              # A/B Testing Lab (View 7)
│   │   │   ├── health/
│   │   │   │   └── page.tsx              # System Health (View 8)
│   │   │   ├── competitive/
│   │   │   │   └── page.tsx              # Competitive Intel (View 9)
│   │   │   ├── advocacy/
│   │   │   │   └── page.tsx              # Champions (View 10)
│   │   │   ├── approvals/
│   │   │   │   └── page.tsx              # Manual Approval Queue
│   │   │   ├── escalations/
│   │   │   │   └── page.tsx              # Human Escalation Queue
│   │   │   └── api/
│   │   │       └── [...proxy]/route.ts   # API proxy to backend
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   │   │   ├── Header.tsx            # Top header
│   │   │   │   └── AlertBanner.tsx       # Alert notifications
│   │   │   ├── dashboard/
│   │   │   │   ├── MetricCard.tsx        # KPI metric display
│   │   │   │   ├── ActivityFeed.tsx      # Real-time activity
│   │   │   │   ├── TrendChart.tsx        # Time series charts
│   │   │   │   ├── FunnelChart.tsx       # Filtering funnel
│   │   │   │   ├── HeatMap.tsx           # Time heatmaps
│   │   │   │   └── DataTable.tsx         # Data tables
│   │   │   ├── approval/
│   │   │   │   ├── ApprovalCard.tsx      # Reply approval card
│   │   │   │   ├── EditModal.tsx         # Edit reply modal
│   │   │   │   └── BulkActions.tsx       # Bulk approval
│   │   │   └── common/
│   │   │       ├── Button.tsx
│   │   │       ├── Badge.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── DatePicker.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts           # Real-time updates
│   │   │   ├── useKPIs.ts                # KPI data fetching
│   │   │   └── useApprovals.ts           # Approval queue
│   │   ├── lib/
│   │   │   ├── api.ts                    # API client
│   │   │   └── websocket.ts              # WebSocket client
│   │   └── styles/
│   │       └── globals.css               # Tailwind + custom styles
│   ├── public/
│   ├── Dockerfile
│   ├── next.config.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── shared/
│   ├── src/
│   │   ├── types/
│   │   │   ├── post.ts                   # Post types
│   │   │   ├── decision.ts               # Decision types
│   │   │   ├── reply.ts                  # Reply types
│   │   │   ├── author.ts                 # Author types
│   │   │   ├── kpi.ts                    # KPI types
│   │   │   ├── experiment.ts             # A/B test types
│   │   │   └── api.ts                    # API request/response types
│   │   ├── constants/
│   │   │   ├── modes.ts                  # Operational modes
│   │   │   ├── archetypes.ts             # Message archetypes
│   │   │   └── platforms.ts              # Platform identifiers
│   │   ├── schemas/
│   │   │   ├── post.ts                   # Zod schemas
│   │   │   ├── decision.ts
│   │   │   └── config.ts
│   │   └── utils/
│   │       ├── date.ts                   # Date utilities
│   │       └── validation.ts             # Shared validators
│   ├── package.json
│   └── tsconfig.json
├── database/
│   ├── prisma/
│   │   ├── schema.prisma                 # Database schema
│   │   ├── migrations/                   # Migration history
│   │   └── seed.ts                       # Seed data
│   ├── package.json
│   └── tsconfig.json
├── docker/
│   ├── docker-compose.yml                # Full stack orchestration
│   ├── docker-compose.dev.yml            # Development overrides
│   ├── docker-compose.prod.yml           # Production overrides
│   └── cloudflared/
│       └── config.yml                    # Cloudflare Tunnel config
├── docs/
│   ├── architecture.md                   # This document
│   ├── api-reference.md                  # API documentation
│   ├── runbook.md                        # Operations guide
│   └── launch-checklist.md               # Production checklist
├── scripts/
│   ├── setup.sh                          # Initial setup script
│   ├── backup-db.sh                      # Database backup
│   └── restore-db.sh                     # Database restore
├── .husky/                               # Git hooks directory
│   ├── pre-commit                        # Pre-commit hook (lint-staged)
│   ├── pre-push                          # Pre-push hook (run tests)
│   └── commit-msg                        # Commit message validation
├── .vscode/                              # VS Code workspace settings
│   ├── settings.json                     # Editor settings
│   ├── extensions.json                   # Recommended extensions
│   └── launch.json                       # Debug configurations
├── .env.example                          # Environment template
├── .gitignore                            # Git ignore rules
├── .eslintrc.js                          # ESLint configuration
├── .eslintignore                         # ESLint ignore patterns
├── .prettierrc                           # Prettier configuration
├── .prettierignore                       # Prettier ignore patterns
├── .editorconfig                         # Editor configuration
├── .nvmrc                                # Node version specification
├── package.json                          # Root workspace config
├── pnpm-workspace.yaml                   # pnpm workspace definition
├── tsconfig.base.json                    # Shared TypeScript config
├── vitest.config.ts                      # Vitest test configuration
├── docker-compose.yml                    # Docker compose (links to docker/)
├── CONTRIBUTING.md                       # Contribution guidelines
├── CODE_OF_CONDUCT.md                    # Code of conduct
├── CHANGELOG.md                          # Version history
└── README.md                             # Project documentation
```

## 3.2 Package Dependencies

### Root `package.json`
```json
{
  "name": "antone",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "engines": {
    "node": ">=24.11.0",
    "pnpm": ">=10.0.0"
  },
  "workspaces": ["backend", "dashboard", "shared", "database"],
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "test:coverage": "pnpm -r test:coverage",
    "lint": "pnpm -r lint",
    "lint:fix": "pnpm -r lint:fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "typecheck": "pnpm -r typecheck",
    "validate": "pnpm typecheck && pnpm lint && pnpm test",
    "db:migrate": "pnpm --filter database db:migrate",
    "db:seed": "pnpm --filter database db:seed",
    "db:studio": "pnpm --filter database db:studio",
    "docker:dev": "docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up",
    "docker:prod": "docker-compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d",
    "docker:down": "docker-compose -f docker/docker-compose.yml down",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@types/node": "^24.11.0",
    "typescript": "^5.9.3",
    "eslint": "^9.15.0",
    "@typescript-eslint/eslint-plugin": "^8.17.0",
    "@typescript-eslint/parser": "^8.17.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.31.0",
    "eslint-plugin-security": "^3.0.1",
    "prettier": "^3.4.0",
    "husky": "^9.1.7",
    "lint-staged": "^15.2.11",
    "@commitlint/cli": "^19.6.1",
    "@commitlint/config-conventional": "^19.6.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{js,jsx,json,md}": [
      "prettier --write"
    ]
  }
}
```

### Backend Dependencies
```json
{
  "dependencies": {
    "hono": "^4.6.0",
    "@hono/node-server": "^1.13.0",
    "@prisma/client": "^7.0.1",
    "twitter-api-v2": "^1.17.2",
    "snoowrap": "^1.23.0",
    "axios": "^1.7.9",
    "zod": "^3.24.1",
    "pino": "^9.5.0",
    "pino-pretty": "^12.0.0",
    "simple-statistics": "^7.8.3",
    "jstat": "^1.9.6",
    "seedrandom": "^3.0.5",
    "ioredis": "^5.4.2",
    "node-cron": "^3.0.3",
    "uuid": "^11.0.3",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "@types/uuid": "^10.0.0",
    "@types/node": "^24.11.0",
    "@types/simple-statistics": "^7.8.3",
    "@types/jstat": "^1.9.3",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.14",
    "vitest": "^2.1.8",
    "ts-node": "^10.9.2",
    "tsx": "^4.19.2",
    "prisma": "^7.0.1",
    "typescript": "^5.9.3"
  }
}
```

### Dashboard Dependencies
```json
{
  "dependencies": {
    "next": "^16.0.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.62.11",
    "recharts": "^2.15.0",
    "lucide-react": "^0.468.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5",
    "date-fns": "^4.1.0",
    "socket.io-client": "^4.8.1"
  },
  "devDependencies": {
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "tailwindcss": "^4.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "typescript": "^5.9.3"
  }
}
```

## 3.3 Development Tooling Configuration

This section provides the complete configuration for all development tooling to ensure consistency across the team.

### 3.3.1 Git Hooks (Husky)

**Pre-commit Hook (`.husky/pre-commit`)**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged to lint and format staged files
pnpm lint-staged

# Run type checking
pnpm typecheck
```

**Pre-push Hook (`.husky/pre-push`)**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run all tests before push
pnpm test

# Ensure build passes
pnpm build
```

**Commit Message Hook (`.husky/commit-msg`)**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message format (Conventional Commits)
pnpm commitlint --edit $1
```

**CommitLint Configuration (`.commitlintrc.js`)**:
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'revert',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
};
```

### 3.3.2 Editor Configuration

**EditorConfig (`.editorconfig`)**:
```ini
# EditorConfig is awesome: https://EditorConfig.org

root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2

[Makefile]
indent_style = tab
```

**VS Code Settings (`.vscode/settings.json`)**:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/coverage": true
  },
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/.next/**": true
  }
}
```

**VS Code Extensions (`.vscode/extensions.json`)**:
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens",
    "eamodio.gitlens",
    "streetsidesoftware.code-spell-checker",
    "yoavbls.pretty-ts-errors",
    "vitest.explorer"
  ]
}
```

**VS Code Launch Configuration (`.vscode/launch.json`)**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend API",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/src/index.ts",
      "preLaunchTask": "tsc: build - backend/tsconfig.json",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend Worker",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/src/workers/index.ts",
      "preLaunchTask": "tsc: build - backend/tsconfig.json",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"]
    },
    {
      "name": "Debug Vitest Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test", "--run"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### 3.3.3 Node Version Management

**.nvmrc (Node Version)**:
```
24.11.1
```

**Purpose**: Ensures all developers use the same Node.js version. Use with:
```bash
nvm use
# or
nvm install
```

### 3.3.4 Ignore Files

**.eslintignore**:
```
node_modules/
dist/
.next/
coverage/
*.config.js
*.config.ts
prisma/migrations/
public/
```

**.prettierignore**:
```
node_modules/
dist/
.next/
coverage/
pnpm-lock.yaml
CHANGELOG.md
prisma/migrations/
public/
```

**.gitignore**:
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Production
dist/
build/
.next/
out/

# Misc
.DS_Store
*.log
*.pid
*.seed
*.pid.lock

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Database
*.db
*.sqlite
postgres_data/

# Temporary
tmp/
temp/
.cache/

# OS
Thumbs.db
.DS_Store
```

### 3.3.5 Vitest Configuration

**Vitest Config (`vitest.config.ts`)**:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/types/',
        '**/*.config.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3.3.6 TypeScript Path Aliases

**Shared TypeScript Config (`tsconfig.base.json`)**:
```json
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["ES2024"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/src/*"]
    },
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**Backend TypeScript Config (`backend/tsconfig.json`)**:
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

### 3.3.7 PNPM Workspace Configuration

**pnpm-workspace.yaml**:
```yaml
packages:
  - 'backend'
  - 'dashboard'
  - 'shared'
  - 'database'

# Shared dependencies are hoisted to root
shared-workspace-lockfile: true
link-workspace-packages: true
```

**Purpose**: Enables monorepo management with shared dependencies and cross-package references.

---
