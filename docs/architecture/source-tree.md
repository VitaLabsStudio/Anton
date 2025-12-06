# Source Tree & Repository Structure

## 1. Monorepo Layout

The project follows a monorepo structure managed by pnpm workspaces.

```
antone/
├── .github/
│   └── workflows/            # CI/CD pipelines
├── backend/                  # Node.js/Hono API & Workers
│   ├── src/
│   │   ├── analysis/         # Multi-signal analysis engine
│   │   ├── api/              # Hono API routes & middleware
│   │   ├── clients/          # External API clients (Twitter, Reddit, etc.)
│   │   ├── compliance/       # Compliance validation logic
│   │   ├── config/           # Configuration & environment variables
│   │   ├── generation/       # LLM reply generation (DeepSeek)
│   │   ├── learning/         # Advanced statistical learning system
│   │   ├── workers/          # Background job processors
│   │   ├── index.ts          # Entry point
│   │   └── server.ts         # Server setup
│   ├── tests/                # Backend tests (Unit & Integration)
│   ├── Dockerfile
│   └── package.json
├── dashboard/                # Next.js Admin Dashboard
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities & API clients
│   │   └── styles/           # Tailwind CSS & global styles
│   ├── Dockerfile
│   └── package.json
├── database/                 # Database Infrastructure
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema definition
│   │   ├── migrations/       # SQL migrations
│   │   └── seed.ts           # Database seeding script
│   └── package.json
├── docker/                   # Docker Compose configurations
│   ├── cloudflared/          # Tunnel configuration
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml
├── docs/                     # Documentation
│   ├── architecture/         # Architecture specifications
│   ├── manuals/              # User manuals
│   └── prd/                  # Product Requirements Documents
├── shared/                   # Shared Code (Types, Constants, Utils)
│   ├── src/
│   │   ├── constants/
│   │   ├── schemas/          # Zod schemas
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Shared utilities
│   └── package.json
├── .husky/                   # Git hooks
├── .vscode/                  # Editor settings
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # Workspace definition
└── tsconfig.base.json        # Shared TypeScript config
```

## 2. Key Directory Details

### Backend (`/backend`)
- **`analysis/`**: Contains the core logic for the 4-signal analysis engine (`linguistic`, `author`, `velocity`, `semantic`).
- **`learning/`**: Implements the advanced learning system (Thompson Sampling, robust statistics, weight optimization).
- **`workers/`**: Contains background workers for stream monitoring, queue processing, and system maintenance.

### Dashboard (`/dashboard`)
- **`src/app/`**: Follows Next.js App Router structure.
- **`src/components/`**: Reusable UI components styled with Tailwind CSS.

### Shared (`/shared`)
- **`types/`**: Single source of truth for TypeScript interfaces used across backend and dashboard.
- **`schemas/`**: Zod validation schemas shared between API and frontend.

### Database (`/database`)
- **`prisma/schema.prisma`**: Defines the data model for PostgreSQL.
- **`prisma/migrations/`**: Versioned database schema changes.

## 3. Root Configuration Files

- **`package.json`**: Defines workspaces, scripts, and dev dependencies.
- **`pnpm-workspace.yaml`**: Configures the pnpm workspace.
- **`tsconfig.base.json`**: Base TypeScript configuration extended by all packages.
- **`.eslintrc.js`**: Root ESLint configuration.
- **`.prettierrc`**: Root Prettier configuration.

## 4. Workspace Packages

| Package | Path | Description | Dependencies |
|---------|------|-------------|--------------|
| `backend` | `./backend` | Core API and Workers | `shared`, `database` |
| `dashboard` | `./dashboard` | Admin UI | `shared` |
| `database` | `./database` | Prisma Client & Migrations | - |
| `shared` | `./shared` | Shared Types & Utils | - |

## 5. Docker Configuration

The `docker/` directory contains orchestration files:
- **`docker-compose.yml`**: Base service definitions (Postgres, Redis).
- **`docker-compose.dev.yml`**: Development overrides (hot reload, local ports).
- **`docker-compose.prod.yml`**: Production overrides (restart policies, resource limits).
