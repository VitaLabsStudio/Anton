# Technology Stack

## 1. Overview

Antone V2 is built on a modern, type-safe, and high-performance stack designed for scalability, maintainability, and developer productivity. The core foundation relies on Node.js 24.x LTS, TypeScript 5.9+, and a monorepo structure managed by pnpm.

## 2. Core Technologies

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Runtime** | Node.js | 24.x LTS | Latest LTS with improved V8 engine, security patches, active maintenance |
| **Language** | TypeScript | 5.9.x | Latest type safety features critical for complex decision logic |
| **Package Manager** | pnpm | 10.x | Fastest package manager with enhanced monorepo support and disk efficiency |
| **Database** | PostgreSQL | 17.x | Latest stable version with improved JSON support and performance optimizations |
| **ORM** | Prisma | 7.x | Latest type-safe database layer with enhanced performance and migration support |
| **Web Framework** | Hono | 4.x | Ultra-fast, edge-first framework with native TypeScript support (10x faster than Express) |
| **Frontend** | Next.js | 16.x | Latest React framework with Turbopack, React 19 support, enhanced server actions |
| **Styling** | Tailwind CSS | 4.x | Latest utility-first CSS with performance improvements |

## 3. Technology Rationale (December 2025)

**1. Node.js 24.x LTS**
- **Rationale**: Active LTS until April 2027.
- **Benefits**: Enhanced V8 engine, native TypeScript 5.9 support, improved ESM support.

**2. Next.js 16.x**
- **Rationale**: Standard for modern React applications.
- **Benefits**: Turbopack (10x faster dev), React 19 support, Server Actions.

**3. Prisma 7.x**
- **Rationale**: Type-safe database access.
- **Benefits**: 40% faster query generation, better PostgreSQL 17 JSON support.

**4. pnpm 10.x**
- **Rationale**: Efficient dependency management.
- **Benefits**: 25% faster installs, strict dependency isolation.

**5. PostgreSQL 17.x**
- **Rationale**: Robust relational database with JSON capabilities.
- **Benefits**: 30% faster JSON operations, improved vacuuming.

**6. Hono 4.x**
- **Rationale**: High-performance replacement for Express.
- **Benefits**: 10x faster, edge-compatible, smaller bundle, built-in validation.

**7. Tailwind CSS 4.x**
- **Rationale**: Utility-first styling.
- **Benefits**: Rust-based engine for faster builds, improved container queries.

## 4. External Services

| Service | Purpose | Cost |
|---------|---------|------|
| **DeepSeek R1 API** | LLM for multi-signal analysis and reply generation | ~$25-35/month |
| **Twitter API v2** | Tweet monitoring and posting | Free (Basic) or Pro |
| **Reddit API** | Subreddit monitoring and commenting | Free |
| **Threads API** | Post monitoring and replying | Free |
| **Cloudflare Tunnel** | Secure remote dashboard access | Free tier |
| **Healthchecks.io** | Uptime monitoring with alerts | Free tier |

## 5. Development Tools

| Tool | Purpose | Version |
|------|---------|---------|
| **ESLint** | Code linting with TypeScript rules | 9.15.x |
| **Prettier** | Code formatting consistency | 3.4.x |
| **Vitest** | Unit and integration testing | 2.1.x |
| **Docker** | Containerization | 24.x+ |
| **Docker Compose** | Local orchestration | 2.x+ |
| **Pino** | Structured JSON logging | 9.5.x |
| **Zod** | Runtime schema validation | 3.24.x |
| **Husky** | Git hooks for pre-commit linting | 9.x |
| **lint-staged** | Run linters on staged git files | 15.x |
| **Snyk** | Security vulnerability scanning | Latest |

## 6. Advanced Learning System Libraries

| Library | Purpose | Version |
|---------|---------|---------|
| **simple-statistics** | Core statistical functions (mean, median, SD) | 7.8.x |
| **jstat** | Beta distribution, t-tests, statistical inference | 1.9.x |
| **seedrandom** | Reproducible pseudo-random number generation | 3.0.x |

## 7. Infrastructure

| Component | Specification |
|-----------|---------------|
| **Host Machine** | User's PC: Intel i5 6-core, 32GB RAM, 1TB SSD |
| **Container Runtime** | Docker with Docker Compose |
| **Database Allocation** | 8-16GB RAM for PostgreSQL |
| **Network** | Internal Docker network + Cloudflare Tunnel |

## 8. Non-Functional Requirements (NFRs)

**Data Retention**:
- Operational data active for 90 days.
- Archived as compressed JSON.

**Backup & Disaster Recovery**:
- Daily backups to Backblaze B2.
- RTO: 4 hours, RPO: 24 hours.

**Compliance & Privacy**:
- GDPR/CCPA compliant by design (no PII stored).
- Right to be forgotten supported.

**Security**:
- Weekly vulnerability scans.
- Quarterly secret rotation.
- Pre-production security audit.
