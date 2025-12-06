# Antone V1 - Autonomous AI Social Media Manager

Antone is an autonomous AI-powered social media engagement bot designed for Vita, a challenger brand in the hangover supplement market. It monitors Twitter/X, Reddit, and Threads for high-intent posts and generates contextually appropriate, compliant replies.

## Architecture Overview

```
antone/
├── backend/          # Hono API server + workers
├── dashboard/        # Next.js 15 frontend
├── shared/           # Shared types, constants, schemas
├── database/         # Prisma schema and migrations
├── docker/           # Docker compose files
├── scripts/          # Utility scripts
├── .husky/           # Git hooks
└── .vscode/          # VS Code workspace settings
```

## Prerequisites

- **Node.js**: >= 22.12.0 (LTS)
- **pnpm**: >= 9.0.0
- **Docker**: For local PostgreSQL and Redis

## Quick Start

```bash
# Install dependencies
pnpm install

# Start Docker services (PostgreSQL, Redis)
pnpm docker:dev

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

## Available Scripts

### Development

| Command              | Description                            |
| -------------------- | -------------------------------------- |
| `pnpm dev`           | Start all services in development mode |
| `pnpm build`         | Build all packages                     |
| `pnpm test`          | Run all tests                          |
| `pnpm test:coverage` | Run tests with coverage                |

### Code Quality

| Command             | Description                           |
| ------------------- | ------------------------------------- |
| `pnpm lint`         | Run ESLint                            |
| `pnpm lint:fix`     | Run ESLint with auto-fix              |
| `pnpm format`       | Format code with Prettier             |
| `pnpm format:check` | Check formatting                      |
| `pnpm typecheck`    | Run TypeScript type checking          |
| `pnpm validate`     | Run format:check, lint, and typecheck |

### Database

| Command            | Description             |
| ------------------ | ----------------------- |
| `pnpm db:migrate`  | Run database migrations |
| `pnpm db:seed`     | Seed the database       |
| `pnpm db:studio`   | Open Prisma Studio      |
| `pnpm db:generate` | Generate Prisma client  |

### Docker

| Command            | Description                      |
| ------------------ | -------------------------------- |
| `pnpm docker:dev`  | Start dev Docker services        |
| `pnpm docker:prod` | Start production Docker services |
| `pnpm docker:down` | Stop Docker services             |

## Docker Deployment

### Quick Start

```bash
# 1. Create the external volume (protects data from accidental deletion)
docker volume create antone_postgres_data

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your values

# 3. Start all services (use dev-ctl.sh wrapper for safety)
./scripts/dev-ctl.sh up -d

# 4. Verify deployment
./scripts/verify-docker.sh

# 5. View logs
./scripts/dev-ctl.sh logs -f
```

### Safety: The dev-ctl.sh Wrapper

**Always use `./scripts/dev-ctl.sh` instead of raw `docker-compose`** to prevent accidental data loss.

```bash
./scripts/dev-ctl.sh up -d       # Start services
./scripts/dev-ctl.sh down        # Stop services (safe)
./scripts/dev-ctl.sh logs -f     # Follow logs
./scripts/dev-ctl.sh ps          # List services
```

> ⚠️ **Warning**: The wrapper intercepts `down -v` commands (which delete all data) and requires explicit confirmation.

### Backup & Restore

```bash
# Create backup
./scripts/backup-db.sh

# Restore from backup
./scripts/restore-db.sh --latest
```

### Troubleshooting

See [docs/DOCKER_TROUBLESHOOTING.md](docs/DOCKER_TROUBLESHOOTING.md) for common issues and solutions.

### Emergency Commands

```bash
# Rebuild from scratch (preserves data)
docker-compose -f docker/docker-compose.yml build --no-cache
./scripts/dev-ctl.sh up -d

# Access PostgreSQL directly
docker exec -it antone-postgres psql -U antone
```

### Verification

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `pnpm verify:workspace` | Verify monorepo workspace resolution |

## Project Structure

### Backend (`/backend`)

- **Framework**: Hono (fast, lightweight)
- **Database**: Prisma ORM with PostgreSQL
- **Queue**: Redis with BullMQ
- **Logging**: Pino

### Dashboard (`/dashboard`)

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Data Fetching**: TanStack Query
- **Real-time**: Socket.io

### Shared (`/shared`)

- TypeScript types and interfaces
- Zod validation schemas
- Shared constants

## Decision Engine (v2.1)

- Segmented weights with Bayesian shrinkage, EVS logarithmic scaling, and interaction terms (SSS×ARS, EVS×TRS) with full validation.
- Circuit-breaker wrapped signal fetches (opossum), conservative fallbacks, and uncertainty outputs (credible intervals, mode probabilities, review flags).
- Observability: `GET /metrics` serves Prometheus counters/histogram plus JSON health (`cache`, `breakers`, `latency`); `/api/decisions` returns probabilities, confidence, and `segmentUsed`.
- Thresholds live in `config/decision-thresholds*.yaml` (Zod validated). See `docs/architecture/decision-engine-math.md` for formulas and `docs/qa/decision-engine-troubleshooting.md` for ops playbooks.

```typescript
import { DecisionEngine, DEFAULT_THRESHOLDS } from '@/analysis/decision-engine';

const engine = new DecisionEngine({ thresholds: DEFAULT_THRESHOLDS });
const decision = await engine.analyzePost(post, author);

console.log(decision.mode, decision.modeConfidence, decision.compositeCredibleInterval);
```

## Git Hooks

This project uses Husky for Git hooks:

- **pre-commit**: Runs lint-staged (ESLint + Prettier on staged files)
- **pre-push**: Runs typecheck and tests
- **commit-msg**: Validates conventional commit format

### Commit Message Format

```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
Example: feat(auth): add Twitter OAuth login
```

### Emergency Bypass

In emergency situations, you can bypass git hooks:

```bash
# Bypass pre-commit
git commit --no-verify -m "your message"

# Bypass pre-push
git push --no-verify
```

**Warning**: Only use bypass in emergencies. Bypassed commits should be reviewed ASAP.

## Handling Type Issues

If you encounter TypeScript errors with third-party libraries:

1. Check `backend/src/types/overrides.d.ts` for existing overrides
2. Add new type declarations following the documented pattern
3. Ensure `skipLibCheck: true` is set in tsconfig.base.json

## Environment Variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/antone

# Redis
REDIS_URL=redis://localhost:6379

# Platform APIs (to be configured)
TWITTER_API_KEY=
TWITTER_API_SECRET=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
THREADS_ACCESS_TOKEN=
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all checks pass: `pnpm validate && pnpm test`
4. Submit a PR with conventional commit messages

## License

Private - Property of VITA PATCH LLC.
