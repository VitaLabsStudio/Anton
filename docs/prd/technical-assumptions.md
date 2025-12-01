# Technical Assumptions

## Repository Structure: Monorepo

Single repository containing:
- `/backend` - Node.js/TypeScript API and worker processes
- `/dashboard` - Next.js frontend for human oversight
- `/shared` - Shared types, utilities, and domain logic
- `/database` - PostgreSQL schema migrations and seeds

**Rationale**: Simplifies dependency management, enables shared types between frontend/backend, and keeps the entire system co-located for a small team.

## Service Architecture

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

## Testing Requirements

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

## Additional Technical Assumptions and Requests

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
