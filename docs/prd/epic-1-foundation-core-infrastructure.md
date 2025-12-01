# Epic 1: Foundation & Core Infrastructure

**Epic Goal**: Build the foundational infrastructure for Antone, including project setup, Docker Compose self-hosted deployment, PostgreSQL database with Relationship Memory schema, authentication with all three platform APIs (Twitter/X, Reddit, Threads), maximum reach keyword filtering (200+ terms with Reddit karma farming strategy), Reddit community building (r/VitaWellness), and comprehensive health check system. This epic establishes the technical foundation upon which all subsequent intelligence and engagement features will be built, with strategic Reddit presence prioritizing existing large subreddits while building owned community long-term.

## Story 1.1: Project Setup & Monorepo Structure

**As a** developer,  
**I want** a well-organized monorepo with TypeScript, linting, build tooling, and advanced statistical libraries configured,  
**so that** the codebase is maintainable, type-safe, supports advanced learning algorithms, and is ready for multiple team members to contribute.

**Acceptance Criteria:**

1. Project initialized with `pnpm` workspaces for `/backend`, `/dashboard`, and `/shared`
2. TypeScript configured with strict mode and path aliases:
   - Base config: `tsconfig.base.json` with strict mode enabled
   - Target: ES2024, Module: NodeNext, ModuleResolution: NodeNext
   - Path aliases: `@/*` for local src, `@shared/*` for shared package
   - Backend tsconfig: extends base, `outDir: ./dist`, `rootDir: ./src`
   - Dashboard tsconfig: extends base, Next.js specific config
   - Shared tsconfig: exports types for consumption by other packages
   - Strict mode flags enabled in tsconfig.base.json:
     * `strict: true` (base strict flag)
     * `noImplicitAny: true`, `strictNullChecks: true`, `strictFunctionTypes: true`
     * `strictBindCallApply: true`, `strictPropertyInitialization: true`
     * `noImplicitThis: true`, `alwaysStrict: true`
     * `noUnusedLocals: true`, `noUnusedParameters: true`
     * `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`
     * `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`
     * `noPropertyAccessFromIndexSignature: true`
3. ESLint and Prettier configured with consistent rules across all packages:
   - ESLint 9.15.x with TypeScript plugin, security plugin, import plugin
   - Key ESLint rules enforced:
     * `@typescript-eslint/explicit-function-return-type: error`
     * `@typescript-eslint/no-explicit-any: error`
     * `@typescript-eslint/no-floating-promises: error`, `await-thenable: error`
     * Import order with alphabetization and grouped imports (builtin → external → internal)
     * Security plugin: `detect-object-injection: warn`, `detect-non-literal-regexp: warn`
   - Prettier 3.4.x with 100 char line length, single quotes, semicolons
   - EditorConfig with LF line endings, 2-space indent
4. `package.json` scripts defined at root level:
   - Development: `dev`, `build`, `test`, `test:coverage`
   - Code Quality: `lint`, `lint:fix`, `format`, `format:check`, `typecheck`, `validate`
   - Database: `db:migrate`, `db:seed`, `db:studio`
   - Docker: `docker:dev`, `docker:prod`, `docker:down`
   - Git Hooks: `prepare` (husky install)
5. `.gitignore` configured to exclude `node_modules`, `.env`, build artifacts
6. README.md includes project overview, setup instructions, and architecture diagram
7. All packages build successfully with `pnpm build`
8. **Advanced Learning System Dependencies** (from Learning System Improvements doc):
   - `simple-statistics` (^7.8.3) - Statistical functions for robust statistics
   - `jstat` (^1.9.6) - Beta distribution, t-tests, and statistical inference
   - `seedrandom` (^3.0.5) - Reproducible random sampling for Thompson Sampling
   - `@types/simple-statistics` (^7.8.3) - TypeScript definitions
   - `@types/jstat` (^1.9.3) - TypeScript definitions
9. Configuration file created at `backend/src/config/learning.json` with:
   - Minimum sample sizes for all learning operations
   - Robust statistics settings (Winsorization percentiles)
   - Confidence interval parameters
   - Thompson Sampling configuration
   - Segmentation settings
   - Adaptive learning rate parameters
   - Causal inference settings
   - Meta-learning configuration
10. **Production Dependencies** installed with locked versions:
   - Runtime: Node.js **24.11.1** (LTS), TypeScript **5.9.3**
   - Package Manager: pnpm **10.0.0** (25% faster than 8.x)
   - Web Framework: `hono@^4.6.0`, `@hono/node-server@^1.13.0` (10x faster than Express)
   - Database: `@prisma/client@^7.0.1`, `prisma@^7.0.1` (devDependency) (40% faster queries)
   - Platform SDKs: `twitter-api-v2@^1.17.2`, `snoowrap@^1.23.0`, `axios@^1.7.9`
   - Validation: `zod@^3.24.1`
   - Logging: `pino@^9.5.0`, `pino-pretty@^12.0.0`
   - Utilities: `ioredis@^5.4.2`, `node-cron@^3.0.3`, `uuid@^11.0.3`, `dotenv@^16.4.7`
11. **Dashboard Dependencies** configured:
   - Framework: `next@^16.0.2` (Turbopack default), `react@^19.0.0`, `react-dom@^19.0.0`
   - Styling: `tailwindcss@^4.0.0` (Oxide engine, 10x faster builds)
   - Data Fetching: `@tanstack/react-query@^5.62.11`
   - Visualization: `recharts@^2.15.0`, `lucide-react@^0.468.0`
   - Utilities: `clsx@^2.1.1`, `tailwind-merge@^2.5.5`, `date-fns@^4.1.0`
   - Real-time: `socket.io-client@^4.8.1`
12. **Development Tooling** configured:
   - Git hooks: Husky 9.x with pre-commit (lint-staged + typecheck), pre-push (tests + build), commit-msg (commitlint)
   - CommitLint: Conventional commits format enforced (`@commitlint/config-conventional`)
   - EditorConfig: Consistent formatting rules (`.editorconfig`) - UTF-8, LF, 2-space indent
   - VS Code: Workspace settings with recommended extensions:
     - `.vscode/settings.json`: Format on save, ESLint auto-fix on save
     - `.vscode/extensions.json`: ESLint, Prettier, Tailwind CSS, Prisma, TypeScript, Error Lens, GitLens
     - `.vscode/launch.json`: Debug configurations for API, worker, and tests
   - Node version: `.nvmrc` file with version **24.11.1** (LTS until April 2027)
   - Ignore files: `.eslintignore`, `.prettierignore`, `.gitignore` properly configured
   - Testing: Vitest 2.1.x for unit and integration tests (faster than Jest)
   - Vitest configuration:
     * Coverage provider: v8 (faster than istanbul)
     * Coverage thresholds: 80% lines, 80% functions, 75% branches, 80% statements
     * Reporters: text (console), json, html (dashboard), lcov (CI)
     * Test file patterns: `**/*.{test,spec}.{ts,tsx}`

---

## Story 1.2: Docker Compose Infrastructure Setup

**As a** developer,  
**I want** Docker Compose configuration for all services with proper networking and persistence,  
**so that** the application can run reliably on self-hosted infrastructure with consistent environments.

**Acceptance Criteria:**

1. `docker-compose.yml` created in repo root with services: backend-api, backend-worker, dashboard, postgres, cloudflared
2. Dockerfile created for Node.js services with multi-stage build using **Node.js 24-alpine** base image:
   - Stage 1 (base): Node 24-alpine + pnpm 10.x via corepack
   - Stage 2 (deps): Install dependencies with frozen lockfile
   - Stage 3 (builder): Build TypeScript to JavaScript
   - Stage 4 (production): Copy dist + node_modules, expose port 3001, non-root user
   - Development target: Hot reload support
   - Production target: Optimized, minimal layers, security hardened
3. PostgreSQL service configured with specific version and persistent volume:
   - Image: `postgres:17-alpine` (latest stable, 30% faster JSON operations)
   - Persistent volume: `postgres_data` mounted to `/var/lib/postgresql/data`
   - Environment: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
   - Storage: 1TB available on host machine
   - Health check: `pg_isready -U antone` every 10s
   - Resource allocation: 8-16GB RAM for PostgreSQL (configurable based on workload)
   - Host specs: 32GB RAM total, Intel i5 6-core, 1TB SSD
4. Environment variables defined in `.env.example` (template for `.env`)
5. Health checks configured for all services with specific intervals:
   - PostgreSQL: `pg_isready -U antone` every 10s, timeout 5s, retries 5
   - Backend API: `curl -f http://localhost:3001/health` every 30s, timeout 10s, retries 3
   - Restart policy: `unless-stopped` for all services
6. Network configuration: Internal network for service communication, exposed ports for dashboard
7. Successful deployment locally with `docker-compose up -d`
8. All services healthy and communicating (postgres accessible from backend)
9. Data persists across container restarts (test with `docker-compose down && docker-compose up`)
10. **Cloudflare Tunnel service** configured:
   - Service: `cloudflared` with latest image
   - Command: `tunnel run`
   - Environment: `TUNNEL_TOKEN` from `.env`
   - Purpose: Secure remote access to dashboard without port forwarding
   - Configuration: `docker/cloudflared/config.yml` with ingress rules for dashboard and API
11. **Environment-specific compose files** created:
   - `docker-compose.yml`: Base configuration
   - `docker-compose.dev.yml`: Development overrides (hot reload, debug ports)
   - `docker-compose.prod.yml`: Production optimizations (resource limits, security)
   - Usage: `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up`
12. **Backup Strategy** configured for disaster recovery:
    - Schedule: Automated daily backups at 2:00 AM local time
    - Destination: Backblaze B2 cloud storage (free 10GB tier)
    - Retention: 7-day rolling backups, monthly snapshots kept for 1 year
    - RTO (Recovery Time Objective): 4 hours from backup to operational
    - RPO (Recovery Point Objective): 24 hours maximum data loss
    - Backup verification: Weekly restore tests to local staging environment
    - Implementation: Script at `scripts/backup-db.sh` with cron scheduling

---

## Story 1.3: PostgreSQL Database Schema & Migrations

**As a** developer,  
**I want** a PostgreSQL database schema with Prisma ORM and migration system,  
**so that** Relationship Memory, post queue, audit logs, and advanced learning system data can be persisted reliably.

**Technical Rationale**: PostgreSQL 17.x selected for 30% faster JSON operations critical for flexible schemas (`interaction_history`, `signals_json`, `raw_metrics`, `temporal_context`, etc.) and advanced learning system data.

**Acceptance Criteria:**

1. Prisma initialized with PostgreSQL provider and schema file
2. Database schema defined for ALL required tables:
   
   **Core Tables:**
   - `authors` (id, platform, platform_id, handle, display_name, follower_count, is_verified, is_power_user, power_tier, archetype_tags, relationship_score, interaction_history, first_seen_at, last_seen_at, created_at, updated_at)
   - `posts` (id, platform, platform_post_id, author_id, content, detected_at, processed_at, keyword_matches, keyword_categories, spam_filtered, raw_metrics, error_count, error_message, created_at, updated_at)
   - `decisions` (id, post_id, sss_score, ars_score, evs_score, trs_score, composite_score, mode, archetype, safety_flags, signals_json, temporal_context, competitor_detected, is_power_user, experiment_id, experiment_variant, is_randomized_experiment, predicted_mode, created_at)
   - `replies` (id, decision_id, content, archetype, platform, platform_post_id, utm_code, help_count, approval_status, approved_by, approved_at, posted_at, metrics_json, deleted_at, delete_reason, reply_type, created_at, updated_at)
   
   **Competitive Intelligence Tables:**
   - `competitors` (id, name, category, primary_mechanism, price_point, brand_keywords, created_at, updated_at)
   - `competitive_mentions` (id, post_id, competitor_id, sentiment, satisfaction, opportunity_score, replied, created_at)
   
   **Community & Advocacy Tables:**
   - `community_champions` (id, author_id, tier, engagement_count, dm_sent_at, dm_response, sample_sent, converted, advocate_status, created_at, updated_at)
   
   **Analytics Tables:**
   - `kpi_metrics` (id, date, platform, metric_type, metric_name, value, created_at)
     *Unique constraint on (date, platform, metric_type, metric_name)*
   
   **Human Oversight Tables:**
   - `escalations` (id, post_id, decision_id, reply_id, reason, priority, status, assigned_to, resolved_by, resolution_notes, created_at, resolved_at)
   
   **Audit & Compliance Tables:**
   - `audit_logs` (id, entity_type, entity_id, action, actor, details_json, created_at)
     *Note: Append-only table for compliance, 90-day retention then archive*
   
   **Experiments & A/B Testing Tables:**
   - `experiments` (id, name, description, variant_a, variant_b, metric, traffic_split, status, start_date, end_date, results_json, winner, created_at, updated_at)
3. **Advanced Learning System Tables** (from Learning System Improvements doc - Priorities 1-3):
   - `weight_adjustment_logs` (id, date, action, reason, valid_segments, total_segments, sample_sizes, old_weights, new_weights, predicted_improvement, created_at)
     *Purpose: Audit trail for all learning operations*
   - `learning_events` (id, date, adjustment_type, adjustment, predicted_improvement, baseline_performance, actual_improvement, accuracy, evaluated_at, created_at)
     *Purpose: Meta-learning tracker for measuring learning accuracy (Priority 3)*
   - `randomized_experiments` (id, decision_id, predicted_mode, actual_mode, predicted_outcome, actual_outcome, created_at)
     *Purpose: Causal inference via 10% randomization (Priority 3)*
   - `segmented_weights` (id, segment_type, segment_key, sss_weight, ars_weight, evs_weight, trs_weight, sample_size, performance, updated_at, created_at)
     *Purpose: Platform/time-specific weight optimization (Priority 2)*
     *Unique constraint on (segment_type, segment_key)*
4. Migration created with `prisma migrate dev`
5. Seed script created with sample data for development
6. Prisma Client generated and types available via `@shared/db`
7. Database connection tested with simple query in `/health` endpoint
8. All migrations run successfully on staging environment
9. **Database Indexes and Constraints** created for performance and data integrity:
   
   **Unique Constraints:**
   - `authors`: (platform, platform_id)
   - `posts`: (platform, platform_post_id)
   - `kpi_metrics`: (date, platform, metric_type, metric_name)
   - `segmented_weights`: (segment_type, segment_key)
   - `community_champions`: (author_id)
   
   **Performance Indexes:**
   - `decisions.created_at` (time-based queries)
   - `decisions.experiment_variant` (A/B test analysis)
   - `decisions.is_randomized_experiment` (causal inference queries)
   - `decisions.mode` (mode filtering)
   - `decisions.composite_score` (score-based queries)
   - `replies.posted_at` (performance tracking windows)
   - `replies.approval_status` (pending approval queries)
   - `replies.platform + posted_at` (platform-specific analytics)
   - `weight_adjustment_logs.date` (historical analysis)
   - `authors.is_power_user` (power user queries)
   - `authors.platform + handle` (lookup by handle)
   - `posts.processed_at` (queue depth queries)
   - `posts.platform + detected_at` (platform-specific scanning)
   - `escalations.status + priority` (queue management)
   - `escalations.created_at` (SLA tracking)

10. **Prisma Enums** defined for type safety:
   - `Platform`: TWITTER, REDDIT, THREADS
   - `OperationalMode`: HELPFUL, ENGAGEMENT, HYBRID, DISENGAGED
   - `Archetype`: CHECKLIST, MYTHBUST, COACH, STORYLET, HUMOR_LIGHT, CREDIBILITY_ANCHOR, CONFIDENT_RECOMMENDER, PROBLEM_SOLUTION_DIRECT
   - `PowerTier`: MICRO (5k-50k), MACRO (50k-500k), MEGA (>500k)
   - `ApprovalStatus`: PENDING, APPROVED, REJECTED, AUTO_APPROVED
   - `ReplyType`: STANDARD, COMPETITIVE_POSITIONING, MYTH_CORRECTION, KARMA_BUILDING
   - `CompetitorCategory`: REHYDRATION, HANGOVER_PILLS, IV_THERAPY, HOME_REMEDY
   - `PricePoint`: LOW, MID, HIGH
   - `Sentiment`: POSITIVE, NEUTRAL, NEGATIVE
   - `UserSatisfaction`: SATISFIED, UNSATISFIED, QUESTIONING
   - `ChampionTier`: BRONZE (3-5), SILVER (6-10), GOLD (11+)
   - `DmResponseStatus`: NO_RESPONSE, ACCEPTED, DECLINED
   - `AdvocateStatus`: POTENTIAL, CONTACTED, ENGAGED, ADVOCATE, VIP
   - `ExperimentStatus`: DRAFT, RUNNING, PAUSED, COMPLETED, CANCELLED
   - `KpiType`: COMMERCIAL, LOVE, SAFETY
   - `EscalationReason`: SAFETY_AMBIGUITY, VIRAL_THREAD, MODERATOR_WARNING, BACKLASH_SPIKE, LOW_CONFIDENCE, MANUAL_FLAG
   - `EscalationPriority`: CRITICAL, HIGH, MEDIUM, LOW
   - `EscalationStatus`: PENDING, IN_REVIEW, RESOLVED, DISMISSED

11. **Data Validation Schemas** defined using Zod:
   - Post validation: content (1-5000 chars), platform (enum), platform_post_id (alphanumeric), author_handle (alphanumeric+underscore), keyword_matches (1-50 items)
   - Reply validation: content (10-1000 chars, must include signature, no prohibited terms), utm_code (lowercase alphanumeric)
   - Author validation: handle (1-50 chars), follower_count (0-1B), relationship_score (0-1)
   - Score validation: SSS/ARS/TRS (0.0-1.0 float, 2 decimal precision)
   - Integration: Validation runs before all database writes

12. **Database Migration Strategy** established:
    - Migrations: Version-controlled in `database/prisma/migrations/`
    - Naming: `YYYYMMDDHHMMSS_descriptive_name` format
    - Process: Test on local → staging → production (with sign-off at each stage)
    - Rollback procedure:
      * Use `prisma migrate resolve --rolled-back [migration_name]` for marking rollbacks
      * Restore from backup if data corruption occurred
      * Document rollback reason in migration notes
    - Safety rules: 
      * Never delete columns in production (deprecate + hide in code instead)
      * Add columns as nullable initially, backfill data, then make non-nullable
      * Use `@default` for non-nullable columns when adding to existing tables
      * Separate data migrations from schema migrations (run data changes first)
    - Documentation: Breaking changes documented in migration notes with upgrade path
    - Backup requirement: Always backup database before production migrations (automated check)

13. **Data Retention Policy** configuration documented:
    - Posts & Decisions: 90 days active, then archive to compressed JSON (monthly files)
    - Replies: Indefinite retention (permanent audit trail)
    - Authors: Indefinite retention (relationship memory preservation)
    - KPI Metrics: 2 years active, then archive to CSV (quarterly)
    - Audit Logs: 3 years active, then compressed JSON archive (yearly)
    - Archive location: `/var/lib/antone/archives/` on host machine
    - Restore process documented in runbook for historical analysis needs

---

## Story 1.4: Twitter/X API Authentication

**As a** the system,  
**I want** to authenticate with Twitter API v2 using OAuth 2.0,  
**so that** I can monitor tweets and post replies on behalf of @antone_vita account.

**Acceptance Criteria:**

1. Twitter Developer account created and app registered
2. OAuth 2.0 credentials stored in `.env` file (development) or Docker secrets (production):
   - TWITTER_API_KEY
   - TWITTER_API_SECRET
   - TWITTER_ACCESS_TOKEN
   - TWITTER_ACCESS_SECRET
   - TWITTER_BEARER_TOKEN
   Note: Self-hosted deployment does NOT use Fly.io
3. `twitter-api-v2` SDK installed and configured
4. Authentication module created at `@backend/platforms/twitter/auth`
5. API client initialized with proper credentials and error handling
6. Test endpoint `/api/twitter/verify` successfully calls Twitter API (verify credentials)
7. Rate limit headers logged for monitoring
8. **Rate limiting implemented and logged**:
   - Token bucket algorithm: 900 reads/15min, 300 writes/15min
   - Rate limiter class: `@backend/utils/rate-limiter.ts`
   - Integration: All API calls go through `rateLimiter.acquire('read'|'write')`
   - Monitoring: Rate limit headers logged for analysis
   - Handling: Approaching limit (>80%) triggers warning, exceeded triggers queue with retry after reset window
9. **Circuit breaker pattern** implemented for resilience:
   - Threshold: 5 consecutive failures → circuit opens
   - Timeout: 30 seconds (test recovery with half-open state)
   - Metrics: Track circuit state changes (CLOSED → OPEN → HALF_OPEN)
   - Fail-fast: When OPEN, reject immediately without calling API
   - Class: `@backend/utils/circuit-breaker.ts`
10. Authentication errors handled gracefully with retry logic (max 3 retries, exponential backoff)

---

## Story 1.5: Reddit API Authentication

**As a** the system,  
**I want** to authenticate with Reddit API using OAuth 2.0,  
**so that** I can monitor subreddits and post comments on behalf of u/antone_vita account.

**Acceptance Criteria:**

1. Reddit Developer account created and script app registered
2. OAuth credentials (Client ID, Client Secret, Refresh Token) stored in Fly secrets
3. `snoowrap` SDK installed and configured
4. Authentication module created at `@backend/platforms/reddit/auth`
5. API client initialized with user agent and proper credentials
6. Test endpoint `/api/reddit/verify` successfully fetches u/antone_vita profile
7. Subreddit access tested (e.g., r/hangover read permission)
8. **Rate limiting implemented and logged**:
   - Token bucket algorithm: 60 requests/min
   - Rate limiter class: `@backend/utils/rate-limiter.ts`
   - Integration: All API calls go through `rateLimiter.acquire('default')`
   - Monitoring: Rate limit headers from Reddit API logged
   - Handling: Exceeded limit triggers exponential backoff (1min base delay)
9. **Circuit breaker pattern** implemented (same as Twitter):
   - Threshold: 5 consecutive failures → circuit opens
   - Timeout: 30 seconds, fail-fast when OPEN
   - Class: `@backend/utils/circuit-breaker.ts`

---

## Story 1.6: Threads API Authentication

**As a** the system,  
**I want** to authenticate with Threads API (or Instagram Graph API as fallback),  
**so that** I can monitor threads and post replies on behalf of @antone_vita account.

**Acceptance Criteria:**

1. Meta Developer account created and Threads API access requested
2. Access token obtained and stored in Fly secrets
3. HTTP client module created at `@backend/platforms/threads/auth` (manual client if SDK unavailable)
4. Authentication module implements token refresh logic
5. Test endpoint `/api/threads/verify` successfully calls Threads API (user profile fetch)
6. **Rate limiting implemented**:
   - Token bucket algorithm: 200 requests/hour
   - Rate limiter class: `@backend/utils/rate-limiter.ts`
   - Integration: All API calls go through `rateLimiter.acquire('default')`
   - Monitoring: Request count tracked and logged
7. **Circuit breaker pattern** implemented for resilience:
   - Threshold: 5 consecutive failures → circuit opens
   - Timeout: 30 seconds (5 minutes if chronic failures)
   - Fail-fast: Reject immediately when OPEN
   - Class: `@backend/utils/circuit-breaker.ts`
8. Fallback implemented if Threads API unavailable (log warning, continue with X/Reddit)
9. Error responses documented and handled (401 Unauthorized, 429 Rate Limit, timeouts)

---

## Story 1.7: Stream Monitor Worker with Maximum Reach Filtering & Reddit Karma Strategy

**As a** the system,  
**I want** a persistent background worker with maximum reach keyword filtering (200+ terms), permissive processing, and strategic Reddit karma farming,  
**so that** we reach the maximum number of potential customers (1,500-2,500/week) while building Reddit credibility for long-term engagement.

**Acceptance Criteria:**

1. Worker process created at `@backend/workers/stream-monitor.ts`
2. **Tier 1: Expanded Keyword Taxonomy** (200+ keywords across 9 categories):
   
   **Category 1 - Direct Hangover** (10 terms):
   - hangover, hungover, "morning after", "day after drinking", "after party", "hair of the dog", "walk of shame", "death warmed over", "rough morning", "rough night"
   
   **Category 2 - Physical Symptoms PRIMARY** (30 terms):
   - Digestive: nausea, nauseous, queasy, "feel sick", "stomach hurts", vomit, vomiting, "throw up", puking, "dry heaving", "can't keep anything down", bile
   - Head/Pain: headache, migraine, "pounding head", "splitting headache", "head hurts", "head is killing me", "temples throbbing", "sensitivity to light", photophobia
   - Malaise: dehydrated, dehydration, "dry mouth", "cotton mouth", parched, dizzy, dizziness, vertigo, "room spinning", lightheaded, shaking, tremors, sweats
   
   **Category 3 - Physical Symptoms SECONDARY** (25 terms):
   - "body aches", "everything hurts", sore, weak, weakness, "no energy", "can't stand", pale, "look terrible", "feel terrible", death, palpitations, "heart racing", bloated, heartburn
   
   **Category 4 - Cognitive/Emotional** (35 terms):
   - Mental: "brain fog", "can't think", "can't focus", "can't concentrate", confused, disoriented, "what happened", "memory blank", sluggish, zombie
   - Fatigue: exhausted, fatigue, "so tired", "can't function", "can't move", "can't get up", "want to die", "kill me now", "never again", "worst day"
   - Anxiety: anxiety, anxious, "sunday scaries", "hangxiety", "beer fear", paranoid, shame, guilt, regret, embarrassed, "what did I do"
   
   **Category 5 - Drinking Context** (40 terms):
   - Quantities: "too much", "too many drinks", "one too many", "lost count", "way too much", "overdid it", "went too hard"
   - Alcohol: tequila, whiskey, vodka, gin, rum, wine, beer, champagne, shots, bourbon, cocktails, margarita
   - Activities: drinking, "last night", partying, clubbing, "went out", "night out", celebration, wedding, bachelor, birthday, bar, pub, club, party, "blacked out", "don't remember", blackout
   - Time: "this morning", "woke up", morning, AM
   
   **Category 6 - Recovery Intent** (40 terms):
   - Seeking: "how to cure", "how to fix", "what helps", "what works", "need help", "desperate", "please help", remedy, cure, relief, "quick fix", tips, advice
   - Remedies: water, hydrate, electrolytes, gatorade, pedialyte, ibuprofen, aspirin, tylol, advil, coffee, caffeine, banana, vitamin, B12, supplement, "hangover cure", IV, drip
   - Prevention: "before drinking", "how to prevent", "how to avoid", preventive, prevention
   
   **Category 7 - Wellness Context** (30 terms):
   - wellness, health, healthy, "feel better", recovery, recuperate, "body feels", "getting older", "can't do this anymore", "not 21 anymore", productivity, "can't work", "have to work", Monday, workday
   
   **Category 8 - Slang** (25 terms):
   - rekt, wrecked, destroyed, trashed, hammered, smashed, plastered, shitfaced, wasted, "fucked up", "messed up", "feeling it", "paying for it", suffer, suffering, consequences, mistake, RIP, oof, yikes, "send help", SOS, dying, dead
   
   **Category 9 - Meme Language** (15 terms):
   - "narrator voice", "past me", "future me", "sober me", "drunk me", "current status", mood, vibe, "big mood", relatable, "too real", "@ me", "feeling attacked", "called out"

3. **Platform-specific keyword searches** (maximum breadth):
   
   **Twitter**: Advanced Search API with 200+ term compound query:
   ```
   (hangover OR hungover OR nausea OR headache OR vomit OR regret OR "too much" 
   OR "last night" OR tequila OR "never again" OR "brain fog" OR dizzy 
   OR dehydrated OR anxiety OR "feel terrible" OR "can't function" OR shots
   OR "woke up feeling" OR "sunday scaries" OR remedy OR "how to cure"
   OR exhausted OR shaking OR "room spinning" OR "what helps" OR electrolytes
   OR "pounding head" OR queasy OR "throw up" OR "splitting headache"
   OR "overdid it" OR whiskey OR vodka OR partying OR "went out" OR "blacked out"
   ... [all 200+ keywords OR'd together])
   
   AND (morning OR "this morning" OR "woke up" OR "last night" OR Sunday OR Saturday OR Monday)
   
   -movie -"The Hangover" -album -track -bitcoin -ethereum -crypto (minimal spam filters)
   lang:en
   ```
   
   **Reddit**: Monitor expanded subreddits + broad keyword search
   - Core: r/hangover, r/stopdrinking, r/drunk, r/alcohol
   - Health: r/AskDocs, r/HealthAnxiety, r/medical_advice, r/Advice
   - Wellness: r/wellness, r/selfcare, r/Supplements
   - Lifestyle: r/AskReddit, r/CasualConversation, r/college, r/partying
   - Keyword filter across all subs with 200+ term list
   
   **Threads**: Hashtag + keyword search
   - Hashtags: #hangover, #morningafter, #sunfunday, #sundayscaries, #roughmorning, #wellness, #selfcare, #recovery, #partying
   - Keywords: All 200+ terms

4. **Tier 2: Minimal Spam Filtering** (permissive by default):
   - ONLY filter obvious non-hangover spam:
     - Movie/music reviews: Contains "The Hangover" (capitalized movie title) OR "Hangover" + "soundtrack/album/song"
     - Cryptocurrency: "bitcoin/ethereum/crypto" + price mentions ($, USD, crash)
     - Brand accounts: Verified + >50k followers
     - Link spam: >5 URLs in post
   - **Do NOT filter**:
     - Borderline posts ("headache this morning" without drinking context)
     - Vague posts ("feel terrible")
     - Symptom-only posts (no drinking mention)
     - Context-only posts (drinking mention, no symptoms)
   - **Philosophy**: "When in doubt, process it - let DeepSeek decide"

5. **No scoring threshold** - all keyword matches that pass spam filter go to database

6. **Polling logic with temporal intelligence**:
   - Base intervals: 5-15 minutes per platform (configurable)
   - Temporal multiplier: Adjusts frequency based on time/day
     * Sunday 6-11am (peak suffering): 3× frequency (every 5min)
     * Saturday 6-11am: 2× frequency (every 7-8min)
     * Friday-Saturday night: 1.5× frequency (every 10min)
     * Normal times: 1× frequency (every 15min)
   - Implementation: `getTemporalMultiplier()` in `stream-monitor.ts`

7. All filtered posts written to `posts` table with `detected_at`, `platform`, `keyword_matches[]`, `keyword_categories[]`, and `spam_filtered` boolean

8. **Duplicate detection** implemented efficiently:
   - Track last processed post ID per platform in Redis or database (`last_processed_id` field)
   - Twitter: Use `sinceId` parameter in search API (only fetch posts newer than last processed)
   - Reddit: Track last processed post timestamp
   - Threads: Track last processed thread ID
   - On worker restart: Resume from last processed ID (no re-processing)

9. Worker logs comprehensive metrics:
   - Total posts scanned (Tier 1 keyword match)
   - Posts filtered as spam (Tier 2)
   - Posts queued for DeepSeek analysis
   - Keyword match breakdown (which categories triggered most matches)
   - Platform distribution (Twitter vs Reddit vs Threads)

10. **Worker architecture implemented** with centralized WorkerManager:
    - WorkerManager: Orchestrates 5 concurrent background workers at `@backend/workers/index.ts`
    - Worker processes:
      * StreamMonitor: Platform polling every 5-15min (this story)
      * QueueProcessor: Post analysis every 30 seconds (Epic 2)
      * FeedbackCollector: Outcome collection every 30 minutes (Epic 4)
      * SelfCorrection: Backlash monitoring every 15 minutes (Epic 3)
      * RelationshipUpdater: Author score updates hourly (Epic 2)
    - Entry point: `WorkerManager.start()` initializes all workers concurrently
    - Process isolation: Deployed as separate `backend-worker` Docker service (no exposed port)
    - Graceful shutdown: Handle SIGTERM for clean stop (drain current work, then exit)
    - Error isolation: One worker failure doesn't crash others (try/catch per worker loop)
    - Restart policy: `unless-stopped` in Docker Compose

11. **Graceful degradation** implemented for platform failures:
    - Platform status tracking: healthy | degraded | down (per platform)
    - If one platform fails: Continue with other platforms, log warning
    - If all platforms fail: Alert CRITICAL, worker enters degraded mode
    - Failed platform handling:
      * Increase poll interval by 2× for failed platform
      * Retry connection every 30 seconds (via circuit breaker half-open state)
      * Return to normal interval once platform recovers
    - Worker never crashes due to platform API failures (isolation)

12. Worker runs successfully for 1 hour with production-like volume

13. Logs show detailed funnel metrics:
    ```
    [Stream Monitor] Scan cycle complete:
    - Twitter scanned: 5,000 posts → Keyword match: 850 → Spam filter: 120 → Queued: 730
    - Reddit scanned: 1,200 posts → Keyword match: 280 → Spam filter: 30 → Queued: 250  
    - Threads scanned: 800 posts → Keyword match: 150 → Spam filter: 20 → Queued: 130
    - TOTAL: 7,000 scanned → 1,280 matched → 170 spam → 1,110 queued (84% reduction)
    - Expected weekly volume: ~25,000-30,000 posts queued for DeepSeek analysis
    ```

14. Monitoring dashboard shows:
    - Real-time keyword performance (which keywords finding most posts)
    - Spam filter accuracy (manual review sample of filtered posts)
    - Platform coverage (are we missing posts on any platform?)
    - Volume trends (hourly/daily patterns)

15. **Configuration file structure** at `@backend/config/keywords.json`:
    - Format: JSON with version, categories object
    - Each category: name, weight (for future optimization), terms array
    - Exclusions: Top-level array of spam patterns
    - Version control: Track keyword evolution over time
    - Validation: Schema validation on load to prevent malformed config
    - Example structure:
      ```json
      {
        "version": "1.0",
        "categories": {
          "direct_hangover": { "weight": 1.0, "terms": [...] }
        },
        "exclusions": ["The Hangover", "bitcoin"]
      }
      ```

16. **Reddit Karma Farming Strategy** (from FR22):
    - **Phase 1 (First 2 weeks)**: Pure value mode
      - NO product mentions or links in any Reddit replies
      - Focus on helpful, educational content only
      - Target: Build 500+ karma before product mentions begin
    - **Karma Tracking**: Monitor u/antone_vita karma score via Reddit API
    - **Subreddit Prioritization**:
      - **Primary targets** (existing large communities): r/AskReddit, r/LifeProTips, r/CasualConversation, r/Advice
      - **Secondary targets** (hangover-related): r/hangover, r/alcohol, r/college
      - **Strategy**: Participate in high-traffic subreddits first to build credibility, THEN engage in hangover-specific subs
    - **Value-First Content Types**:
      - General wellness advice (hydration, nutrition, sleep)
      - Science explainers (how alcohol affects the body)
      - Helpful tips for r/LifeProTips (non-hangover topics)
      - Empathetic responses in r/CasualConversation
    - **Karma Gate**: System automatically enables product mentions only after 500+ karma achieved
    - **Ongoing Strategy**: Even after 500 karma, maintain 30% of replies as pure-value (no product)
    - Dashboard shows: Current Reddit karma, days until product mentions enabled, value vs product reply ratio

---

---


---

## Story 1.8: Health Check & Monitoring Endpoint

**As a** SRE/operator,  
**I want** a comprehensive health check endpoint that validates all system dependencies including learning system readiness,  
**so that** I can monitor system status, learning algorithm health, and detect failures quickly.

**Acceptance Criteria:**

1. Health check endpoints implemented:
   - `GET /health` - Basic health check (public, no auth required)
   - `GET /health/detailed` - Extended metrics with sensitive data (requires auth)
   Both return JSON with overall status and component checks
2. Database connectivity check (query Prisma Client, return latency)
3. Twitter API check (verify credentials, return auth status)
4. Reddit API check (verify credentials, return auth status)
5. Threads API check (verify credentials, return auth status)
6. Worker status check (last poll timestamp, posts detected count)
7. **Learning System Health Checks** (from Learning System Improvements doc):
   - Sample size health: Current data availability vs minimum requirements
   - Learning stability indicator: Weight volatility over past 4 weeks
   - False positive rate estimate: Percentage of weight adjustments with insufficient data
   - Last successful weight adjustment timestamp
   - Active A/B tests count and statistical power status
   - Meta-learning accuracy: Success rate of past learning decisions
   - Segmentation coverage: Percentage of segments with sufficient data
8. Overall status: `healthy` (all green), `degraded` (some yellow), `unhealthy` (any red)
9. Endpoint returns 200 if healthy, 503 if unhealthy
10. Response time <500ms for full health check (5s timeout per component)
11. Response includes uptime measurement in seconds via `process.uptime()` (system uptime since worker/API start)

11. **Response format specification**:
   ```json
   {
     "status": "healthy|degraded|unhealthy",
     "components": {
       "database": { "status": "healthy", "latencyMs": 15 },
       "twitter": { "status": "healthy", "authValid": true },
       "reddit": { "status": "healthy", "authValid": true, "karma": 127 },
       "threads": { "status": "healthy", "authValid": true },
       "worker": { "status": "healthy", "lastPollAt": "2025-12-01T10:30:00Z", "queueDepth": 23 }
     },
     "learning_system": {
       "status": "healthy",
       "sample_size_health": {
         "weight_adjustment": {"required": 100, "actual": 127, "status": "sufficient"},
         "archetype_comparison": {"required": 50, "actual": 48, "status": "marginal"}
       },
       "learning_stability": "stable",
       "false_positive_rate": 0.09,
       "last_weight_adjustment": "2025-12-01T06:00:00Z",
       "active_experiments": 2,
       "meta_learning_accuracy": 0.87
     },
     "uptime": 86400,
     "timestamp": "2025-12-01T12:00:00Z",
     "version": "1.0.0"
   }
   ```

12. **Component-specific health check strategies**:
   - Database: Execute `SELECT 1` query, measure latency
   - Twitter API: Call `v2.me()` to verify credentials
   - Reddit API: Fetch `u/antone_vita` profile + karma score
   - Threads API: Fetch user profile
   - Worker: Check last poll timestamp
     * <15min = healthy
     * 15-30min = degraded
     * >30min = unhealthy
   - Learning System: Query sample size sufficiency, weight volatility, last adjustment time
11. **Learning Health Response Format**:
    ```json
    {
      "learning_system": {
        "status": "healthy",
        "sample_size_health": {
          "weight_adjustment": {"required": 100, "actual": 127, "status": "sufficient"},
          "archetype_comparison": {"required": 50, "actual": 48, "status": "marginal"}
        },
        "learning_stability": "stable",
        "false_positive_rate": 0.08,
        "last_weight_adjustment": "2025-12-01T10:30:00Z",
        "active_experiments": 2,
        "meta_learning_accuracy": 0.87
      }
    }
    ```

---

## Story 1.9: Reddit Community Building (r/VitaWellness)

**As a** the system,  
**I want** to create and manage r/VitaWellness as a long-term community hub while prioritizing engagement in existing large subreddits,  
**so that** Vita builds organic Reddit presence where users already congregate, with owned community as future growth channel.

**Acceptance Criteria:**

1. **Subreddit Creation**:
   - Create r/VitaWellness with clear rules, sidebar info, and branding
   - Subreddit description: "Science-backed wellness tips, hangover help, and transdermal patch education. Community-first, spam-free zone."
   - Rules posted: No spam, Be respectful, Science-backed advice only, No medical diagnosis
   - Moderator: u/antone_vita (bot account) + human backup moderator

2. **Content Seeding Strategy** (First 30 days):
   - **Focus 80% on existing subreddits** (r/AskReddit, r/LifeProTips, r/hangover, r/college)
   - **Allocate 20% to r/VitaWellness** content creation
   - Post educational content to r/VitaWellness: "The Science of Hangovers", "Transdermal vs Oral Supplements", "Hydration Myths Debunked"
   - Cross-promotion (subtle): Occasionally link helpful r/VitaWellness posts when relevant in other subs

3. **AMA Strategy** (Monthly):
   - Monthly "Ask About Hangover Science" threads in r/VitaWellness
   - Promote AMA in relevant subreddits 24 hours before: "Doing an AMA about hangover science tomorrow in r/VitaWellness - come ask anything!"
   - Human oversight: PM reviews AMA responses before posting

4. **Value-First Content Library**:
   - Create 10 evergreen educational posts (no product mentions)
   - Topics: Alcohol metabolism, NAD+ depletion, hydration science, vitamin cofactors, prevention strategies
   - Post quality: 500-800 words, cited sources, infographics (future enhancement)

5. **Moderator Outreach** (Existing Subreddits):
   - Reach out to r/hangover moderators: "We'd love to sponsor an educational wiki section on science-backed hangover remedies"
   - Offer value: Well-researched content, no spam, transparent Vita affiliation
   - Goal: Get approved contributor status or wiki collaboration

6. **Community Growth Metrics**:
   - r/VitaWellness subscribers: Target 100 in first 30 days, 500 in 90 days
   - Engagement rate: >5% of subscribers actively commenting
   - Retention: Subscribers stay subscribed (low churn)

7. **Engagement Priority**:
   - **Existing large subreddits remain primary focus** (70-80% of Reddit activity)
   - r/VitaWellness is long-term investment, NOT immediate priority
   - Only shift focus to r/VitaWellness once it reaches 1,000+ subscribers organically

8. **Content Posting Service**:
   - Automated service at `@backend/services/reddit-content-poster.ts`
   - Schedule: 1 educational post per week to r/VitaWellness
   - Manual approval: Human reviews all r/VitaWellness posts before publishing

9. Dashboard tracking:
   - r/VitaWellness growth: Subscribers, posts, comments, engagement rate
   - Cross-promotion effectiveness: Traffic from other subs to r/VitaWellness
   - Moderator relationship status: Which subs we have positive relationships with

10. Integration test: Create test subreddit, post content, verify functionality

---
