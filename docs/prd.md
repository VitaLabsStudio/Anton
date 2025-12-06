# Antone Product Requirements Document (PRD)

**Project**: Antone V1 - Autonomous AI Social Media Manager  
**Client**: Vita (Internal Tool)  
**Date**: December 1, 2025  
**Version**: 1.1  
**Status**: Draft

---

## Goals and Background Context

### Goals

- Build an autonomous AI social media manager that operates 24/7 across Twitter/X, Threads, and Reddit to spread awareness for Vita's transdermal patches
- Deliver genuine value through educational, empathetic content that helps users in their moment of need while maintaining transparent brand affiliation
- Drive measurable commercial outcomes (CTR >2%, conversion >8%, revenue per reply >$0.50) while building a beloved, trusted brand personality (Love KPIs: thanks/likes >12%, positive sentiment >75%)
- Create modular system architecture that supports future patch products (Sleep, Energy) beyond initial hangover support focus
- Learn continuously from every interaction to optimize engagement strategies within strict safety and compliance guardrails
- Operate at minimal cost ($25-35/month DeepSeek LLM + $0 self-hosted infrastructure vs $15k-21k human-only) while achieving superior 24/7 coverage and moment-of-need responsiveness
- Gather valuable market data about Vita's transdermal patch opportunity through real-world social media interactions
- Implement maximum reach keyword filtering (200+ terms) to process 20-30k posts/week, prioritizing customer acquisition over cost savings (reaching 1,500-2,500 potential customers/week vs 800-1,200 narrow approach)
- Prioritize high-impact power users (>5k followers, verified badges) with accelerated response times (<30 min) and premium engagement strategies to maximize brand amplification
- Monitor competitive landscape (LiquidIV, Drip Drop, ZBiotics, Flyby) with defensive positioning strategies and market intelligence gathering
- Generate screenshot-worthy, story-worthy content that users naturally want to share, amplifying organic reach beyond direct engagement

### Background Context

Vita faces a classic challenger brand problem: users experiencing hangover symptoms have immediate purchase intent, but don't know Vita exists. Traditional ads reach users before or after the problem window—not during. Social platforms (Twitter, Reddit, Threads) are where users actively discuss symptoms in real-time, but branded responses are met with skepticism unless they provide genuine, non-promotional value first.

Current solutions fail: spam bots damage trust and get banned, while human-only community management ($15k-21k/month for 3 platforms) can't scale to 24/7 coverage and misses 70-80% of high-intent posts occurring outside work hours. Antone solves this as Vita's internal marketing tool by operating at machine scale with human-level contextual intelligence, delivering practical help first and product discovery second. Deployed on self-hosted infrastructure with maximum reach keyword filtering (200+ terms), Antone operates at $25-35/month (99% cost reduction vs human-only) while processing 20-30k posts/week through DeepSeek R1 LLM, prioritizing customer acquisition over marginal cost savings.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-01 | 1.0 | Initial PRD creation with self-hosted Docker Compose architecture | John (PM) |
| 2025-12-01 | 1.1 | Major enhancements: Added FR19-24 (Power Users, Community Champions, Competitive Intelligence, Temporal Intelligence, Reddit Karma Farming, Social Proof), expanded to 8 archetypes, added platform-specific personalities, added Epic 7 (Competitive Intelligence), expanded dashboard to 10 views, enhanced Reddit strategy with r/VitaWellness community building, updated product mention cadence to 1:2-3 ratio | John (PM) |

---

## Requirements

### Functional

**FR1**: The system SHALL monitor Twitter/X, Threads, and Reddit for posts containing hangover-related keywords in real-time using platform streaming APIs or scheduled polling (5-15 minute intervals).

**FR2**: The system SHALL analyze each detected post using a Multi-Signal Analysis Core with four signal categories: (1) Linguistic Intent (solution-seeking language detection), (2) Author Context (relationship memory scoring), (3) Post Metrics & Velocity (engagement patterns), and (4) Semantic Topic (filtering pop culture/metaphors).

**FR3**: The system SHALL calculate a Decision Score for each post and select one of four operational modes: Helpful Mode (high solution-seeking), Engagement Mode (low solution-seeking, high visibility), Hybrid Mode (ambiguous intent), or Disengaged Mode (default/safety).

**FR4**: The system SHALL generate contextually appropriate, screenshot-worthy replies using eight rotating archetypes (Checklist, Myth-bust, Coach, Storylet, Humor-light, Credibility-anchor, Confident Recommender, Problem-Solution Direct) with platform-specific personality adaptation to avoid detection as templated responses.

**FR5**: The system SHALL enforce Primary Safety Protocol by immediately disengaging from posts containing sensitive topics (death, addiction recovery, medical emergencies, pregnancy, minors, "no self-promo" contexts) regardless of keyword matches.

**FR6**: The system SHALL maintain a persistent Relationship Memory database storing interaction history, author archetypes, and sentiment scores for all engaged users to inform future decision-making.

**FR7**: The system SHALL post replies to selected posts via platform APIs with transparent affiliation disclosure ("—Antone (Vita)") and comply with platform-specific constraints (≤320 chars for X/Threads, no links in restricted subreddits).

**FR8**: The system SHALL implement a Self-Correction Mechanism that monitors post-reply sentiment and autonomously deletes replies that meet stringent negative backlash criteria (sentiment <-0.75, velocity >3× baseline, trusted signal flag, no override tag).

**FR9**: The system SHALL track Commercial KPIs (reply-level CTR, landing page dwell time, add-to-cart rate, conversion rate, revenue per reply) using UTM-tagged links and e-commerce platform integration.

**FR10**: The system SHALL track Love KPIs (thanks/likes per reply, unsolicited follows per 100 replies, positive sentiment score, moderator permissions, creator reposts) via platform APIs and sentiment analysis.

**FR11**: The system SHALL track Safety KPIs (removal/report rate vs community baseline, platform strikes, Reddit karma trajectory, follower sentiment stability) and trigger alerts when thresholds are breached.

**FR12**: The system SHALL implement an autonomous A/B testing framework that experiments with message variants within pre-approved guardrails (no profanity, no unapproved claims, no targeting changes) and adjusts weighting based on KPI outcomes.

**FR13**: The system SHALL maintain a Claims Library approved by Legal containing all permitted scientific phrasing and soft benefits statements, with hard blocks on prohibited terms ("prevent", "cure", "treat", unsubstantiated "clinically proven").

**FR14**: The system SHALL escalate posts to human review queue when: (1) Safety ambiguity detected (Distress Probability >0.45), (2) Viral thread detected (>5× velocity spike), (3) Moderator warning received, or (4) Backlash spike exceeding auto-delete thresholds.

**FR15**: The system SHALL support Product Module architecture allowing future expansion to Sleep and Energy patches by swapping problem ontology, lexicon, and message blocks while reusing core intelligence and safety layers.

**FR16**: The system SHALL provide a web-based dashboard for human oversight displaying: real-time activity feed, KPI metrics (Commercial/Love/Safety), flagged interactions requiring review, and manual approval interface for replies in learning phase.

**FR17**: The system SHALL enforce Cadence & CTA Balance by maintaining at least 1 helpful no-link reply for every 2-3 product-mention replies across platforms and using confident-yet-respectful phrasing ("I keep Vita patches in my bag for exactly this. They're transdermal so they work when your stomach can't handle pills. Worth trying: [link]").

**FR18**: The system SHALL implement Controlled Assertiveness Protocol for correcting misinformation with circuit-breaker rules (max 2 replies per thread, exit on escalation keywords, disengage on third-party hostility).

**FR19**: The system SHALL track Community Champions by identifying users who positively engage with Anton 3+ times (likes, thanks, helpful reactions) and autonomously DM them: "You seem to vibe with what we do! Would you try our patches? We'd love your honest feedback."

**FR20**: The system SHALL implement Social Proof Integration by including dynamic post count in reply signatures ("—Antone (Vita) | Helped 1,247 people feel better this month") and rotating approved user testimonials within Credibility-anchor archetype replies.

**FR21**: The system SHALL implement Power User Prioritization by detecting high-follower accounts (>5k followers) or verified badges, then applying premium engagement: accelerated response time (<30 minutes vs 90 minutes), top-performing archetypes only, follow-up engagement on subsequent posts, and personalized gift outreach ("We'd love to send you samples—DM us your address").

**FR22**: The system SHALL implement Reddit Karma Farming by prioritizing pure-value replies (no product mentions) during the first 2 weeks to build trust and achieve 500+ karma before posting product links, and participating strategically in high-traffic subreddits (r/AskReddit, r/LifeProTips) with helpful general advice to establish credibility.

**FR23**: The system SHALL implement Temporal Intelligence by adjusting monitoring intensity based on time-of-need patterns (3× monitoring during Sunday 6-11am peak suffering window), pre-positioning preventive content on Thursday evenings ("Weekend coming up? Here's a science-backed prevention tip..."), and activating holiday targeting campaigns (New Year's Day, St. Patrick's Day, July 4th).

**FR24**: The system SHALL implement Competitive Intelligence Monitoring by tracking mentions of competing products (LiquidIV, Drip Drop, ZBiotics, Flyby), deploying polite defensive positioning when competitors are mentioned ("Those work via rehydration; Vita uses transdermal delivery which bypasses your upset stomach"), and gathering market intelligence on competitor strengths/weaknesses for product strategy insights.

**FR25**: The system SHALL implement Advanced Statistical Safeguards (Priority 1) including: (1) Minimum sample size validation (100+ decisions for weight adjustments, 50+ for archetype comparison, 30+ for keyword optimization), automatically skipping learning operations when insufficient data is available; (2) Robust outlier detection using Winsorized mean and Tukey's method to prevent viral posts from skewing performance metrics; (3) Confidence interval calculation (95% CI) and Cohen's d effect size reporting for all A/B test results to distinguish statistical significance from practical importance.

**FR26**: The system SHALL implement Multi-Armed Bandit Optimization (Priority 2) using Thompson Sampling for A/B testing, dynamically allocating traffic based on real-time performance (shifting traffic away from losing variants), achieving 2-3x faster experiment convergence (5-7 days vs 14 days fixed split) and minimizing regret by showing inferior variants to fewer users.

**FR27**: The system SHALL implement Platform & Temporal Segmentation (Priority 2) with separate signal weights for each platform (Twitter, Reddit, Threads), time of day (Morning, Afternoon, Evening, Night), and combined contexts (e.g., "Twitter-Morning"), discovering platform-specific optimization opportunities (estimated +20-30% performance improvement) and adapting strategies to temporal patterns.

**FR28**: The system SHALL implement Adaptive Learning Rates (Priority 2) that adjust weight change magnitudes (5-30% range vs fixed 10%) based on: sample size (larger samples = higher confidence = larger changes), consistency (same direction 3+ weeks = increase rate), volatility (high variance = decrease rate), and effect size (large improvements = faster adoption), achieving faster convergence while maintaining stability.

**FR29**: The system SHALL implement Causal Inference & Meta-Learning (Priority 3) by: (1) Randomizing 10% of decisions to detect spurious correlations vs true causal relationships, comparing predicted outcomes to actual outcomes to identify confounding variables; (2) Tracking learning accuracy by recording predicted improvements for each weight adjustment and measuring actual improvement 1 week later, automatically tuning learning parameters if accuracy falls below 70%; (3) Ensemble methods combining multiple optimization algorithms (grid search, Bayesian, genetic) with cross-validation to prevent overfitting.

**FR30**: The system SHALL implement a Context Intelligence Engine (Priority 1) that gates deep retrieval for high-potential posts (default: Decision Score ≥0.65, or power-user/competitor overrides), constructs platform-specific conversation graphs (parents, siblings, root, participant roles), runs thread-level safety and tone-flow analysis, optimizes tokens via dialogue normalization, similarity clustering, and summarization with tiered modes (Light/Standard/Full) and budget-aware ordering, re-evaluates the decision with context-informed recommendations (proceed/adjust/abort, stance diversity + “answered well” detection), and outputs a structured prompt-ready context pack (must-keep/nice-to-have/constraints/strategy/red-flags, ≤900 tokens) while respecting API/tokens through caching and budget controls.

### Non-Functional

**NFR1**: The system SHALL be deployed on self-hosted infrastructure using Docker Compose (user's PC: i5 6-core, 32GB RAM, 1TB storage) with zero infrastructure cost, or AWS Lightsail ($35-40/month) if migrating for production reliability.

**NFR2**: The system SHALL achieve 95% uptime during peak engagement windows (Friday 22:00 - Sunday 13:00 local time, especially Saturday-Sunday 06:00-11:00).

**NFR3**: The system SHALL process each post analysis (Multi-Signal Analysis) in less than 500ms to enable near-real-time engagement.

**NFR4**: The system SHALL support horizontal scaling to handle 100,000+ posts analyzed per week across 3 platforms with room to scale to 5+ platforms.

**NFR5**: The system SHALL use DeepSeek R1 API ($0.55/1M input, $2.19/1M output) for linguistic analysis and message generation with fallback to GPT-5 mini ($0.25/1M input, $2.00/1M output) if quality issues detected (target: $25-35/month LLM cost with maximum reach strategy processing 20-30k posts/week).

**NFR6**: The system SHALL store all decisions, scores, and generated messages in audit logs with 90-day retention for compliance and improvement analysis.

**NFR7**: The system SHALL implement rate limiting per platform to avoid API quota violations: Twitter (300 posts/15min), Reddit (60 requests/min), Threads (200 requests/hour).

**NFR8**: The system SHALL respond to high-intent posts within 90 minutes of posting to maximize "moment of need" relevance (80% target for posts <2 hours old), with priority response time of <30 minutes for power user posts (>5k followers or verified badges).

**NFR9**: The system SHALL use environment-based configuration (development, staging, production) with secrets managed via Docker secrets (local) or AWS Secrets Manager (cloud).

**NFR10**: The system SHALL provide comprehensive logging with structured JSON format for monitoring, debugging, and performance analysis.

**NFR11**: The system SHALL implement graceful degradation: if one platform API fails, continue operation on remaining platforms without system-wide failure.

**NFR12**: The system SHALL be maintainable by a single developer with clear code documentation, modular architecture, and comprehensive test coverage (>80% unit test coverage).

**NFR13**: The system SHALL implement maximum reach filtering strategy prioritizing customer acquisition over cost optimization: (1) Expanded keyword taxonomy (200+ terms across 9 categories: symptoms, drinking context, recovery intent, wellness, slang), (2) Permissive filtering (process all keyword matches, filter only obvious spam), (3) DeepSeek R1 for quality decisions on all candidates (target: process 20-30k posts/week at $25-35/month, reaching 1,500-2,500 potential customers/week vs 800-1,200 with narrow approach).

**NFR14**: The system SHALL achieve learning system performance targets: (1) False positive rate in learning decisions <12% after Priority 1 implementation (down from baseline 30-40%); (2) Time to optimal strategy convergence <4 weeks after Priority 2 implementation (down from baseline 8-12 weeks); (3) Learning accuracy (predicted improvement vs actual improvement) >85% after Priority 3 implementation (up from baseline 60-70%); (4) Statistical computation overhead <100ms per learning operation to avoid impacting real-time decision latency.

**NFR15**: The system SHALL implement learning system data retention policies: (1) Weight adjustment logs retained for 12 months in PostgreSQL database for audit and analysis; (2) Learning events retained for 6 months to track meta-learning accuracy; (3) Randomized experiment data retained for 3 months for causal analysis; (4) Segmented weights retained indefinitely with version history to enable rollback if needed.

**NFR16**: The system SHALL provide learning system observability: (1) Real-time learning health metrics exposed via `/health` endpoint (sample size sufficiency, false positive rate estimate, learning stability indicator); (2) Structured logging for all learning operations with full context (sample sizes, statistical confidence, effect sizes); (3) Weekly automated learning health reports with actionable recommendations (increase sample sizes, adjust learning rates, etc.); (4) Dashboard view dedicated to learning system health with trend visualization and alert status.

---

## User Interface Design Goals

### Overall UX Vision

Antone's primary interface is its social media presence (@antone_vita accounts), but the internal oversight dashboard provides human operators with clear visibility into bot behavior, performance, and decision-making. The dashboard emphasizes **transparency** (why decisions were made), **control** (manual approval/override), and **insight** (KPI trends and learning progress).

### Key Interaction Paradigms

- **Real-time Activity Feed**: Live stream of posts being analyzed with decision scores and selected modes visible
- **One-Click Approval**: Hover over generated reply to see full context, click to approve or edit before posting
- **KPI Dashboard**: Three-column layout (Commercial | Love | Safety) with trend indicators and alert badges
- **Dive-Deep Analysis**: Click any interaction to see full Multi-Signal breakdown, relationship memory context, and outcome metrics

### Core Screens and Views (Master Dashboard)

1. **🎯 Mission Control (Homepage)**: Real-time "heartbeat" with live activity feed, 24hr KPI summary, and active alerts.
2. **🔍 Filtering Funnel Intelligence**: Visual funnel of 200+ keyword strategy (Scanned → Matched → Spam Filtered → Queued) with keyword ROI table.
3. **💰 Revenue Attribution**: Conversion funnel and revenue attribution by reply, archetype, and platform.
4. **👥 Customer Journey**: User lifecycle tracking (New/Engaged/Converted/Loyal), repeat engagement rates, and cohort retention.
5. **📊 Triple Bottom Line KPIs**: Scorecard for all 9 Commercial/Love/Safety KPIs with trend lines and targets.
6. **✍️ Content Quality Insights**: Analysis of optimal reply characteristics (length, tone, emojis) and archetype performance.
7. **🧪 A/B Testing Lab**: Management of active experiments and results archive.
8. **⚙️ System Health**: Real-time status of all components, queue depths, and DeepSeek cost tracking.
9. **🏆 Competitive Intelligence**: Share of voice tracking, competitor mention analysis, defensive positioning performance, and market intelligence insights.
10. **💎 Advocacy & Community Champions**: Community champions leaderboard, DM campaign performance, advocate impact tracking, power user engagement status, and testimonial library.

### Accessibility

None (internal tool for Vita team members)

### Branding

Align with Vita's existing brand guidelines. Dashboard should feel professional and data-driven (healthcare/analytics aesthetic rather than consumer social media) with clean typography and emphasis on readable metrics.

### Target Device and Platforms

Web Responsive (desktop primary, tablet/mobile readable for on-the-go monitoring)

---

## Technical Assumptions

### Repository Structure: Monorepo

Single repository containing:
- `/backend` - Node.js/TypeScript API and worker processes
- `/dashboard` - Next.js frontend for human oversight
- `/shared` - Shared types, utilities, and domain logic
- `/database` - PostgreSQL schema migrations and seeds

**Rationale**: Simplifies dependency management, enables shared types between frontend/backend, and keeps the entire system co-located for a small team.

### Service Architecture

**Architecture**: Self-Hosted Docker Compose Stack (Hybrid: Persistent Workers + HTTP API)

**Infrastructure**: User's PC (i5 6-core, 32GB RAM, 1TB storage) - $0/month

**Components**:
1. **Stream Monitor Worker** (Docker container, persistent process)
   - Polls Twitter/Reddit/Threads APIs with **keyword-based filtering** (Stage 1)
   - Applies lightweight regex pre-screening (Stage 2)
   - Writes relevant posts to PostgreSQL queue
   - Runs 24/7 via Docker Compose restart policy

2. **Decision Engine API** (Docker container, HTTP service)
   - Processes posts from queue (only pre-filtered relevant posts)
   - Executes Multi-Signal Analysis (Stage 3)
   - Calculates Decision Scores and selects modes
   - Generates replies via DeepSeek R1 API
   - Posts to platforms or queues for human approval

3. **Dashboard API** (Next.js on Docker, HTTP service)
   - Serves dashboard frontend
   - Provides REST endpoints for oversight
   - Manages manual approval workflow
   - Accessible via Cloudflare Tunnel (secure remote access)

4. **PostgreSQL Database** (Docker container)
   - Relationship Memory storage
   - Post queue and decision audit logs
   - KPI metrics and historical data
   - Allocated 8-16GB RAM for caching

5. **Cloudflare Tunnel** (secure reverse proxy)
   - Exposes dashboard at https://antone.yourdomain.com
   - No port forwarding required (secure by default)
   - Free tier sufficient

**Rationale**: Self-hosted deployment eliminates infrastructure costs while providing abundant resources (32GB RAM vs Fly.io's 256MB). Docker Compose ensures consistent environments. Cloudflare Tunnel provides secure remote access without exposing home network. Three-stage pre-filtering reduces LLM costs by 93% by only processing relevant posts.

### Testing Requirements

**Testing Strategy**: Unit + Integration + Manual Validation

**Test Levels**:
1. **Unit Tests** (Jest + TypeScript)
   - Decision Engine logic (mode selection, score calculation)
   - Message generation and archetype rotation
   - Safety Protocol filters
   - Pre-filtering logic (Stages 1-2)
   - Target: >80% code coverage

2. **Integration Tests** (Supertest + Test Containers)
   - Platform API integration (mocked Twitter/Reddit/Threads responses)
   - Database interactions (Relationship Memory CRUD)
   - End-to-end post processing pipeline
   - Pre-filtering accuracy validation

3. **Manual Testing** (Local + Staging)
   - Deploy via Docker Compose locally
   - Feed test posts through system
   - Verify correct replies generated
   - Human review of tone, compliance, and archetype variety
   - Validate Cloudflare Tunnel remote access

**Rationale**: Complex decision logic requires strong unit test coverage. Integration tests validate platform APIs without hitting live endpoints. Manual validation ensures qualitative aspects (tone, humor, helpfulness) meet human standards. Self-hosted environment enables rapid iteration.

### Additional Technical Assumptions and Requests

- **Node.js 20.x LTS**: Modern JavaScript features, TypeScript support, active maintenance
- **TypeScript Strict Mode**: Type safety critical for complex decision logic and API contracts
- **Prisma ORM**: Type-safe database layer with migrations for PostgreSQL schema management
- **DeepSeek R1 API**: Cost-efficient reasoning model ($0.55/1M input, $2.19/1M output) for multi-signal analysis and reply generation
- **Platform SDKs**: 
  - `twitter-api-v2` for Twitter/X (Advanced Search API for keyword filtering)
  - `snoowrap` for Reddit (subreddit monitoring with keyword filters)
  - Threads API (official Meta SDK when available, manual HTTP client initially)
- **Zod**: Runtime schema validation for API payloads and configuration
- **Pino**: Structured JSON logging for production observability
- **Docker Compose**: Infrastructure-as-code for local deployment
- **Cloudflare Tunnel** (`cloudflared`): Secure remote access without port forwarding
- **Healthchecks.io**: Free uptime monitoring with email/SMS alerts
- **Backblaze B2**: Cloud backup storage (free 10GB tier) for database exports
- **Environment Variables**: All secrets and configuration via `.env` (local) and Docker secrets (production)
- **Three-Stage Pre-Filtering**:
  1. Platform-native keyword filtering (Twitter Advanced Search, Reddit subreddit filters)
  2. Lightweight regex screening (length, URL density, metaphor detection)
  3. LLM multi-signal analysis (only on relevant posts)

**Migration Path**: Start self-hosted for V1 (Month 1-6), migrate to AWS Lightsail if uptime/reliability becomes critical (Month 7+).

---

## Epic List

### Epic 1: Foundation & Core Infrastructure
**Goal**: Establish project structure, Docker Compose deployment, database schema, platform API authentication, and Reddit karma farming strategy. Deliverable: A deployed bot that can authenticate with Twitter, Reddit, and Threads, with comprehensive monitoring and Reddit community building capabilities.

### Epic 2: Multi-Signal Analysis & Decision Engine
**Goal**: Build the core intelligence layer that analyzes posts across four signal categories, calculates Decision Scores, detects power users, implements temporal intelligence, and monitors competitive mentions. Deliverable: Bot can analyze posts from queue, prioritize power users, optimize timing, detect competitors, select optimal archetypes, and assign modes—without posting yet.

### Epic 3: Message Generation & Engagement
**Goal**: Implement reply generation using eight archetypes (including screenshot-worthy content), platform-specific personalities, competitive defensive positioning, and actual posting capability. Deliverable: Bot generates contextually appropriate, story-worthy replies optimized per platform and posts them (initially in manual approval mode for safety).

### Epic 4: Learning Loop & Optimization
**Goal**: Build feedback collection, KPI tracking, A/B testing framework, community champions identification, autonomous learning mechanisms, and comprehensive 10-view dashboard. Deliverable: Bot monitors reply outcomes, identifies advocates, adjusts strategy weights based on performance, and surfaces insights in master dashboard.

### Epic 5: Production Hardening & Safety
**Goal**: Implement comprehensive safety protocols, monitoring, alerting, human escalation workflows, and compliance verification. Deliverable: Fully autonomous production-ready bot with 24/7 monitoring, auto-moderation, and human oversight controls.

### Epic 6: Competitive Intelligence & Market Positioning
**Goal**: Implement comprehensive competitive intelligence capabilities that monitor competitor mentions, deploy defensive positioning strategies, track market share of voice, and surface product gap insights. Deliverable: Fully integrated competitive monitoring system with automated defensive replies, market intelligence dashboard, and product strategy insights.

---

## Epic 1: Foundation & Core Infrastructure

**Epic Goal**: Build the foundational infrastructure for Antone, including project setup, Docker Compose self-hosted deployment, PostgreSQL database with Relationship Memory schema, authentication with all three platform APIs (Twitter/X, Reddit, Threads), maximum reach keyword filtering (200+ terms with Reddit karma farming strategy), Reddit community building (r/VitaWellness), and comprehensive health check system. This epic establishes the technical foundation upon which all subsequent intelligence and engagement features will be built, with strategic Reddit presence prioritizing existing large subreddits while building owned community long-term.

### Story 1.1: Project Setup & Monorepo Structure

**As a** developer,  
**I want** a well-organized monorepo with TypeScript, linting, and build tooling configured,  
**so that** the codebase is maintainable, type-safe, and ready for multiple team members to contribute.

**Acceptance Criteria:**

1. Project initialized with `pnpm` workspaces for `/backend`, `/dashboard`, and `/shared`
2. TypeScript configured with strict mode and path aliases (@backend/*, @shared/*)
3. ESLint and Prettier configured with consistent rules across all packages
4. `package.json` scripts defined: `dev`, `build`, `test`, `lint`, `typecheck`
5. `.gitignore` configured to exclude `node_modules`, `.env`, build artifacts
6. README.md includes project overview, setup instructions, and architecture diagram
7. All packages build successfully with `pnpm build`

---

### Story 1.2: Docker Compose Infrastructure Setup

**As a** developer,  
**I want** Docker Compose configuration for all services with proper networking and persistence,  
**so that** the application can run reliably on self-hosted infrastructure with consistent environments.

**Acceptance Criteria:**

1. `docker-compose.yml` created in repo root with services: backend-api, backend-worker, dashboard, postgres, redis (optional)
2. Dockerfile created for Node.js services with multi-stage build (development + production)
3. PostgreSQL service configured with persistent volume mount (1TB available)
4. Environment variables defined in `.env.example` (template for `.env`)
5. Health checks configured for all services (restart policy: unless-stopped)
6. Network configuration: Internal network for service communication, exposed ports for dashboard
7. Successful deployment locally with `docker-compose up -d`
8. All services healthy and communicating (postgres accessible from backend)
9. Data persists across container restarts (test with `docker-compose down && docker-compose up`)

---

### Story 1.3: PostgreSQL Database Schema & Migrations

**As a** developer,  
**I want** a PostgreSQL database schema with Prisma ORM and migration system,  
**so that** Relationship Memory, post queue, and audit logs can be persisted reliably.

**Acceptance Criteria:**

1. Prisma initialized with PostgreSQL provider and schema file
2. Database schema defined for core tables:
   - `authors` (id, platform, handle, archetype, relationship_score, history_json)
   - `posts` (id, platform, post_id, content, author_id, detected_at, processed_at)
   - `decisions` (id, post_id, decision_score, mode, signals_json, created_at)
   - `replies` (id, decision_id, content, archetype, posted_at, metrics_json)
3. Migration created with `prisma migrate dev`
4. Seed script created with sample data for development
5. Prisma Client generated and types available via `@shared/db`
6. Database connection tested with simple query in `/health` endpoint
7. All migrations run successfully on staging environment

---

### Story 1.4: Twitter/X API Authentication

**As a** the system,  
**I want** to authenticate with Twitter API v2 using OAuth 2.0,  
**so that** I can monitor tweets and post replies on behalf of @antone_vita account.

**Acceptance Criteria:**

1. Twitter Developer account created and app registered
2. OAuth 2.0 credentials (API Key, API Secret, Bearer Token) stored in Fly secrets
3. `twitter-api-v2` SDK installed and configured
4. Authentication module created at `@backend/platforms/twitter/auth`
5. API client initialized with proper credentials and error handling
6. Test endpoint `/api/twitter/verify` successfully calls Twitter API (verify credentials)
7. Rate limit headers logged for monitoring
8. Authentication errors handled gracefully with retry logic

---

### Story 1.5: Reddit API Authentication

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
8. Rate limiting (60 requests/min) implemented and logged

---

### Story 1.6: Threads API Authentication

**As a** the system,  
**I want** to authenticate with Threads API (or Instagram Graph API as fallback),  
**so that** I can monitor threads and post replies on behalf of @antone_vita account.

**Acceptance Criteria:**

1. Meta Developer account created and Threads API access requested
2. Access token obtained and stored in Fly secrets
3. HTTP client module created at `@backend/platforms/threads/auth` (manual client if SDK unavailable)
4. Authentication module implements token refresh logic
5. Test endpoint `/api/threads/verify` successfully calls Threads API (user profile fetch)
6. Rate limiting (200 requests/hour) implemented
7. Fallback implemented if Threads API unavailable (log warning, continue with X/Reddit)
8. Error responses documented and handled (401 Unauthorized, 429 Rate Limit)

---

### Story 1.7: Stream Monitor Worker with Maximum Reach Filtering & Reddit Karma Strategy

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
   - Remedies: water, hydrate, electrolytes, gatorade, pedialyte, ibuprofen, aspirin, tylenol, advil, coffee, caffeine, banana, vitamin, B12, supplement, "hangover cure", IV, drip
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

6. Polling logic with configurable intervals (5-15 minutes per platform)

7. All filtered posts written to `posts` table with `detected_at`, `platform`, `keyword_matches[]`, and `spam_filtered` boolean

8. Duplicate detection implemented (skip posts already in database by post_id)

9. Worker logs comprehensive metrics:
   - Total posts scanned (Tier 1 keyword match)
   - Posts filtered as spam (Tier 2)
   - Posts queued for DeepSeek analysis
   - Keyword match breakdown (which categories triggered most matches)
   - Platform distribution (Twitter vs Reddit vs Threads)

10. Worker deployed as Docker Compose service with restart policy: unless-stopped

11. Worker runs successfully for 1 hour with production-like volume

12. Logs show detailed funnel metrics:
    ```
    [Stream Monitor] Scan cycle complete:
    - Twitter scanned: 5,000 posts → Keyword match: 850 → Spam filter: 120 → Queued: 730
    - Reddit scanned: 1,200 posts → Keyword match: 280 → Spam filter: 30 → Queued: 250  
    - Threads scanned: 800 posts → Keyword match: 150 → Spam filter: 20 → Queued: 130
    - TOTAL: 7,000 scanned → 1,280 matched → 170 spam → 1,110 queued (84% reduction)
    - Expected weekly volume: ~25,000-30,000 posts queued for DeepSeek analysis
    ```

13. Monitoring dashboard shows:
    - Real-time keyword performance (which keywords finding most posts)
    - Spam filter accuracy (manual review sample of filtered posts)
    - Platform coverage (are we missing posts on any platform?)
    - Volume trends (hourly/daily patterns)

14. Configuration file for keyword taxonomy at `@backend/config/keywords.json`:
    - Structured by category for easy updates
    - Weighted keywords (can adjust importance in future)
    - Version controlled for tracking keyword evolution

15. **Reddit Karma Farming Strategy** (from FR22):
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

### Story 1.8: Health Check & Monitoring Endpoint

**As a** SRE/operator,  
**I want** a comprehensive health check endpoint that validates all system dependencies,  
**so that** I can monitor system status and detect failures quickly.

**Acceptance Criteria:**

1. `/health` endpoint returns JSON with overall status and component checks
2. Database connectivity check (query Prisma Client, return latency)
3. Twitter API check (verify credentials, return auth status)
4. Reddit API check (verify credentials, return auth status)
5. Threads API check (verify credentials, return auth status)
6. Worker status check (last poll timestamp, posts detected count)
7. Overall status: `healthy` (all green), `degraded` (some yellow), `unhealthy` (any red)
8. Endpoint returns 200 if healthy, 503 if unhealthy
9. Response time <500ms for full health check

---

### Story 1.9: Reddit Community Building (r/VitaWellness)

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

## Epic 2: Multi-Signal Analysis & Decision Engine

**Epic Goal**: Implement the core intelligence of Antone by building the Multi-Signal Analysis engine that evaluates posts across four signal categories (Linguistic Intent, Author Context, Post Metrics, Semantic Topic), detects power users (>5k followers), implements temporal intelligence (time-of-day optimization), monitors competitive mentions, calculates Decision Scores, and selects operational modes with formal archetype selection logic. This epic delivers a "thinking" bot that can analyze and score posts, prioritize high-impact users, optimize timing, detect competitive opportunities, and make strategic engagement decisions—without actually posting yet. The decision audit trail in the database provides transparency and supports learning in future epics.

### Story 2.1: Signal 1 - Linguistic Intent Analyzer

**As a** the decision engine,  
**I want** to analyze post text for solution-seeking language patterns,  
**so that** I can calculate a Solution-Seeking Score (SSS) indicating whether the user wants help or is just venting/joking.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/signal-1-linguistic.ts`
2. OpenAI API integration for text classification (GPT-4 or GPT-3.5-turbo)
3. Prompt engineering: Classify text as `high_solution` (0.82-1.0), `moderate` (0.55-0.82), or `low_solution` (0.0-0.55)
4. Examples from project brief used to train prompt (e.g., "What actually works to stop a hangover headache fast?" = high)
5. Function returns SSS score as float between 0.0-1.0
6. Unit tests with 20+ example posts validate score accuracy (>85% match expected categories)
7. Processing time <2 seconds per post (cached results for duplicate text)
8. Errors handled gracefully (API timeout → default to 0.5 moderate score)

---

### Story 2.2: Signal 2 - Author Context Engine

**As a** the decision engine,  
**I want** to retrieve and score author relationship history from database,  
**so that** I can calculate an Author Relationship Score (ARS) reflecting past positive/negative interactions.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/signal-2-author.ts`
2. Function queries `authors` table by platform + handle
3. Archetypes from bio/history parsed (e.g., "healthcare", "comedian", "parent")
4. Positive signals weighted: prior thanks (+0.15), link click (+0.10), purchase (+0.25)
5. Negative signals weighted: block (-0.30), report (-0.40), hostile reply (-0.20)
6. Base ARS for unknown authors: 0.50 (neutral)
7. Function returns ARS score between 0.0-1.0
8. Unit tests validate scoring logic with mock author data
9. New authors created in `authors` table if not exists

---

### Story 2.3: Signal 3 - Post Metrics & Velocity Calculator

**As a** the decision engine,  
**I want** to analyze post engagement metrics relative to author baseline,  
**so that** I can calculate an Engagement Velocity Score (EVS) distinguishing private pleas from viral performances.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/signal-3-velocity.ts`
2. Post metrics fetched from platform APIs (likes, replies, retweets/reposts)
3. Author baseline calculated from recent post history (average likes/hour, reply ratio)
4. Velocity score = (current engagement rate) / (baseline rate)
5. EVS categories: silent plea (<1.0×), normal (1.0-2.0×), moderate (2.0-5.0×), viral (>5.0×)
6. Temporal context considered (post age, time of day, day of week)
7. Function returns EVS as float (ratio value, e.g., 0.5 or 8.3)
8. Unit tests with mock post data validate velocity calculation
9. Missing baseline (new author) defaults to EVS = 1.0

---

### Story 2.4: Signal 4 - Semantic Topic Filter

**As a** the decision engine,  
**I want** to filter out posts using hangover keywords metaphorically (movies, memes, work stress),  
**so that** I disengage from irrelevant contexts and avoid embarrassing misinterpretations.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/signal-4-semantic.ts`
2. OpenAI API used to classify true topic (e.g., "Movie Marathon", "Work Stress", "Actual Hangover")
3. Examples from project brief incorporated (e.g., "John Wick movie hangover" → "Movie Marathon" → disengage)
4. Topic Relevance Score (TRS) returned: 1.0 (actual hangover), 0.0 (metaphor/unrelated)
5. Named Entity Recognition (NER) detects movie/song titles (capitalized phrases)
6. Metaphor patterns detected: "inbox hangover", "crypto hangover", "meeting nausea"
7. Function executes in <2 seconds (parallel with Signal 1 if possible)
8. Unit tests with 30+ metaphor examples achieve >90% accuracy
9. Ambiguous cases (0.4-0.6) logged for human review

---

### Story 2.5: Decision Score Calculation & Mode Selection

**As a** the decision engine,  
**I want** to combine all four signal scores into a composite Decision Score and select operational mode,  
**so that** the bot chooses the appropriate engagement strategy (Helpful/Engagement/Hybrid/Disengaged).

**Acceptance Criteria:**

1. Module created at `@backend/analysis/decision-engine.ts`
2. Composite Decision Score calculation:
   - If TRS < 0.5 → Disengage (metaphor/unrelated topic)
   - Else: Weighted average (SSS×40% + ARS×25% + EVS_normalized×20% + TRS×15%)
3. Mode selection logic implemented per project brief decision stack:
   - SSS ≥ 0.82 → **Helpful Mode** (mandatory)
   - 0.55 ≤ SSS < 0.82 AND EVS > 5.0× → **Engagement Mode** (unless ARS > 0.70 → **Hybrid**)
   - SSS < 0.55 → **Engagement Mode** or **Disengaged** (no hard pitch)
   - Any safety flag → **Disengaged Mode**
4. Decision object created with all scores, selected mode, and timestamp
5. Decision written to `decisions` table with foreign key to `posts`
6. Unit tests validate mode selection for 50+ scenario combinations
7. Integration test: Process sample post from queue → store decision in database
8. Dashboard query endpoint `/api/decisions` returns recent decisions with scores

---

### Story 2.6: Primary Safety Protocol

**As a** the decision engine,  
**I want** to detect sensitive topics and immediately force Disengaged Mode,  
**so that** the bot never engages with posts about death, addiction recovery, medical emergencies, or minors.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/safety-protocol.ts`
2. Keyword detection for sensitive topics:
   - Death/harm: "suicide", "kill myself", "die", "funeral"
   - Addiction: "AA meeting", "recovery", "relapse", "sober"
   - Medical: "ER", "hospital", "chest pain", "seizure"
   - Minors: "high school", "college freshman", "underage"
   - Pregnancy: "pregnant", "breastfeeding"
3. Distress Probability calculation using OpenAI sentiment + author history
4. Safety flags added to decision object: `safety_flags: ["death_mention"]`
5. Any safety flag present → Mode forced to **Disengaged**, override all other signals
6. Decision logged with safety_reason for audit
7. Unit tests with 40+ sensitive examples trigger disengage (100% accuracy required)
8. False positives (hyperbole) logged for refinement but still disengage (conservative default)

---

### Story 2.7: Post Queue Processor Service

**As a** the system,  
**I want** a service that continuously processes unprocessed posts from the queue,  
**so that** posts detected by the Stream Monitor are analyzed and decisions are made asynchronously.

**Acceptance Criteria:**

1. Service created at `@backend/services/queue-processor.ts`
2. Service runs on interval (every 30 seconds) querying `posts` WHERE `processed_at IS NULL`
3. For each post:
   - Execute all 4 signals in parallel (Promise.all for speed)
   - Run Safety Protocol check
   - Calculate Decision Score and select mode
   - Write decision to `decisions` table
   - Update post with `processed_at` timestamp
4. Error handling: Failed posts marked with `error_message`, reprocessed up to 3 times
5. Service logs throughput metrics (posts processed per minute)
6. Integration test: Seed queue with 10 posts, verify all processed within 1 minute
7. Service deployed as Docker Compose persistent service with restart policy
8. Dashboard shows queue depth metric (unprocessed posts count)

---

### Story 2.8: Decision Audit & Logging

**As a** product manager,  
**I want** complete audit trails of all decisions with signal breakdowns,  
**so that** I can analyze bot behavior, debug incorrect decisions, and support learning improvements.

**Acceptance Criteria:**

1. All decisions stored in `decisions` table with JSON columns for signal details:
   - `signals_json`: {sss: 0.87, ars: 0.45, evs: 2.3, trs: 0.92}
   - `mode`: "helpful" | "engagement" | "hybrid" | "disengaged"
   - `safety_flags`: ["none"] or ["death_mention"]
2. Structured logging (Pino) for all decision steps with request ID tracing
3. Log levels: INFO (decision made), WARN (safety trigger), ERROR (processing failure)
4. Dashboard endpoint `/api/decisions/:id` returns full decision detail including post text
5. Decision retention: 90 days in database, then archived to volume storage
6. Searchable by platform, mode, date range, author
7. Sample queries: "Show all decisions with SSS > 0.9 that selected Disengaged mode" (for debugging)

---

### Story 2.9: Temporal Intelligence Engine

**As a** the decision engine,  
**I want** to adjust monitoring intensity and engagement strategies based on time-of-day and calendar patterns,  
**so that** Anton engages users during peak need windows and maximizes response effectiveness.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/temporal-intelligence.ts`
2. **Peak Suffering Window Detection**:
   - Sunday 6-11am: 3× monitoring frequency (poll every 5 min vs 15 min)
   - Saturday-Sunday mornings: Priority queue processing (process these posts first)
3. **Thursday Prevention Campaign**:
   - Thursday 5-9pm: Proactive search for "weekend plans", "going out tonight" posts
   - Deploy prevention-focused archetypes: "Weekend coming up? Here's science-backed prevention..."
   - Lower SSS threshold (0.40 instead of 0.55) for prevention content
4. **Holiday Targeting Calendar**:
   - Pre-configured dates: New Year's Day, St. Patrick's Day, July 4th, Thanksgiving Eve, Halloween
   - 2 days before holiday: Prevention content boosted
   - Holiday morning: Maximum monitoring (5× normal frequency)
5. **Time-of-Day Archetype Adjustment**:
   - Late night (10pm-2am): More empathetic, less promotional tone
   - Morning (6-11am): More urgent, actionable advice (Checklist, Coach)
   - Afternoon (2-6pm): Reflective, educational content (Credibility-anchor)
6. Temporal context stored in decision JSON: `{temporal_context: "sunday_peak", monitoring_multiplier: 3.0}`
7. Dashboard shows temporal performance: CTR by hour-of-day, day-of-week heatmap
8. Unit tests validate time-based adjustments trigger correctly
9. Configuration file for holiday calendar at `@backend/config/temporal-calendar.json`

---

### Story 2.10: Archetype Selection Engine

**As a** the decision engine,  
**I want** a formalized archetype selection algorithm based on mode, author context, and post content,  
**so that** archetypes are chosen systematically rather than randomly, optimizing for engagement.

**Acceptance Criteria:**

1. Module created at `@backend/generation/archetype-selector.ts`
2. **Mode-Based Archetype Pool** defined:
   - **Helpful Mode** → Checklist, Coach, Credibility-anchor, Confident Recommender, Problem-Solution Direct
   - **Engagement Mode** → Humor-light, Storylet (no product mention)
   - **Hybrid Mode** → Myth-bust, Storylet, Coach, Confident Recommender (soft mention)
3. **Author Context Refinement**:
   - Healthcare professional detected → Credibility-anchor preferred (2× weight)
   - Parent/Family → Coach or Storylet
   - Young adult/Student (age <25 inferred) → Humor-light, Storylet
   - Comedian/Creative (bio contains "comedian", "artist") → Humor-light
4. **Content Triggers** (override priority):
   - Post contains misinformation → **Myth-bust** (mandatory)
   - Post asks "does X work?" → **Credibility-anchor** or **Problem-Solution Direct**
   - Post expresses desperation ("help", "desperate") → **Checklist** or **Coach**
   - Post is joking/venting (no question marks) → **Humor-light** or **Storylet**
5. **Rotation Enforcement**:
   - Track last 10 archetypes used globally
   - Never repeat same archetype within 10 consecutive replies
   - Exception: Myth-bust can interrupt rotation anytime
6. **Power User Override** (from FR21):
   - Users with >5k followers → Use ONLY top 3 performing archetypes (based on Love + Commercial KPI data)
   - Verified badges → Prefer **Confident Recommender** or **Credibility-anchor** (authoritative tone)
7. Function returns: `{archetype: "Checklist", reason: "Helpful mode + desperation detected", confidence: 0.92}`
8. Archetype performance tracked per decision for learning loop (Epic 4)
9. Unit tests validate selection logic for 30+ scenario combinations
10. Dashboard shows archetype distribution and performance comparison

---

### Story 2.11: Power User Detection & Prioritization

**As a** the decision engine,  
**I want** to detect high-impact power users and apply premium engagement strategies,  
**so that** Anton maximizes brand amplification through influencer-scale audiences.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/power-user-detector.ts`
2. **Power User Criteria** (any of these qualify):
   - Follower count >5,000 on any platform
   - Verified badge (Twitter Blue checkmark, Reddit trophy, Threads verified)
   - Engagement rate >3% (likes per post / followers)
   - Creator/Influencer in bio keywords ("influencer", "creator", "brand ambassador")
3. Power user flag added to `authors` table: `is_power_user: boolean`, `power_tier: "micro" | "macro" | "mega"`
4. **Tier Classification**:
   - Micro: 5k-50k followers
   - Macro: 50k-500k followers
   - Mega: >500k followers
5. **Premium Engagement Protocol** (from FR21):
   - Response time target: <30 minutes (vs 90 min standard)
   - Priority queue: Power user posts processed first
   - Archetype restriction: Top 3 performing only (tracked in Story 4.8)
   - Follow-up engagement: Like their next 2 posts within 24 hours
   - Gift outreach trigger: After 1 positive interaction, send DM: "We'd love to send you samples—DM us your address"
6. Power user interactions logged separately for ROI analysis
7. Dashboard alert: "Power User Detected: @username (52k followers) - Post queued for premium response"
8. Manual override: PM can mark specific users as power users regardless of metrics
9. Unit tests validate detection criteria and prioritization logic
10. Integration test: Simulate power user post, verify <30 min response time

---

### Story 2.12: Competitive Intelligence Detector

**As a** the decision engine,  
**I want** to detect mentions of competing products in posts and trigger defensive positioning strategies,  
**so that** Anton educates users about Vita's unique value proposition when competitors are discussed.

**Acceptance Criteria:**

1. Module created at `@backend/analysis/competitive-detector.ts`
2. **Competitor Product Library** at `@backend/data/competitors.json`:
   - Rehydration brands: LiquidIV, Drip Drop, Pedialyte, Gatorade, Nuun
   - Hangover pills: ZBiotics, Flyby, AfterDrink, Cheers, DHM Detox
   - IV therapy: The I.V. Doc, Revive, HydroMed
   - Home remedies tracked: "hair of the dog", activated charcoal, pickle juice
3. Competitor detection in post text using fuzzy matching (handles typos, variations)
4. **Competitive Context Analysis**:
   - Positive mention: "LiquidIV works great for me" → Soft positioning
   - Question: "Does Drip Drop actually work?" → Educational comparison
   - Negative mention: "ZBiotics didn't help" → Strong positioning opportunity
5. **Defensive Positioning Strategy** (from FR24):
   - Tone: Polite, educational (never attack competitors)
   - Message template: "Those work via [mechanism]; Vita uses transdermal delivery which bypasses your upset stomach and doesn't require water when you're nauseous."
   - Differentiation focus: Transdermal vs oral, convenience, science-backed
6. Competitive posts flagged in decision: `{competitor_detected: "LiquidIV", positioning_opportunity: "high"}`
7. Mode adjustment: Competitive posts trigger **Hybrid** or **Helpful** mode (never pure Engagement)
8. Preferred archetype: **Problem-Solution Direct** or **Credibility-anchor**
9. Rate limiting: Max 5 competitive replies per day per competitor (avoid appearing obsessive)
10. Dashboard tracking: Competitor share of voice, Vita mention rate, competitive conversion opportunities
11. Unit tests validate competitor detection across 50+ mention variations
12. Market intelligence logged: Which competitors are most discussed? What complaints do users have?

---

## Epic 3: Message Generation & Engagement

**Epic Goal**: Implement the message generation system that creates contextually appropriate, screenshot-worthy replies using eight rotating archetypes (including Confident Recommender and Problem-Solution Direct), ensures compliance with Claims Library, adapts personality per platform (Twitter witty, Reddit detailed, Threads casual), implements competitive defensive positioning, integrates dynamic social proof signatures, and posts replies to Twitter/X, Reddit, and Threads. This epic also implements the Self-Correction Mechanism for autonomous post deletion and the manual approval dashboard for human-in-the-loop oversight during the learning phase. Deliverable: Bot generates high-quality, story-worthy, compliant replies optimized per platform and posts them to social platforms (initially requiring manual approval before posting).

### Story 3.1: Claims Library & Compliance Engine

**As a** legal/compliance officer,  
**I want** a centralized Claims Library with approved phrasing and prohibited terms,  
**so that** all bot-generated messages comply with regulatory requirements and avoid medical claims.

**Acceptance Criteria:**

1. Claims Library JSON file created at `@backend/data/claims-library.json`
2. Library structure defined:
   - `approved_phrases`: Array of pre-approved scientific statements
   - `prohibited_terms`: Array of banned words ("prevent", "cure", "treat", "clinically proven")
   - `soft_benefits`: Array of compliant positioning statements ("designed to support", "formulated to")
3. Compliance validation function at `@backend/compliance/validator.ts`
4. Function checks generated messages against prohibited terms (hard block)
5. Function validates scientific claims match approved phrases (fuzzy matching allowed)
6. Non-compliant messages rejected with specific violation logged
7. Unit tests with 50+ examples validate compliance rules
8. Dashboard endpoint `/api/compliance/library` allows viewing/editing Claims Library
9. All changes to Claims Library require legal team approval (manual workflow documented)

---

### Story 3.2: Message Archetype Templates

**As a** content creator,  
**I want** eight distinct message archetypes with multiple variants each, including screenshot-worthy content,  
**so that** replies feel human, varied, and naturally shareable rather than templated spam.

**Acceptance Criteria:**

1. Message templates defined at `@backend/data/message-archetypes.json`
2. **Eight archetypes implemented**:
   - **Checklist**: 2-3 actionable steps, zero jargon
   - **Myth-bust**: One misconception corrected gently, non-scolding
   - **Coach**: "If you have 10 minutes: do X; if 30: add Y"
   - **Storylet**: 20-30 word relatable scenario + tip
   - **Humor-light**: Kind, never snarky ("Your future self asked me to send water")
   - **Credibility-anchor**: "Here's the simple mechanism..." (no over-claiming, includes testimonials from FR20)
   - **Confident Recommender** (NEW): First-person advocacy ("I keep Vita patches in my bag for exactly this. They're transdermal so they work when your stomach can't handle pills. Worth trying: [link]")
   - **Problem-Solution Direct** (NEW): Educational + assertive ("Hangover = dehydration + vitamin depletion. Vita patches deliver both through your skin. Worked for me and 10k+ others: [link]")
3. Each archetype has 8-12 variants for variety
4. **Screenshot-Worthy Design Principles** (Story-worthy content from FR19):
   - Memorable opening hooks ("Your liver is basically a bouncer dealing with way too many guests right now")
   - Quotable one-liners ("Hangovers are just your body sending you an invoice for last night")
   - Visual structure: Line breaks, emojis (used sparingly), numbered lists
   - Shareable wisdom: "Save this for your next morning-after" positioning
5. Templates use placeholder syntax: `{{empathy_opener}}`, `{{practical_tip}}`, `{{product_mention}}`, `{{cta}}`, `{{testimonial}}`
6. Platform-specific versions: short (X/Threads ≤320 chars), full (Reddit ≤500 chars)
7. Archetype rotation enforced: No same archetype used twice in 10 consecutive replies (managed by Story 2.10)
8. Template selection considers author archetype (e.g., "healthcare" → credibility-anchor preferred)
9. **Social Proof Integration** (FR20):
   - Dynamic signature: "—Antone (Vita) | Helped {{post_count}} people feel better this month"
   - Testimonial rotation in Credibility-anchor: Real user quotes (pre-approved)
10. Unit tests validate all templates render without placeholder errors

---

### Story 3.3: Reply Generator with DeepSeek Integration

**As a** the system,  
**I want** to generate contextually appropriate, screenshot-worthy replies by combining archetypes with DeepSeek-powered customization,  
**so that** each message feels personalized, naturally shareable, and compliant.

**Acceptance Criteria:**

1. Reply generator created at `@backend/generation/reply-generator.ts`
2. Function accepts: decision object, post content, author data, selected archetype, power_user flag, temporal_context
3. **DeepSeek R1 API integration** for content generation:
   - Prompt engineering: "Generate a [archetype] reply that is screenshot-worthy and shareable..."
   - Empathy opener customized to post sentiment and time-of-day
   - Practical tips relevant to specific symptoms mentioned
   - Product mention adjusted for mode (Helpful: detailed with link, Hybrid: casual mention, Engagement: none)
4. **Story-Worthy Content Enhancement** (from FR19):
   - Memorable hooks: "Your liver is basically..." style openers
   - Quotable wisdom: One-liner gems users want to share
   - Visual structure: Strategic line breaks, emojis (1-2 max), bullet points
   - Shareable positioning: "Save this for next time" framing
5. **Dynamic Social Proof** (FR20):
   - Fetch current help count from database: `SELECT COUNT(*) FROM replies WHERE posted_at > NOW() - INTERVAL '30 days'`
   - Signature format: "—Antone (Vita)
   - Testimonial injection for Credibility-anchor: Rotate approved user quotes
6. **Confident Product Positioning** (FR17 update):
   - Assertive CTAs: "Worth trying: [link]" vs old "If you're curious..."
   - First-person advocacy: "I keep Vita patches in my bag for exactly this"
   - Benefit-driven: "They're transdermal so they work when your stomach can't handle pills"
7. Compliance validation run on generated reply (reject if prohibited terms detected)
8. Platform formatting applied: Character limits enforced (X/Threads ≤320, Reddit ≤500)
9. **Power User Special Handling** (FR21):
   - Power users get extra polish: Second DeepSeek pass for refinement
   - Tone adjustment: More professional, less casual
   - Priority archetypes only (top 3 performers)
10. Reply written to `replies` table with: decision_id, content, archetype, generated_at, is_power_user, help_count_at_generation
11. Processing time <3 seconds per reply (DeepSeek + compliance check)
12. Self-confidence scoring: DeepSeek returns confidence (0-1); <0.85 triggers human review queue
13. Integration test: Generate 20 replies from test decisions, verify variety, compliance, and shareability
14. Generated replies surface in dashboard for manual review with "Shareability Score" indicator

---

### Story 3.4: Platform Posting Service - Twitter/X

**As a** the system,  
**I want** to post approved replies to Twitter/X using API v2,  
**so that** @antone_vita can engage with users on Twitter.

**Acceptance Criteria:**

1. Twitter posting service created at `@backend/platforms/twitter/poster.ts`
2. Function accepts reply ID and posts content as reply to original tweet
3. Rate limiting enforced (300 posts per 15 minutes)
4. Error handling for API failures (thread locked, user blocked us, tweet deleted)
5. Posted reply metadata captured: tweet_id, posted_at, initial_metrics (0 likes/replies)
6. Reply status updated in database: `posted_at` timestamp, `platform_post_id`
7. Posting failures logged with reason and retried up to 2 times
8. Integration test (staging): Post test reply to controlled test tweet, verify success
9. Manual approval required before posting (approval workflow in Story 3.6)

---

### Story 3.5: Platform Posting Service - Reddit & Threads

**As a** the system,  
**I want** to post approved replies to Reddit and Threads,  
**so that** u/antone_vita and @antone_vita can engage across all target platforms.

**Acceptance Criteria:**

1. Reddit posting service at `@backend/platforms/reddit/poster.ts`:
   - Post comment as reply to submission or comment
   - Rate limiting (60 requests per minute)
   - Subreddit-specific rules enforced (no links if restricted)
   - Error handling (removed by automod, user deleted post)
2. Threads posting service at `@backend/platforms/threads/poster.ts`:
   - Post reply via Threads API (or fallback HTTP client)
   - Rate limiting (200 requests per hour)
   - Character limit enforcement (500 chars)
   - Error handling (user blocked, thread unavailable)
3. Both services update `replies` table with platform-specific post IDs
4. Posted replies logged with initial metrics (karma, hearts)
5. Integration tests post to staging accounts, verify visibility
6. Platform failures degrade gracefully (log error, don't crash system)

---

### Story 3.6: Manual Approval Dashboard Integration

**As a** human operator,  
**I want** a streamlined approval interface integrated into the Master Dashboard,  
**so that** I can efficiently review, edit, and approve replies while seeing their predicted impact.

**Acceptance Criteria:**

1. **Approval Queue Widget** integrated into Mission Control (View 1)
   - Shows pending count badge
   - Quick-preview of top 3 pending replies
2. **Dedicated Review View** at `/dashboard/approvals`
   - Split screen: Post context (left) vs Generated reply (right)
   - "Why this reply?" explanation box (DeepSeek reasoning)
   - Predicted KPI impact (e.g., "Predicted CTR: 2.4%")
3. **Action Interface**:
   - **Approve**: One-click publish
   - **Edit**: Inline text editor with character count
   - **Reject**: Dropdown for reason (Safety, Irrelevant, Low Quality)
   - **Regenerate**: Request new draft with specific instruction
4. **Bulk Actions**: "Approve all high-confidence (>90%)" button
5. **Mobile-friendly** review mode for on-the-go approvals
6. **Audit Trail**: All human edits logged to improve future generation
7. **Safety Warnings**: Highlight specific phrases that triggered safety flags
8. **Real-time status**: Updates immediately when another operator approves a reply

---

### Story 3.7: Self-Correction Mechanism

**As a** the system,  
**I want** to autonomously delete my own posts that receive severe negative backlash,  
**so that** I can minimize reputation damage from mistakes without human intervention.

**Acceptance Criteria:**

1. Self-correction service at `@backend/services/self-correction.ts`
2. Service monitors posted replies every 15 minutes for sentiment/backlash
3. Negative signals collected:
   - Sentiment analysis of text responses (target: <-0.75)
   - Report/removal events from platform APIs
   - Trusted user flags (verified users, moderators)
4. Deletion triggers (ALL must be met):
   - Sentiment <-0.75 across ≥30 unique replies OR mod warning
   - Negativity Velocity >3× baseline average
   - At least one trusted signal flag
   - No "override" tag (for Controlled Assertiveness posts)
5. If triggered: Delete post via platform API, log incident, flag for human review
6. Escalation: Severe backlash (>100 negative replies) triggers immediate alert
7. Unit tests validate deletion logic doesn't trigger on minor negative feedback
8. Integration test: Simulate backlash scenario, verify deletion occurs
9. Self-deletion rate tracked in Safety KPIs (<2% target)

---

### Story 3.8: Relationship Memory Updates

**As a** the system,  
**I want** to update author relationship scores based on post-reply outcomes,  
**so that** future interactions benefit from learned preferences and history.

**Acceptance Criteria:**

1. Relationship update service at `@backend/services/relationship-updater.ts`
2. Service runs hourly, processes posted replies with outcome data
3. Positive signals update author score:
   - "Thanks" in text response: +0.15
   - Like/upvote on reply: +0.05
   - Link click (UTM tracking): +0.10
   - Purchase attributed: +0.25
4. Negative signals update author score:
   - Block/mute: -0.30
   - Report: -0.40
   - Hostile text response: -0.20
5. Author archetypes updated based on new bio/post data
6. `authors` table `history_json` column stores interaction timeline
7. Relationship scores capped at 0.0-1.0 range
8. Unit tests validate score updates for various outcome scenarios
9. Dashboard shows author relationship score trends over time

---

### Story 3.9: Controlled Assertiveness Protocol

**As a** the system,  
**I want** to politely correct misinformation when detected,  
**so that** I provide factual education without appearing argumentative.

**Acceptance Criteria:**

1. Misinformation detection at `@backend/analysis/misinformation-detector.ts`
2. Common myths cataloged: "hair of the dog", "greasy food cures", unproven remedies
3. Detection uses DeepSeek to classify if post contains misinformation
4. If myth detected AND SSS ≥0.55: Generate Myth-bust archetype reply
5. Circuit-breaker rules enforced:
   - Max 2 replies per thread (no extended arguments)
   - Exit on escalation keywords ("bot", "shill", "scam", profanity)
   - Third-party hostility triggers immediate disengage
6. Assertive replies tagged with "override" flag (prevents self-deletion on minor pushback)
7. Factual claims sourced from Claims Library with citation links
8. Unit tests validate myth detection accuracy (>85% precision)
9. Manual review queue flags all Controlled Assertiveness posts for human oversight

---

### Story 3.10: Platform-Specific Personality Adaptation

**As a** the system,  
**I want** to adapt Anton's personality, tone, and success metrics based on each platform's unique culture,  
**so that** engagement feels native to Twitter/X, Reddit, and Threads rather than one-size-fits-all.

**Acceptance Criteria:**

1. Platform personality module created at `@backend/generation/platform-personality.ts`
2. **Twitter/X Personality**:
   - Tone: Witty, fast-paced, conversational
   - Format: Tight writing (≤280 chars ideal), strategic line breaks
   - Engagement strategy: Reply to original post + 2-3 follow-up replies in thread conversation
   - Quote tweets: For viral posts (EVS >5.0×), quote tweet with educational value
   - Emojis: Moderate use (1-2 per reply)
   - Thread participation: If OP responds, continue conversation (max 3 total replies)
   - Success metrics: Likes, quote tweets, follower growth
3. **Reddit Personality**:
   - Tone: Detailed, helpful, academic-casual hybrid
   - Format: Longer posts (300-500 chars), bullet points, bold headers
   - Engagement strategy: In-depth first reply + follow-up if asked questions
   - Karma building: Upvote quality responses, participate in discussions
   - Subreddit awareness: Adapt to sub rules (no links in r/stopdrinking, formal in r/AskDocs)
   - Comment depth: Willing to reply to reply threads (not just top-level)
   - Success metrics: Upvotes, comment karma, "helpful" replies
4. **Threads Personality**:
   - Tone: Warm, casual, Instagram-adjacent (more personal)
   - Format: Short-medium (200-320 chars), visual appeal
   - Visual strategy: Leverage Instagram crossover → suggest infographics in future
   - Emojis: More liberal use (2-3 per reply, align with Instagram culture)
   - Hashtag integration: Use 1-2 relevant hashtags (#hangoverhelp #wellnesstips)
   - Engagement strategy: Single helpful reply, like original post
   - Success metrics: Hearts, shares to Stories, DM conversations
5. **Platform-Specific Archetype Preferences**:
   - Twitter: Humor-light, Storylet, Confident Recommender (fast, punchy)
   - Reddit: Credibility-anchor, Problem-Solution Direct, Coach (detailed, educational)
   - Threads: Storylet, Humor-light, Confident Recommender (relatable, visual)
6. Platform context passed to reply generator: `{platform: "twitter", personality_mode: "witty_fast"}`
7. Dashboard tracks performance by platform: Compare CTR, sentiment, engagement by platform
8. Unit tests validate platform-specific formatting and tone adjustments
9. Integration test: Generate same decision on all 3 platforms, verify distinct personalities

---

### Story 3.11: Competitive Defensive Positioning Replies

**As a** the system,  
**I want** to generate polite, educational replies when competitors are mentioned,  
**so that** Anton positions Vita's unique value without attacking competitors.

**Acceptance Criteria:**

1. Competitive reply generator at `@backend/generation/competitive-replies.ts`
2. Function triggered when Story 2.12 detects competitor mention
3. **Positioning Message Templates** (from FR24):
   - **vs. Rehydration products** (LiquidIV, Drip Drop, Pedialyte):
     "Those work via rehydration; Vita uses transdermal delivery which bypasses your upset stomach and doesn't require water when you're nauseous. Different mechanisms: [link to science explainer]"
   - **vs. Hangover pills** (ZBiotics, Flyby):
     "Pills can be tough when your stomach's already upset. Vita patches deliver through your skin, so nothing to swallow or digest. Worth comparing: [link]"
   - **vs. IV therapy** (The I.V. Doc):
     "IV therapy works but requires an appointment and costs $100-200. Vita patches deliver similar nutrients transdermally for a fraction of the cost, right when you need it. [link]"
   - **vs. Home remedies** ("hair of the dog", pickle juice):
     "Traditional remedies have anecdotal support but limited science. Vita patches deliver research-backed ingredients (B-vitamins, glutathione precursors) through your skin. Here's the science: [link]"
4. **Tone Guidelines**:
   - Never say: "X doesn't work" or "X is bad"
   - Always say: "X works via [mechanism]; Vita uses [different mechanism]"
   - Educational, not combative: "Different approaches for different needs"
   - Acknowledge competitor strengths: "Those are popular for good reason, and here's how Vita is different..."
5. **Rate Limiting** (from Story 2.12):
   - Max 5 competitive replies per day per competitor
   - Never reply to same competitor thread multiple times
   - If >3 competitive mentions in one day, alert PM: "High competitive activity detected"
6. **Archetype Selection**:
   - Preferred: Problem-Solution Direct, Credibility-anchor
   - Avoid: Humor-light, Storylet (stay educational)
7. Competitive replies tagged: `{reply_type: "competitive_positioning", competitor: "LiquidIV"}`
8. Dashboard tracking: Competitive conversion rate, share of voice shifts
9. Unit tests validate polite tone and factual accuracy (no claims violations)
10. Integration test: Simulate competitor mention, verify positioning reply generated

---

## Epic 4: Learning Loop & Optimization

**Epic Goal**: Build the autonomous learning system that tracks Commercial, Love, and Safety KPIs, identifies Community Champions (3+ positive engagements), collects feedback from reply outcomes, implements A/B testing framework for message variants, and surfaces actionable insights in a comprehensive 10-view master dashboard (including Competitive Intelligence and Advocacy views). This epic enables Antone to learn from every interaction, build advocate relationships, and continuously optimize its strategies within safety guardrails. Deliverable: Bot monitors performance metrics, runs controlled experiments, identifies and engages brand advocates, and adjusts strategy weights based on data—with full transparency for human oversight via master dashboard.

### Story 4.1: Commercial KPI Tracking

**As a** product manager,  
**I want** to track Commercial KPIs (CTR, conversions, revenue) for all posted replies,  
**so that** I can measure the bot's commercial effectiveness and ROI.

**Acceptance Criteria:**

1. KPI tracking service at `@backend/analytics/commercial-kpis.ts`
2. UTM-tagged links generated for all product mentions: `?utm_source=antone&utm_campaign={platform}&utm_content={reply_id}`
3. Google Analytics integration to track:
   - Reply-level CTR (clicks per reply)
   - Landing page dwell time (session duration)
   - Add-to-cart events
   - Conversion events (purchases)
4. E-commerce platform webhook integration (Shopify/WooCommerce) for transaction data
5. Revenue attribution: Link transactions to reply_id via UTM parameters (7-day window)
6. KPIs calculated and stored in `kpi_metrics` table daily
7. Dashboard displays: CTR trends, conversion funnel, revenue per reply, top-performing replies
8. Target thresholds flagged: CTR <2%, conversion <8%, RPR <$0.50 trigger alerts
9. Integration test: Simulate click-through and purchase, verify attribution

---

### Story 4.2: Love KPI Tracking

**As a** product manager,  
**I want** to track Love KPIs (thanks, likes, follows, sentiment) for all interactions,  
**so that** I can ensure the bot builds a trusted, beloved brand personality.

**Acceptance Criteria:**

1. Love KPI service at `@backend/analytics/love-kpis.ts`
2. Platform APIs polled hourly for reply engagement data:
   - Likes, hearts, upvotes per reply
   - Text responses analyzed for "thanks", "helpful", positive sentiment
   - New followers correlated to reply timestamps
3. Sentiment analysis using OpenAI: Classify responses as positive (>0.6), neutral (0.4-0.6), negative (<0.4)
4. Leading indicators tracked (first 60 minutes post-reply):
   - Positive React Velocity (>60% positive reactions)
   - OP Response Latency (<20 min)
   - Quote-to-Like Ratio (>0.4 positive quotes)
5. Love KPIs calculated: Thanks/Likes %, Follows per 100 replies, Positive sentiment %
6. Dashboard displays: Sentiment trends, most-loved replies, follower growth
7. Target thresholds flagged: Thanks/Likes <12%, Sentiment <75%, Follows <3 per 100
8. Creator reposts manually logged (auto-detection future enhancement)
9. Integration test: Simulate positive engagement, verify KPI updates

---

### Story 4.3: Safety KPI Tracking

**As a** compliance officer,  
**I want** to track Safety KPIs (removals, reports, strikes) across all platforms,  
**so that** I can detect reputation risks early and maintain platform compliance.

**Acceptance Criteria:**

1. Safety KPI service at `@backend/analytics/safety-kpis.ts`
2. Platform APIs monitored for negative signals:
   - Reddit: Comment removals, downvote ratios, mod warnings
   - Twitter: Reports, restricted reach indicators
   - Threads: Content violations, reduced distribution
3. Community baseline calculated: Average removal/report rate for each subreddit/topic
4. Antone's removal rate compared to baseline (target: <1.0× baseline)
5. Reddit karma trajectory tracked (target: +50/month)
6. Platform strikes logged with severity (warning, restriction, suspension)
7. Self-deletion events tracked (target: <2% of product-mention replies)
8. Dashboard displays: Safety alerts, removal trends, karma graph, strike history
9. Critical alerts: ANY platform strike triggers immediate notification
10. Integration test: Simulate removal event, verify alert triggered

---

### Story 4.4: Feedback Collection Pipeline

**As a** the learning system,  
**I want** to collect comprehensive outcome data for every posted reply,  
**so that** I can correlate decisions, messages, and results for learning.

**Acceptance Criteria:**

1. Feedback collector at `@backend/analytics/feedback-collector.ts`
2. Service runs every 30 minutes, enriches `replies` table with outcome data:
   - Platform metrics (likes, replies, shares)
   - Sentiment analysis results
   - Commercial outcomes (clicks, conversions)
   - Safety signals (removals, reports)
3. Timeline data captured: 15min, 60min, 24hr, 7day windows
4. Feedback stored in `replies.metrics_json` for historical analysis
5. Data schema: `{likes: 12, sentiment: 0.82, ctr: 0.03, removed: false}`
6. Correlation table created: Links decision scores → message archetype → outcomes
7. Missing data handled gracefully (platform API failures don't block collection)
8. Dashboard query endpoint `/api/feedback/{reply_id}` returns full timeline
9. Integration test: Post reply, collect feedback after 30min, verify data complete

---

### Story 4.5: A/B Testing Framework

**As a** the learning system,  
**I want** to run controlled A/B tests on message variants,  
**so that** I can discover which strategies perform best while staying safe.

**Acceptance Criteria:**

1. A/B testing engine at `@backend/learning/ab-testing.ts`
2. Experiment definition structure:
   - `experiment_id`, `variant_a`, `variant_b`, `metric` (ctr, sentiment, etc.)
   - Traffic split (50/50 or custom), duration (7-14 days)
   - Guardrails (no prohibited terms, no safety protocol changes)
3. Variant assignment randomized per decision, logged in `decisions.experiment_variant`
4. Statistical significance calculation after experiment ends (p-value <0.05)
5. Winning variant promoted automatically (or flagged for human approval if large change)
6. Experiment catalog: Test empathy openers, CTA phrasing, archetype rotation frequency
7. Forbidden experiments hard-coded (profanity, unsubstantiated claims, targeting changes)
8. Dashboard displays: Active experiments, results, winning variants
9. Unit tests validate random assignment and significance calculations
10. Integration test: Run 2-week experiment with mock data, verify winner selection

---

### Story 4.6: Strategy Weight Adjustment

**As a** the learning system,  
**I want** to adjust signal weights and archetype preferences based on performance data,  
**so that** the bot continuously improves without manual tuning.

**Acceptance Criteria:**

1. Weight optimizer at `@backend/learning/weight-optimizer.ts`
2. Service runs weekly, analyzes last 7 days of feedback data
3. Signal weight adjustments:
   - If high SSS decisions underperform: Reduce SSS weight slightly
   - If high ARS decisions outperform: Increase ARS weight
4. Archetype performance ranking: Score each archetype by Commercial, Love, Safety KPIs
5. Underperforming archetypes down-weighted (used less frequently)
6. Outperforming archetypes up-weighted (used more often)
7. Weight changes capped at ±10% per week (gradual learning, avoid volatility)
8. All weight changes logged for audit trail
9. Dashboard displays: Signal weight evolution, archetype performance table
10. Manual override available (PM can lock weights if desired)
11. Unit tests validate weight calculations don't exceed bounds

---

### Story 4.7: Algorithm Modeling & Drift Detection

**As a** the learning system,  
**I want** to detect platform algorithm changes by monitoring impression/ranking shifts,  
**so that** I can adapt strategies when platforms change their rules.

**Acceptance Criteria:**

1. Algorithm monitor at `@backend/learning/algorithm-monitor.ts`
2. Baseline performance calculated for each platform (impressions, reply ranking)
3. Weekly comparison: Current week vs. baseline (rolling 30-day average)
4. Drift detected if >20% degradation in impressions OR >2 positions drop in reply ranking
5. Alert triggered: "Potential Twitter algorithm change detected - impressions down 25%"
6. Drill-down analysis: Which signal patterns or archetypes affected most
7. Dashboard displays: Algorithm drift alerts, impression trends by platform
8. Human escalation: Significant drift (>30%) requires PM review before strategy changes
9. Integration test: Simulate impression drop, verify drift detection alert

---

### Story 4.8: Master Dashboard Implementation

**As a** product manager,  
**I want** a comprehensive 10-view master dashboard that visualizes every aspect of bot performance including competitive intelligence and community advocacy,  
**so that** I have total visibility into filtering efficiency, revenue attribution, customer journeys, competitive positioning, advocacy tracking, and system health.

**Acceptance Criteria:**

1. **View 1: Mission Control** implemented at `/dashboard`
   - Hero metrics (24hr): Posts scanned, Replies posted, CTR, Revenue, Safety Score
   - Live activity feed: Real-time stream of bot actions (scan, filter, analyze, reply)
   - Active alerts widget: Critical/Warning/Info badges

2. **View 2: Filtering Funnel Intelligence** implemented at `/dashboard/filtering`
   - Visual funnel: Scanned (100k) → Matched (30k) → Spam Filtered → Queued
   - Keyword performance table: Volume, engagement rate, and revenue per keyword
   - Platform breakdown: Match rates for Twitter vs Reddit vs Threads
   - Spam filter accuracy metrics

3. **View 3: Revenue Attribution** implemented at `/dashboard/revenue`
   - Full conversion funnel: Impression → Reply → Click → Visit → Conversion
   - Top revenue-generating replies list (with links to context)
   - Revenue attribution by Archetype, Platform, and Time-of-day

4. **View 4: Customer Journey** implemented at `/dashboard/customers`
   - Lifecycle stages: New vs Engaged vs Converted vs Loyal users
   - Repeat engagement rate and Cohort retention charts
   - Time-to-conversion histogram

5. **View 5: Triple Bottom Line KPIs** implemented at `/dashboard/kpis`
   - 3-column scorecard (Commercial | Love | Safety)
   - 30-day trend lines for all 9 core KPIs
   - Target vs Actual indicators

6. **View 6: Content Quality** implemented at `/dashboard/content`
   - Archetype performance comparison (CTR, Love Score, Revenue)
   - Content pattern correlations (Length, Emojis, Questions)
   - Tone analysis distribution

7. **View 7: A/B Testing Lab** implemented at `/dashboard/experiments`
   - Active experiment cards with real-time statistical confidence
   - Winning variant identification and rollout actions

8. **View 8: System Health** implemented at `/dashboard/health`
   - Component status indicators (Online/Offline/Degraded)
   - Real-time queue depth and wait times
   - Cost tracking: Real-time DeepSeek spend vs monthly budget
   - Error logs and Rate limit usage

9. **View 9: Competitive Intelligence** implemented at `/dashboard/competitive`
   - **Share of Voice Chart**: Vita mentions vs competitor mentions over time (line graph)
   - **Competitor Mention Breakdown**: Which competitors are most discussed (pie chart)
   - **Competitive Conversion Opportunities**: Posts where competitors mentioned but user unsatisfied
   - **Defensive Positioning Performance**: CTR and conversion rate on competitive replies
   - **Market Intelligence Insights**:
     - Top complaints about competitors (extracted from posts)
     - Product gaps: Problems competitors don't solve
     - Sentiment analysis: Competitor sentiment vs Vita sentiment
   - **Competitive Reply Queue**: Pending replies to competitor mentions (manual approval)
   - **Rate Limit Tracking**: Competitive replies today vs 5/day limit per competitor
   - Real-time alerts: "High competitive activity: LiquidIV mentioned 12× today"

10. **View 10: Advocacy & Community Champions** implemented at `/dashboard/advocacy`
    - **Community Champions Leaderboard**: Top 20 users by positive engagement
      - User handle, platform, engagement count, champion tier (Bronze/Silver/Gold)
      - Last interaction date, sentiment score, DM status
    - **DM Campaign Performance**:
      - Sent: # of sample offer DMs sent
      - Accepted: % who agreed to receive samples
      - Declined: % who declined or didn't respond
      - Converted: % who purchased after receiving samples
    - **Advocate Impact Tracking**:
      - User-generated content: Posts mentioning Vita unprompted
      - Reach: Total impressions from advocate posts
      - Amplification factor: Reach per advocate vs direct Anton reach
    - **Power User Engagement Status**:
      - Active power users (>5k followers) engaged this month
      - Gift samples sent to power users
      - Response rate and conversion rate for power users
    - **Testimonial Library**: Approved user quotes for Credibility-anchor archetype
      - Quote text, author (anonymized if requested), date, performance metrics
    - **Viral Content Tracking**: Anton's replies that got screenshot/shared
      - Screenshot-worthy score (engagement rate + share count)
      - Top 10 most-shared replies this month
    - Action buttons: "Promote to Champion", "Send Sample Offer", "Add to Testimonials"

11. **General Dashboard Requirements**:
    - Real-time updates (WebSocket) for critical metrics
    - Date range picker for all analytical views
    - Export capability (CSV/PDF) for reports
    - Responsive design (Desktop primary, Tablet readable)
    - **Navigation**: All 10 views accessible from sidebar menu with icon indicators

---

### Story 4.10: LLM-Ready Data Export for Continuous Improvement

**As a** product manager,  
**I want** to export all dashboard data in a structured, token-efficient JSON format,  
**so that** I can feed it into an external LLM (like GPT-4 or Claude 3) to get actionable optimization suggestions.

**Acceptance Criteria:**

1. **Export Button** added to Mission Control: "Export for AI Analysis"
2. **Data Payload Structure** (JSON) includes:
   - **System Context**: Current configuration, active archetypes, safety thresholds
   - **Performance Summary**: Last 30 days of KPIs (Commercial, Love, Safety)
   - **Filtering Funnel**: Keyword performance data (top 50 winners/losers)
   - **Content Analysis**: Top 20 best/worst replies with full text and outcome metrics
   - **A/B Test Results**: Active and completed experiment data
   - **Error Logs**: Summary of recent system health issues
3. **Format Optimization**:
   - Minified JSON to save context window space
   - Clear key names for LLM understanding (e.g., `reply_text`, `revenue_generated`)
   - Timestamps in ISO 8601 format
4. **Security Redaction**: Automatically redact PII (user handles, specific IDs) before export
5. **Prompt Template Generation**: Include a "System Prompt" file in the download:
   - "You are an expert AI optimization consultant. Review the attached JSON performance data for Antone..."
   - "Identify 3 specific changes to improve CTR..."
   - "Suggest 5 new keywords based on the successful replies..."
6. **Download Package**: ZIP file containing `antone_performance_data.json` and `analysis_prompt.md`
7. **API Endpoint**: `GET /api/export/llm-bundle` generates the package on demand

---

### Story 4.11: Community Champions Identification & Engagement

**As a** the learning system,  
**I want** to identify users who consistently engage positively with Anton and autonomously reach out with personalized gift offers,  
**so that** we convert happy users into brand advocates and product testers.

**Acceptance Criteria:**

1. **Community Champion Tracker** service at `@backend/analytics/community-champions.ts`
2. Service runs daily, analyzing last 30 days of interactions
3. **Champion Identification Criteria** (from FR19):
   - User has engaged positively with Anton 3+ times (likes, thanks, "helpful" replies)
   - Sentiment analysis: >0.7 average positive sentiment across interactions
   - No negative signals (blocks, reports, hostile replies)
   - Active account (posted within last 7 days)
4. **Engagement Tier Classification**:
   - **Bronze Champion**: 3-5 positive interactions
   - **Silver Champion**: 6-10 positive interactions
   - **Gold Champion**: 11+ positive interactions OR power user (>5k followers) with 3+ positive interactions
5. **Automated DM Campaign** (from FR19):
   - Trigger: User qualifies as Bronze+ Champion
   - Message template: "Hey [name], I noticed you've found my hangover tips helpful a few times! You seem to vibe with what we do. Would you be interested in trying our Vita patches? We'd love your honest feedback. DM me your address and I'll send you some samples!"
   - Rate limiting: Max 5 DMs per day (avoid spam appearance)
   - Opt-out tracking: If user doesn't respond or declines, never DM again
6. **Champion Relationship Management**:
   - Champions table: `community_champions` with tier, engagement_history, dm_sent, response_status
   - Status tracking: Pending, Accepted, Declined, Converted, Advocate
   - Advocate status: User posts unprompted positive content about Vita
7. **Follow-Up Strategy**:
   - If user accepts samples: Track 7-day follow-up ("How are the patches working for you?")
   - If user posts review: Thank them publicly + offer referral discount code
   - If user becomes advocate: Add to VIP list (priority responses, early product access)
8. **ROI Tracking**:
   - Champion conversion rate: % who accept samples → purchase
   - Advocacy amplification: Reach of their positive posts about Vita
   - Cost per champion: Sample cost vs lifetime value
9. Dashboard displays:
   - **View: Community Champions** (part of View 10)
   - Champion leaderboard: Top 20 by engagement frequency
   - DM campaign performance: Sent, accepted, declined, conversion rates
   - Advocate impact: Reach and engagement of their Vita mentions
10. Manual override: PM can manually promote users to Champion status
11. Integration test: Simulate 3+ positive interactions, verify DM trigger

---

## Epic 5: Production Hardening & Safety

**Epic Goal**: Implement production-grade monitoring, alerting, human escalation workflows, and compliance verification to ensure Antone operates safely and reliably at scale. This epic adds comprehensive observability (logs, metrics, traces), automated alerts for threshold breaches, human review processes for edge cases, and final safety audits. Deliverable: A fully autonomous production-ready bot with 24/7 monitoring, auto-moderation capabilities, and robust human oversight controls.

### Story 5.1: Structured Logging & Observability

**As a** SRE/developer,  
**I want** comprehensive structured logging across all services,  
**so that** I can debug issues, monitor performance, and audit decisions.

**Acceptance Criteria:**

1. Pino logger configured in all services with JSON output
2. Log levels defined: DEBUG (dev only), INFO (normal operations), WARN (safety triggers), ERROR (failures)
3. Request tracing: All API requests assigned unique `request_id`, propagated through all services
4. Contextual logging: Every log includes timestamp, service name, request_id, relevant entity IDs
5. Sensitive data redacted: API keys, user PII never logged
6. Log aggregation: Logs streamed to stdout, captured by Docker logging driver (json-file) with rotation
7. Dashboard log viewer at `/dashboard/logs` with search and filtering
8. Sample logs tested: Decision logs, posting logs, error logs all structured correctly
9. Documentation: Logging best practices guide for developers

---

### Story 5.2: Alerting & Notification System

**As a** product manager,  
**I want** automated alerts when KPIs breach thresholds or critical errors occur,  
**so that** I can respond quickly to issues without constant monitoring.

**Acceptance Criteria:**

1. Alert engine at `@backend/monitoring/alerting.ts`
2. Alert channels configured: Email, Slack webhook, SMS (Twilio for critical)
3. Alert rules defined:
   - **Critical**: Platform strike, safety KPI >1.5× baseline, system down >5min
   - **High**: CTR <1.5%, sentiment <60%, self-deletion >3% rate
   - **Medium**: Queue depth >100 posts, experiment failure, algorithm drift >20%
4. Alert de-duplication: Same alert not sent twice within 1 hour
5. Escalation policy: Critical alerts SMS immediately, High alerts email within 15min
6. Alert dashboard at `/dashboard/alerts` showing active and historical alerts
7. Manual acknowledgement: Alerts marked as "resolved" with notes
8. Integration test: Trigger each alert type, verify delivery to all channels
9. On-call rotation support (documented process for 24/7 coverage)

---

### Story 5.3: Human Escalation Queue

**As a** content moderator,  
**I want** a queue of interactions requiring human review,  
**so that** I can make judgment calls on edge cases the bot can't handle autonomously.

**Acceptance Criteria:**

1. Escalation queue at `/dashboard/escalations`
2. Escalation triggers (from FR14):
   - Safety ambiguity (Distress Probability >0.45)
   - Viral thread (EVS >5.0× with Helpful Mode selected)
   - Moderator warning received
   - Backlash spike (approaching but not triggering auto-delete)
3. Queue displays:
   - Original post with full context
   - Decision scores and safety flags
   - Generated reply (if applicable)
   - Escalation reason and timestamp
4. Moderator actions: Approve, Reject, Edit & Approve, Flag for Legal Review
5. SLA tracking: Escalations >4 hours old highlighted red
6. Queue prioritization: Critical (safety) first, High (viral) second, Medium (ambiguity) third
7. Resolution notes: Moderator explains decision for learning
8. Integration test: Trigger escalation, verify appears in queue, resolve and verify removal

---

### Story 5.4: Rate Limiting & Quota Management

**As a** the system,  
**I want** robust rate limiting for all platform APIs,  
**so that** I never violate quotas or trigger platform penalties.

**Acceptance Criteria:**

1. Rate limiter at `@backend/utils/rate-limiter.ts` using token bucket algorithm
2. Platform limits enforced:
   - Twitter: 300 posts/15min, 900 reads/15min
   - Reddit: 60 requests/min
   - Threads: 200 requests/hour
3. Rate limit headers from APIs monitored and logged
4. Approaching limit (>80%): Warning logged, non-critical requests delayed
5. Limit exceeded: Requests queued and retried after reset window
6. Per-platform quota dashboards show current usage vs. limits
7. OpenAI API rate limiting: Max 50 requests/min (configurable)
8. Cost tracking: OpenAI API usage logged daily (target: <$5/day)
9. Integration test: Simulate burst traffic, verify rate limiter prevents quota violation

---

### Story 5.5: Graceful Degradation & Failover

**As a** the system,  
**I want** to handle partial failures gracefully without complete shutdown,  
**so that** the bot remains operational even when one platform or service fails.

**Acceptance Criteria:**

1. Circuit breaker pattern implemented for all external APIs
2. Platform failures isolated: Twitter down → Reddit/Threads continue operating
3. OpenAI API fallback: GPT-4 failure → retry with GPT-3.5-turbo
4. Database connection pooling with retry logic (max 3 retries, exponential backoff)
5. Queue processor continues even if individual post processing fails
6. Health check reflects degraded state: `{status: "degraded", twitter: "down", reddit: "healthy"}`
7. Degraded mode logged and alerted, but system doesn't crash
8. Manual recovery actions documented for common failures
9. Integration test: Kill Twitter API mock, verify Reddit/Threads unaffected

---

### Story 5.6: Compliance Audit Trail

**As a** legal/compliance officer,  
**I want** complete audit trails of all decisions, messages, and outcomes,  
**so that** I can demonstrate regulatory compliance if questioned.

**Acceptance Criteria:**

1. All decisions, replies, and outcomes stored with immutable timestamps
2. Audit log table separate from operational tables (append-only)
3. Audit entries include: decision_id, mode, generated_message, compliance_check_result, posted (yes/no), outcomes
4. Claims Library changes versioned with approval timestamps and approver names
5. Safety Protocol triggers logged with full context (post content, safety flags)
6. Retention policy: 90 days in database, then archived to local volume storage (3-year retention)
7. Dashboard export: `/api/audit/export?start_date=2025-01-01&end_date=2025-03-31` downloads CSV
8. Audit reports generated monthly for legal review
9. Integration test: Verify audit trail completeness for sample interaction lifecycle

---

### Story 5.7: Performance Monitoring & Optimization

**As a** developer,  
**I want** to monitor system performance metrics and identify bottlenecks,  
**so that** I can optimize for speed and cost-effectiveness.

**Acceptance Criteria:**

1. Performance metrics collected:
   - Post processing time (Multi-Signal Analysis)
   - Reply generation time (OpenAI API)
   - Database query latency
   - API response times per platform
2. Metrics dashboard at `/dashboard/performance` with real-time charts
3. Slow query detection: Queries >1 second logged for optimization
4. OpenAI API cost tracking: Daily spend and per-request cost analysis
5. Memory usage monitoring: Alert if any service >80% allocated RAM
6. Optimization targets:
   - Post analysis <500ms (NFR3)
   - Reply generation <3s
   - Database queries <100ms (p95)
7. Bottleneck identification: Automated weekly report highlights slowest operations
8. Integration test: Simulate load (100 posts/min), verify performance targets met
10. Weekly email report automation (optional): PM receives summary every Monday

---

### Story 4.9: Adaptive Keyword Optimization & Learning

**As a** the learning system,  
**I want** to track keyword performance and automatically optimize the filtering taxonomy,  
**so that** the system continuously improves recall while minimizing false positives.

**Acceptance Criteria:**

1. Keyword performance tracking service at `@backend/learning/keyword-optimizer.ts`
2. Weekly analysis runs automatically, analyzing last 7 days of data
3. Metrics tracked per keyword:
   - Posts detected (how often keyword matched)
   - Replies generated (engagement from keyword matches)
   - Engagement rate (replies / posts detected)
   - False positive rate (human-flagged as irrelevant)
4. Keyword weight adjustment algorithm:
   - High performers (engagement >15%): Increase weight by 1.2×
   - Low performers (false positive >30%): Decrease weight by 0.8×
   - Dormant keywords (0 matches in 30 days): Flag for removal
5. New keyword discovery from successful posts:
   - Extract common 2-3 word phrases from top 50 engaging posts
   - Suggest new keywords for human approval
6. Dashboard displays keyword performance table:
   - Sortable by engagement rate, false positive rate, volume
   - Color-coded: Green (winners), Yellow (neutral), Red (losers)
7. Manual override: PM can lock keyword weights if desired
8. Automated monthly report: "Top 10 keywords by engagement" and "Suggested new keywords"
9. Integration test: Simulate 30 days of data, verify weight adjustments work correctly
10. A/B test framework: Test new keyword candidates with 10% traffic before full rollout

---

---

### Story 5.8: Production Launch Checklist & Documentation

**As a** product manager,  
**I want** a comprehensive launch checklist and runbook,  
**so that** the production deployment is safe, monitored, and well-documented.

**Acceptance Criteria:**

1. Launch checklist created in `/docs/launch-checklist.md`:
   - [ ] All platform accounts created (@antone_vita across Twitter, Reddit, Threads)
   - [ ] API credentials stored in `.env` (production) or Docker secrets
   - [ ] Database schema migrated to production
   - [ ] Claims Library reviewed and approved by Legal
   - [ ] Safety Protocol tested with 100+ edge cases
   - [ ] Manual approval workflow tested end-to-end
   - [ ] Alert channels configured and tested
   - [ ] Performance baselines established
   - [ ] Compliance audit trail verified
   - [ ] Runbook documented for common operations
2. Runbook created in `/docs/runbook.md` covering:
   - Deployment process (`docker-compose up -d --build` with rollback)
   - Incident response procedures
   - Database backup/restore
   - Secret rotation
   - Scaling procedures (if needed beyond free tier)
3. Architecture diagram generated and published
4. Developer onboarding guide created
5. PM receives production credentials and access
6. Go-live staged: Enable manual approval for first 1000 posts, then autonomous with 10% sampling
7. Post-launch monitoring: Daily KPI reviews for first 30 days
8. Retrospective scheduled: Week 4 post-launch to review learnings

---

---

## Epic 6: Competitive Intelligence & Market Positioning

**Epic Goal**: Implement comprehensive competitive intelligence capabilities that monitor competitor mentions, deploy defensive positioning strategies, track market share of voice, and surface product gap insights. This epic enables Anton to position Vita effectively against competitors while gathering valuable market intelligence for product strategy. Deliverable: Fully integrated competitive monitoring system with automated defensive replies, market intelligence dashboard, and product strategy insights.

### Story 6.1: Competitor Keyword Tracking & Database

**As a** the system,  
**I want** to maintain a comprehensive competitor database and track their mentions across all platforms,  
**so that** we have real-time visibility into competitive landscape and discussion patterns.

**Acceptance Criteria:**

1. Competitor database table created: `competitors` with fields:
   - `id`, `name`, `category` (rehydration/pills/iv-therapy/home-remedy)
   - `primary_mechanism` (oral/IV/topical)
   - `price_point` (low/mid/high)
   - `brand_keywords`: Array of mention variations
2. **Competitor Library** seeded with initial data:
   - **Rehydration**: LiquidIV, Drip Drop, Pedialyte, Gatorade, Nuun, Electrolit
   - **Hangover Pills**: ZBiotics, Flyby, AfterDrink, Cheers, DHM Detox, Blowfish, Morning Recovery
   - **IV Therapy**: The I.V. Doc, Revive, HydroMed, Reset IV, IVBoost
   - **Home Remedies**: "hair of the dog", activated charcoal, pickle juice, coconut water, coffee
3. Keyword variations tracked per competitor:
   - LiquidIV: "liquid IV", "liquid i.v.", "liquidiv", "LMNT"
   - ZBiotics: "zbiotics", "z-biotics", "probiotic hangover"
   - Typos and abbreviations handled
4. Competitive mentions table: `competitive_mentions` with:
   - Post reference, competitor detected, sentiment (positive/negative/neutral)
   - User satisfaction indicator (satisfied/unsatisfied/questioning)
   - Positioning opportunity score (0-1)
5. Stream Monitor (Story 1.7) extended to flag competitive mentions
6. Dashboard query: "Show all mentions where user expressed dissatisfaction with competitor"
7. Weekly competitor report: Volume trends, sentiment shifts, emerging competitors
8. Integration test: Post mentioning "LiquidIV didn't help", verify detection and flagging

---

### Story 6.2: Defensive Positioning Reply System

**As a** the system,  
**I want** to generate and deploy polite, educational defensive positioning replies when competitors are mentioned,  
**so that** Vita's unique value proposition is understood without attacking competitors.

**Acceptance Criteria:**

1. Defensive positioning integrated with Story 3.11 (Competitive Defensive Positioning Replies)
2. **Positioning Decision Logic**:
   - User dissatisfied with competitor → High priority positioning (within 30 min)
   - User asking about competitor → Educational comparison (within 60 min)
   - User satisfied with competitor → Light positioning or skip (avoid appearing desperate)
3. **Competitor-Specific Messaging** (from Story 3.11):
   - Pull competitor data from database (mechanism, price point)
   - Generate customized comparison highlighting Vita's differentiation
   - Always acknowledge competitor strengths before positioning Vita
4. **Rate Limiting & Quality Control**:
   - Max 5 competitive replies per day per competitor (FR24)
   - Never reply multiple times in same thread
   - If 3+ competitive replies in 24hrs, escalate to human review
5. **Archetype Override**:
   - Competitive posts always use Problem-Solution Direct or Credibility-anchor
   - Never use Humor-light or Storylet (stay educational)
6. Positioning replies tagged in database: `reply_type: "competitive_positioning"`
7. A/B testing framework applies to competitive replies:
   - Test soft vs assertive positioning
   - Test mechanism explanation vs benefit focus
8. Dashboard shows: Competitive reply performance vs standard reply performance
9. Unit tests validate polite tone (no negative competitor language)
10. Integration test: User posts "ZBiotics didn't work", verify positioning reply generated

---

### Story 6.3: Market Share of Voice Dashboard

**As a** product manager,  
**I want** a dedicated dashboard view tracking Vita's share of voice vs competitors,  
**so that** I can monitor brand visibility and competitive positioning effectiveness.

**Acceptance Criteria:**

1. Integrated into Dashboard View 9 (Story 4.8 - Competitive Intelligence)
2. **Share of Voice Metrics**:
   - Total hangover solution mentions per week
   - Vita mentions vs top 5 competitors (stacked bar chart)
   - Trend over 90 days: Is Vita gaining or losing share?
3. **Sentiment Comparison**:
   - Vita sentiment score vs competitor average sentiment
   - Positive/neutral/negative breakdown per brand
4. **Competitive Conversion Funnel**:
   - Competitor mentioned → Anton replied → User responded → User clicked Vita link → Conversion
   - Conversion rate: competitive positioning vs standard replies
5. **Competitor Deep Dive**:
   - Click any competitor → See all mentions, sentiment distribution, top complaints
   - Filter by: Satisfied users, dissatisfied users, questioning users
6. **Market Intelligence Insights** (auto-generated weekly):
   - "LiquidIV complaints spike 35% this week (mostly about sugar content)"
   - "ZBiotics price point mentioned negatively 12× ($35 perceived as expensive)"
   - "Pedialyte most mentioned but sentiment declining (-15% this month)"
7. **Positioning Effectiveness**:
   - CTR on competitive replies vs standard replies
   - Conversion rate: competitive positioning leads
   - Average time-to-conversion: competitive vs organic
8. Export capability: "Download Competitive Intelligence Report (Last 30 Days)"
9. Real-time alerts: "Competitor surge: Flyby mentions up 200% today"
10. Integration test: Seed competitive data, verify dashboard calculations correct

---

### Story 6.4: Product Gap Analysis & Strategy Insights

**As a** product manager,  
**I want** automated insights into problems competitors don't solve and user pain points,  
**so that** I can inform Vita's product roadmap and positioning strategy.

**Acceptance Criteria:**

1. Product gap analyzer at `@backend/analytics/product-gap-analyzer.ts`
2. Service runs weekly, analyzing last 30 days of competitive mentions
3. **Complaint Extraction**:
   - NLP analysis of posts mentioning competitors + negative sentiment
   - Extract common complaints: "too expensive", "tastes bad", "doesn't work fast enough", "need prescription"
   - Categorize by: Price, Efficacy, Convenience, Taste, Side effects
4. **Unmet Needs Detection**:
   - Posts where user tried competitor + still seeking solutions
   - Posts asking "anything better than [competitor]?"
   - Posts combining multiple products (unmet need indicator)
5. **Mechanism Gap Analysis**:
   - Which delivery mechanisms are users frustrated with? (oral pills, drinks)
   - Vita's transdermal advantage highlighting opportunities
6. **Dashboard View** (part of View 9):
   - **Top 10 Competitor Complaints** (sortable by frequency)
   - **Unmet Needs Board**: Problems users mention that no competitor solves
   - **Vita Advantage Opportunities**: Where Vita's mechanism directly addresses pain points
7. **Strategic Recommendations** (auto-generated):
   - "15% of LiquidIV complaints mention taste → Opportunity: Highlight patches have no taste"
   - "ZBiotics price point ($35) seen as barrier → Vita's $24 is competitive advantage"
   - "Users frustrated with swallowing pills when nauseous → Transdermal messaging opportunity"
8. **Product Roadmap Feed**:
   - Export insights for product team: "Users requesting faster-acting solutions"
   - Feature gap identification: "10 users asked about energy patches (future product line)"
9. Monthly automated report emailed to PM: "Competitive Intelligence & Product Gaps Summary"
10. Integration test: Seed competitive complaint data, verify gap analysis accurate

---

---

## Checklist Results Report

*This section will be populated after running the pm-checklist.*

---

## Next Steps

### UX Expert Prompt

*To be added: Prompt for UX Expert to design the internal dashboard UI based on this PRD.*

### Architect Prompt

"As Architect, please create a comprehensive Architecture Document for Antone based on this PRD. Focus on the self-hosted Docker Compose deployment, Node.js/TypeScript service architecture, Prisma database layer, and platform API integrations. Define the source tree, coding standards, and deployment strategy."
