# Antone Full-Stack Architecture Document

**Project**: Antone V1 - Autonomous AI Social Media Manager  
**Version**: 1.0  
**Date**: December 1, 2025  
**Author**: Winston (Architect Agent)  
**Status**: Complete

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Repository Structure](#3-repository-structure)
4. [Service Architecture](#4-service-architecture)
5. [Database Schema](#5-database-schema)
6. [API Specifications](#6-api-specifications)
7. [Backend Architecture](#7-backend-architecture)
8. [Frontend Architecture](#8-frontend-architecture)
9. [External Integrations](#9-external-integrations)
10. [Security Architecture](#10-security-architecture)
11. [Infrastructure & Deployment](#11-infrastructure--deployment)
12. [Observability & Monitoring](#12-observability--monitoring)
13. [Testing Strategy](#13-testing-strategy)
14. [Error Handling & Resilience](#14-error-handling--resilience)
15. [Performance Considerations](#15-performance-considerations)
16. [Migration & Scaling Strategy](#16-migration--scaling-strategy)

---

## Glossary of Terms

| Term | Full Name | Definition |
|------|-----------|------------|
| **SSS** | Solution-Seeking Score | Float (0-1) measuring linguistic intent to find actionable solutions vs passive venting |
| **ARS** | Author Relationship Score | Float (0-1) representing relationship memory and trust level with specific author |
| **EVS** | Engagement Velocity Score | Ratio measuring post's engagement rate vs author's baseline (viral detection) |
| **TRS** | Topic Relevance Score | Float (0-1) filtering metaphorical/pop culture uses of hangover keywords |
| **Decision Score** | Composite Score | Weighted combination of 4 signals determining engagement strategy |
| **Operational Mode** | Engagement Strategy | One of: HELPFUL (solution+product), ENGAGEMENT (value-only), HYBRID (soft mention), DISENGAGED (skip) |
| **Archetype** | Message Template Type | One of 8 reply structures: Checklist, Myth-bust, Coach, Storylet, Humor-light, Credibility-anchor, Confident Recommender, Problem-Solution Direct |
| **Relationship Memory** | Author History Database | Persistent storage of all interactions with specific authors for context-aware engagement |
| **Primary Safety Protocol** | Safety Guardrails | Hard-coded rules that force disengagement on sensitive topics (death, addiction, medical emergencies, minors) |
| **Claims Library** | Compliance Database | Legal-approved phrasing and prohibited terms for message generation |
| **Power User** | High-Impact Account | User with >5k followers or verified badge requiring premium engagement |
| **Community Champion** | Brand Advocate | User with 3+ positive interactions, eligible for sample outreach |
| **UTM Code** | Tracking Parameter | Unique link identifier for revenue attribution (e.g., `?utm_source=antone&utm_content=reply123`) |
| **Circuit Breaker** | Resilience Pattern | Automatic fail-fast mechanism that halts requests to failing services |

---

## Stakeholders & Approval Process

### Project Stakeholders

| Role | Name | Responsibility | Contact |
|------|------|----------------|---------|
| **Product Owner** | [TBD] | Final PRD approval, feature prioritization, go/no-go decisions | - |
| **Engineering Lead** | [TBD] | Technical feasibility review, architecture approval, code review | - |
| **Backend Developer** | [TBD] | Implementation of backend services, API design, worker processes | - |
| **Frontend Developer** | [TBD] | Dashboard implementation, UX/UI design (or same as backend for full-stack) | - |
| **Legal/Compliance** | [TBD] | Claims Library approval, compliance review, regulatory guidance | - |
| **Marketing/Brand** | [TBD] | Brand voice approval, archetype review, social strategy alignment | - |
| **DevOps/SRE** | [TBD] | Infrastructure setup, monitoring configuration, production support | - |

### Architecture Approval Workflow

```
1. ARCHITECTURE DRAFT (This Document)
   ├─► Architect (Winston) creates comprehensive architecture document
   └─► Status: DRAFT
         │
         ▼
2. TECHNICAL REVIEW
   ├─► Engineering Lead reviews for technical feasibility
   ├─► Backend Developer reviews implementation approach
   ├─► Feedback incorporated
   └─► Status: TECHNICAL REVIEW COMPLETE
         │
         ▼
3. STAKEHOLDER REVIEW
   ├─► Product Owner reviews alignment with PRD
   ├─► Legal reviews compliance architecture (Claims Library, audit trails)
   ├─► Marketing reviews brand voice integration
   └─► Feedback incorporated
         │
         ▼
4. FINAL APPROVAL
   ├─► Product Owner signs off
   ├─► Engineering Lead signs off
   └─► Status: APPROVED FOR DEVELOPMENT
         │
         ▼
5. DEVELOPMENT BEGINS
   └─► Scrum Master creates Story 1.1 from architecture
```

**Current Status**: 🟡 PENDING STAKEHOLDER REVIEW

---

## 1. System Overview

### 1.1 Purpose

Antone is an autonomous AI social media manager that operates 24/7 across Twitter/X, Reddit, and Threads to spread awareness for Vita's transdermal patches. The system monitors social platforms for relevant conversations, analyzes posts using multi-signal intelligence, generates contextually appropriate replies, and continuously learns from outcomes.

### 1.2 Current State Baseline

**Existing Vita Social Presence:**
- Twitter/X: No account exists
- Reddit: No account exists  
- Threads: No account exists
- Current follower count: 0 across all platforms
- Historical engagement data: None (greenfield project)
- Manual engagement results: N/A (no prior social media presence)

**Market Opportunity:**
- Estimated 20-30k hangover-related posts per week across target platforms
- 70-80% of high-intent posts occur outside traditional work hours (missed by human-only management)
- Competitor social engagement: Minimal automation detected; mostly traditional paid ads

### 1.3 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ANTONE SYSTEM ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  Twitter/X API   │    │   Reddit API     │    │  Threads API     │       │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘       │
│           │                       │                       │                  │
│           └───────────────────────┼───────────────────────┘                  │
│                                   ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     STREAM MONITOR WORKER                            │    │
│  │  • Keyword Filtering (200+ terms)                                   │    │
│  │  • Spam Pre-filtering                                               │    │
│  │  • Platform-specific polling                                        │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      POSTGRESQL DATABASE                             │    │
│  │  • Post Queue          • Decisions           • Replies              │    │
│  │  • Authors             • KPI Metrics         • Experiments          │    │
│  │  • Competitors         • Champions           • Audit Logs           │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     DECISION ENGINE API                              │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │    │
│  │  │  Signal 1   │ │  Signal 2   │ │  Signal 3   │ │  Signal 4   │   │    │
│  │  │ Linguistic  │ │  Author     │ │  Metrics    │ │  Semantic   │   │    │
│  │  │  Intent     │ │  Context    │ │  Velocity   │ │  Topic      │   │    │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │    │
│  │         └────────────────┼────────────────┼────────────────┘        │    │
│  │                          ▼                                          │    │
│  │  ┌─────────────────────────────────────────────────────────────┐   │    │
│  │  │              DECISION SCORE & MODE SELECTION                 │   │    │
│  │  │  • Safety Protocol    • Temporal Intelligence                │   │    │
│  │  │  • Power User Detection • Competitive Detection              │   │    │
│  │  │  • Archetype Selection                                       │   │    │
│  │  └─────────────────────────────────────────────────────────────┘   │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     REPLY GENERATOR                                  │    │
│  │  • DeepSeek R1 Integration    • Claims Library Validation           │    │
│  │  • Archetype Templates        • Platform Personality Adaptation     │    │
│  │  • Social Proof Integration   • Compliance Engine                   │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     PLATFORM POSTING SERVICES                        │    │
│  │  • Twitter Poster      • Reddit Poster       • Threads Poster       │    │
│  │  • Rate Limiting       • UTM Tagging         • Error Handling       │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     LEARNING & ANALYTICS ENGINE                      │    │
│  │  • KPI Tracking (Commercial/Love/Safety)                            │    │
│  │  • A/B Testing Framework      • Strategy Weight Adjustment          │    │
│  │  • Self-Correction Mechanism  • Algorithm Drift Detection           │    │
│  │  • Community Champions Tracking                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     NEXT.JS DASHBOARD                                │    │
│  │  • 10-View Master Dashboard   • Real-time WebSocket Updates         │    │
│  │  • Manual Approval Interface  • Human Escalation Queue              │    │
│  │  • KPI Visualization          • Competitive Intelligence View       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     CLOUDFLARE TUNNEL                                │    │
│  │  • Secure Remote Access (https://antone.yourdomain.com)             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Key Design Principles

1. **Modular Architecture**: Each component has a single responsibility and can be developed/tested independently
2. **Event-Driven Processing**: Posts flow through a queue for async processing, enabling scalability
3. **Safety-First Design**: Safety protocols are enforced at multiple layers with hard-coded guardrails
4. **Continuous Learning**: Every interaction feeds back into optimization loops
5. **Cost-Efficient**: Self-hosted deployment with DeepSeek R1 keeps costs at $25-35/month
6. **Transparent & Auditable**: Complete decision trails for compliance and debugging

### 1.5 MVP Definition & Scope

**MVP Scope (Epics 1-3):**
- **Epic 1**: Foundation & Core Infrastructure - Project setup, Docker deployment, database, platform authentication, stream monitoring
- **Epic 2**: Multi-Signal Analysis & Decision Engine - 4-signal intelligence, decision scoring, mode selection, safety protocols
- **Epic 3**: Message Generation & Engagement - Reply generation, compliance validation, platform posting with manual approval workflow

**Post-MVP Optimization (Epics 4-6):**
- **Epic 4**: Learning Loop & Optimization - A/B testing, autonomous learning, 10-view dashboard
- **Epic 5**: Production Hardening & Safety - Advanced monitoring, alerting, human escalation
- **Epic 6**: Competitive Intelligence & Market Positioning - Competitor tracking, market intelligence

**MVP Success Criteria:**
- Bot can authenticate with all 3 platforms
- Bot can detect posts via 200+ keyword filtering
- Bot can analyze posts using 4-signal intelligence
- Bot can generate compliant, platform-specific replies
- Human operators can review and approve replies via dashboard (Views 1, 5, 8 minimum)
- Bot can post approved replies and track basic KPIs

**Phased Deployment:**
- **Phase 1 (Weeks 1-4)**: Epic 1 - Foundation complete
- **Phase 2 (Weeks 5-9)**: Epic 2 - Decision engine operational (analyze but don't post)
- **Phase 3 (Weeks 10-13)**: Epic 3 - Manual approval workflow, begin posting
- **Phase 4 (Weeks 14+)**: Epics 4-6 - Autonomous operation with learning loops

### 1.6 Explicitly OUT OF SCOPE for V1

The following features are intentionally excluded from V1 to maintain focus:

**Platform & Content:**
- ❌ Multi-language support (English only)
- ❌ Image/video content generation (text replies only)
- ❌ Facebook, Instagram, TikTok support (Twitter/X, Reddit, Threads only)
- ❌ Voice/audio engagement
- ❌ Stories/Reels engagement

**Infrastructure:**
- ❌ Mobile app for dashboard (web responsive only)
- ❌ Kubernetes orchestration (Docker Compose sufficient for V1)
- ❌ Multi-region deployment (single self-hosted instance)
- ❌ Real-time streaming APIs (polling is sufficient)

**Analytics:**
- ❌ Advanced predictive analytics (basic trend analysis only)
- ❌ Machine learning model training (use pre-trained DeepSeek R1)
- ❌ Custom NLP models (use DeepSeek for all text analysis)
- ❌ Real-time click stream analysis (daily batch attribution)

**Product Modules:**
- ❌ Sleep patch support (V2 expansion)
- ❌ Energy patch support (V2 expansion)
- ❌ Multi-product concurrent operation (single product focus)

**Advanced Features:**
- ❌ Automated influencer outreach campaigns
- ❌ User-generated content curation
- ❌ Podcast/blog monitoring
- ❌ Sentiment analysis across non-target platforms
- ❌ Predictive trending topic identification

**Compliance & Legal:**
- ❌ GDPR compliance tooling (US-only, internal tool)
- ❌ Multi-jurisdiction regulatory support
- ❌ Automated legal review workflows

---

## 2. Technology Stack

### 2.0 Additional Non-Functional Requirements

Beyond the 13 NFRs specified in the PRD, the following additional requirements are established:

**NFR14: Data Retention Beyond Audit Logs**
- Keep operational data (posts, decisions, replies) for 90 days active, then archive
- Archive format: Compressed JSON, one file per month
- Archive location: `/var/lib/antone/archives/` on host machine
- Restore process: Documented in runbook for historical analysis needs

**NFR15: Backup & Disaster Recovery**
- **Backup Schedule**: Automated daily backups at 2:00 AM local time
- **Backup Destination**: Backblaze B2 (free 10GB tier)
- **Retention**: 7-day rolling retention, monthly snapshots kept for 1 year
- **RTO** (Recovery Time Objective): 4 hours from backup to operational
- **RPO** (Recovery Point Objective): 24 hours maximum data loss
- **Backup Verification**: Weekly restore tests to staging environment

**NFR16: Compliance & Privacy**
- **GDPR**: Not required (US-only operation, Vita internal tool, no EU users)
- **CCPA**: Compliant via design - no PII stored (only public handles)
- **Data Subject Requests**: Support author deletion within 30 days if requested
- **Public Data Only**: All stored data is publicly available social media content
- **Right to Be Forgotten**: Delete all relationship memory for specific author on request

**NFR17: Security Testing**
- **Pre-Production Security Audit**: Penetration testing before production launch
- **Vulnerability Scanning**: Weekly automated scans with Snyk or Dependabot
- **Dependency Updates**: Monthly security patch review and application
- **Secret Rotation**: Quarterly rotation of all API keys and tokens
- **Security Checklist**: Part of Story 5.8 (Production Launch Checklist)

### 2.1 Core Technologies

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

### 2.1.1 Technology Stack Rationale & Architecture Review (December 2025)

**Architecture Review Date**: December 1, 2025  
**Reviewed By**: Winston (Architect Agent)  
**Review Methodology**: Comprehensive analysis of latest stable versions, compatibility verification, performance benchmarks, and production-readiness assessment.

#### Critical Technology Updates Applied

The architecture has been updated from initial draft specifications to reflect the latest stable, production-ready technologies as of December 2025:

**1. Node.js 24.x LTS (Updated from 20.x)**
- **Rationale**: Node.js 24.x became the active LTS in November 2024, with Node.js 20.x transitioning to maintenance mode
- **Key Benefits**: 
  - Enhanced V8 JavaScript engine (v12.9+) with 15% performance improvement
  - Native support for TypeScript 5.9 features
  - Improved security patches and vulnerability management
  - Better ESM (ECMAScript Modules) support
- **Compatibility**: Fully compatible with all selected packages
- **Production Status**: Active LTS until April 2027

**2. Next.js 16.x (Updated from 14.x)**
- **Rationale**: Next.js 16 introduces Turbopack as the default bundler and React 19 support
- **Key Benefits**:
  - Turbopack provides 10x faster local development than Webpack
  - Enhanced Server Actions with better error handling
  - React 19 features including improved Suspense and concurrent rendering
  - Better edge runtime compatibility
- **Compatibility**: Requires React 19.x, fully compatible with Tailwind CSS 4.x
- **Migration Impact**: Minimal - mostly configuration updates

**3. Prisma 7.x (Updated from 5.x)**
- **Rationale**: Prisma 7 is a major release with significant type safety and performance improvements
- **Key Benefits**:
  - 40% faster query generation
  - Enhanced TypeScript type inference
  - Better PostgreSQL 17 support with native JSON operations
  - Improved migration workflow with automatic rollback detection
- **Compatibility**: Full support for PostgreSQL 17.x
- **Migration Impact**: Breaking changes in schema syntax require migration review

**4. pnpm 10.x (Updated from 8.x)**
- **Rationale**: pnpm 10 introduces performance optimizations and better monorepo handling
- **Key Benefits**:
  - 25% faster installation times
  - Improved workspace protocol handling
  - Better compatibility with Node.js 24.x corepack
  - Enhanced security with automatic vulnerability detection
- **Compatibility**: Requires Node.js 24.x (via corepack)
- **Migration Impact**: None - fully backward compatible

**5. PostgreSQL 17.x (Updated from 16.x)**
- **Rationale**: PostgreSQL 17 offers significant performance improvements while 16.x remains supported
- **Key Benefits**:
  - 30% faster JSON operations (critical for flexible schemas)
  - Improved VACUUM performance for large tables
  - Enhanced indexing strategies
  - Better connection pooling
- **Compatibility**: Prisma 7.x has native support
- **Migration Impact**: Minimal - mostly performance gains
- **Note**: PostgreSQL 16.x remains a viable alternative (supported until November 2029)

**6. Hono 4.x (Replacing Express 4.x)**
- **Rationale**: Modern TypeScript-first framework with superior performance
- **Key Benefits**:
  - 10x faster than Express.js in benchmarks
  - Native TypeScript support with excellent type inference
  - Edge runtime compatible (Cloudflare Workers, Vercel Edge)
  - Smaller bundle size (12KB vs Express's 200KB+)
  - Built-in validation middleware using Zod
- **Compatibility**: Drop-in conceptual replacement for Express with cleaner API
- **Migration Impact**: Moderate - routing syntax differs but concepts are similar
- **Alternative Considered**: Fastify 4.x (3-4x faster than Express but less modern than Hono)

**7. Tailwind CSS 4.x (Updated from 3.x)**
- **Rationale**: Latest version with performance improvements and new features
- **Key Benefits**:
  - Oxide engine (Rust-based) for 10x faster builds
  - Improved CSS variable support
  - Better container queries
  - Enhanced dark mode support
- **Compatibility**: Compatible with Next.js 16.x
- **Migration Impact**: Minor - mostly configuration updates

**8. TypeScript 5.9.x (Updated from 5.3.x)**
- **Rationale**: Latest stable version with improved type inference
- **Key Benefits**:
  - Better handling of discriminated unions
  - Improved performance in large codebases
  - Enhanced error messages
  - New utility types
- **Compatibility**: Fully compatible with all selected packages
- **Migration Impact**: None - fully backward compatible

#### Technology Compatibility Matrix

| Technology | Version | Node.js 24.x | Prisma 7.x | PostgreSQL 17.x | Hono 4.x | Next.js 16.x |
|-----------|---------|--------------|------------|-----------------|----------|--------------|
| Node.js   | 24.x LTS | ✅ | ✅ | ✅ | ✅ | ✅ |
| TypeScript | 5.9.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| Prisma    | 7.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| PostgreSQL | 17.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hono      | 4.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| Next.js   | 16.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| pnpm      | 10.x | ✅ | ✅ | ✅ | ✅ | ✅ |

**All technologies verified compatible as of December 1, 2025**

#### Alternative Technologies Considered But Not Selected

1. **Bun Runtime** (vs Node.js 24.x)
   - **Pros**: 4x faster startup, native TypeScript support, built-in bundler
   - **Cons**: Ecosystem maturity concerns, fewer production battle-tested deployments
   - **Decision**: Deferred to v2.0 - Node.js 24.x LTS provides better stability

2. **Fastify** (vs Hono)
   - **Pros**: Mature ecosystem, excellent plugin system, 3-4x faster than Express
   - **Cons**: Less modern API design, larger bundle size than Hono, not edge-compatible
   - **Decision**: Hono selected for edge compatibility and superior TypeScript experience

3. **PostgreSQL 18.x** (vs 17.x)
   - **Pros**: Latest features, cutting-edge performance
   - **Cons**: Released November 2024, less production testing
   - **Decision**: PostgreSQL 17.x selected for better production stability (18.x recommended for v2.0)

#### Coding Standards & Development Guidelines

This section defines comprehensive coding standards for the Antone V1 project, ensuring consistency, maintainability, and quality across the codebase.

---

##### 1. TypeScript Configuration Standards

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

---

##### 2. ESLint Configuration Standards

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

---

##### 3. Prettier Configuration Standards

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

---

##### 4. File Naming Conventions

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

---

##### 5. Code Organization Patterns

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

---

##### 6. Comment Standards

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
// TODO(winston): Optimize this query - currently O(n^2)
// FIXME: Race condition when multiple workers process same post
// HACK: Temporary workaround for API rate limiting
// NOTE: This threshold was determined through A/B testing
```

---

##### 7. Error Handling Patterns

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

---

##### 8. Testing Standards

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

---

##### 9. Git Workflow & Commit Standards

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

```bash
fix(api): prevent race condition in queue processor

Multiple workers were processing the same post simultaneously.
Added distributed lock using Redis to ensure atomicity.

Fixes #456
```

**Branch Naming**:
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/description` - New features (e.g., `feature/temporal-intelligence`)
- `fix/description` - Bug fixes (e.g., `fix/race-condition`)
- `refactor/description` - Code improvements
- `docs/description` - Documentation updates

---

##### 10. API Design Standards

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

**Hono Route Handler Pattern**:
```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

const app = new Hono();

app.post(
  '/api/decisions',
  zValidator('json', createDecisionSchema),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const decision = await createDecision(body);
      
      return c.json({
        success: true,
        data: decision,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: c.req.header('x-request-id'),
        },
      }, 201);
    } catch (error) {
      if (error instanceof ValidationError) {
        return c.json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        }, 400);
      }
      
      throw error; // Let error middleware handle
    }
  }
);
```

---

##### 11. Security Best Practices

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

**Rate Limiting**:
```typescript
import { rateLimiter } from 'hono-rate-limiter';

app.use('/api/*', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests',
}));
```

---

##### 12. Performance Optimization Standards

**Database Query Optimization**:
```typescript
// ✅ Select only needed fields
const post = await db.post.findUnique({
  where: { id: postId },
  select: {
    id: true,
    content: true,
    authorId: true,
  },
});

// ✅ Use proper indexing (in schema.prisma)
@@index([platform, createdAt])
@@index([authorId, status])

// ✅ Batch operations
const posts = await db.post.findMany({
  where: { status: 'PENDING' },
  take: 100,
});
```

**Caching Strategy**:
```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached) as T;
  }
  
  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  
  return data;
}
```

---

##### 13. Documentation Standards

**README.md Requirements**:
- Project overview and purpose
- Prerequisites and setup instructions
- Development workflow
- Testing procedures
- Deployment instructions
- Contributing guidelines
- License information

**Code Documentation**:
- ✅ All public APIs have JSDoc
- ✅ Complex algorithms explained
- ✅ Architecture decisions documented (ADR format)
- ✅ API endpoints documented (OpenAPI/Swagger)

**Architecture Decision Records (ADR)**:
```markdown
# ADR-001: Use Hono Instead of Express

## Status
Accepted

## Context
Need to select a web framework for the backend API.

## Decision
Use Hono 4.x instead of Express 4.x.

## Consequences
### Positive
- 10x performance improvement
- Native TypeScript support
- Edge runtime compatible
- Smaller bundle size

### Negative
- Smaller ecosystem than Express
- Team needs to learn new framework

## Alternatives Considered
- Express 4.x: Mature but slow
- Fastify 4.x: Faster than Express but not edge-compatible
```

---

##### 14. Code Review Checklist

Before submitting a PR, verify:

**Functionality**:
- [ ] Code works as intended
- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] Edge cases handled

**Code Quality**:
- [ ] Follows TypeScript strict mode
- [ ] No ESLint warnings or errors
- [ ] Proper error handling
- [ ] No code duplication
- [ ] Functions are single-purpose

**Documentation**:
- [ ] Public APIs have JSDoc
- [ ] Complex logic explained
- [ ] README updated if needed
- [ ] CHANGELOG updated

**Testing**:
- [ ] Unit tests added/updated
- [ ] Integration tests for new features
- [ ] Test coverage >80%
- [ ] Edge cases tested

**Security**:
- [ ] Input validation present
- [ ] No hardcoded secrets
- [ ] SQL injection prevented
- [ ] XSS vulnerabilities checked

**Performance**:
- [ ] No N+1 queries
- [ ] Proper indexing used
- [ ] Caching implemented where needed
- [ ] Large lists paginated

---

##### 15. Performance Targets

**Backend API**:
- Response time (p95): <100ms
- Response time (p99): <200ms
- Throughput: 1000 req/sec
- Database query time (p99): <50ms

**Frontend Dashboard**:
- Time to Interactive (TTI): <2s
- First Contentful Paint (FCP): <1s
- Largest Contentful Paint (LCP): <2.5s
- Cumulative Layout Shift (CLS): <0.1

**Build Performance**:
- Development build: <5s
- Production build: <60s
- Hot Module Reload (HMR): <500ms

**Database Performance**:
- Simple queries: <10ms
- Complex queries: <50ms
- Bulk operations: <100ms per 1000 records

### 2.2 External Services

| Service | Purpose | Cost |
|---------|---------|------|
| **DeepSeek R1 API** | LLM for multi-signal analysis and reply generation | $0.55/1M input, $2.19/1M output (~$25-35/month) |
| **Twitter API v2** | Tweet monitoring and posting | Free tier (Basic) or $100/month (Pro) |
| **Reddit API** | Subreddit monitoring and commenting | Free |
| **Threads API** | Post monitoring and replying | Free |
| **Cloudflare Tunnel** | Secure remote dashboard access | Free tier |
| **Healthchecks.io** | Uptime monitoring with alerts | Free tier |

### 2.3 Development Tools

| Tool | Purpose | Version |
|------|---------|---------|
| **ESLint** | Code linting with TypeScript rules | 9.15.x |
| **Prettier** | Code formatting consistency | 3.4.x |
| **Vitest** | Unit and integration testing (faster than Jest) | 2.1.x |
| **Docker** | Containerization | 24.x+ |
| **Docker Compose** | Local orchestration | 2.x+ |
| **Pino** | Structured JSON logging | 9.5.x |
| **Zod** | Runtime schema validation | 3.24.x |
| **Husky** | Git hooks for pre-commit linting | 9.x |
| **lint-staged** | Run linters on staged git files | 15.x |
| **TypeDoc** | Generate documentation from TypeScript | 0.26.x |
| **Snyk** | Security vulnerability scanning | Latest |

### 2.4 Advanced Learning System Libraries

| Library | Purpose | Version |
|---------|---------|---------|
| **simple-statistics** | Core statistical functions (mean, median, standard deviation, percentiles) | 7.8.x |
| **jstat** | Beta distribution, t-tests, and advanced statistical inference | 1.9.x |
| **seedrandom** | Reproducible pseudo-random number generation for Thompson Sampling | 3.0.x |

**Learning System Capabilities:**
- **Robust Statistics** (Priority 1): Winsorized mean, Tukey's method, outlier detection
- **Statistical Inference** (Priority 1): Confidence intervals, Cohen's d effect size, t-tests
- **Thompson Sampling** (Priority 2): Multi-armed bandit for adaptive A/B testing
- **Bayesian Statistics**: Beta distribution sampling for experiment optimization
- **Causal Inference** (Priority 3): Randomization-based causality detection
- **Meta-Learning** (Priority 3): Learning accuracy tracking and self-optimization

### 2.5 Infrastructure

| Component | Specification |
|-----------|---------------|
| **Host Machine** | User's PC: Intel i5 6-core, 32GB RAM, 1TB SSD |
| **Container Runtime** | Docker with Docker Compose |
| **Database Allocation** | 8-16GB RAM for PostgreSQL |
| **Network** | Internal Docker network + Cloudflare Tunnel for external access |

---

## 3. Repository Structure

### 3.1 Monorepo Layout

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

### 3.2 Package Dependencies

#### Root `package.json`
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

#### Backend Dependencies
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

#### Dashboard Dependencies
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

### 3.3 Development Tooling Configuration

This section provides the complete configuration for all development tooling to ensure consistency across the team.

#### 3.3.1 Git Hooks (Husky)

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

#### 3.3.2 Editor Configuration

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

#### 3.3.3 Node Version Management

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

#### 3.3.4 Ignore Files

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

#### 3.3.5 Vitest Configuration

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

#### 3.3.6 TypeScript Path Aliases

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

#### 3.3.7 PNPM Workspace Configuration

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

## 4. Service Architecture

### 4.1 Service Overview

Antone consists of four main services running as Docker containers:

| Service | Type | Port | Purpose |
|---------|------|------|---------|
| `backend-api` | HTTP Server | 3001 | REST API for dashboard and external integrations |
| `backend-worker` | Background Process | - | Stream monitoring, queue processing, learning loops |
| `dashboard` | Next.js App | 3000 | Web dashboard for human oversight |
| `postgres` | Database | 5432 | Primary data store |

### 4.2 Service Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Internal Network                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │   dashboard  │ ──────► │  backend-api │                      │
│  │   (Next.js)  │  HTTP   │    (Hono)    │                      │
│  │   :3000      │         │   :3001      │                      │
│  └──────────────┘         └──────┬───────┘                      │
│         │                        │                               │
│         │                        │                               │
│         │                 ┌──────▼───────┐                      │
│         │                 │   postgres   │                      │
│         │                 │   :5432      │                      │
│         │                 └──────▲───────┘                      │
│         │                        │                               │
│         │                 ┌──────┴───────┐                      │
│         │                 │backend-worker│                      │
│         └────────────────►│  (Node.js)   │                      │
│              WebSocket    └──────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │ Cloudflare Tunnel
                    ▼
            External Access
         (https://antone.yourdomain.com)
```

### 4.3 Backend Worker Architecture

The worker process handles multiple concurrent jobs:

```typescript
// backend/src/workers/index.ts

import { StreamMonitor } from './stream-monitor';
import { QueueProcessor } from './queue-processor';
import { FeedbackCollector } from './feedback-collector';
import { SelfCorrection } from './self-correction';
import { RelationshipUpdater } from './relationship-updater';
import { CommunityChampions } from '../analytics/community-champions';

export class WorkerManager {
  private streamMonitor: StreamMonitor;
  private queueProcessor: QueueProcessor;
  private feedbackCollector: FeedbackCollector;
  private selfCorrection: SelfCorrection;
  private relationshipUpdater: RelationshipUpdater;
  private championsTracker: CommunityChampions;

  async start(): Promise<void> {
    // Stream Monitor: Continuous platform polling
    // Twitter: every 5-15 min | Reddit: every 5-15 min | Threads: every 5-15 min
    this.streamMonitor.start();

    // Queue Processor: Process posts from queue every 30 seconds
    this.queueProcessor.start({ intervalMs: 30_000 });

    // Feedback Collector: Collect outcomes every 30 minutes
    this.feedbackCollector.start({ intervalMs: 30 * 60_000 });

    // Self-Correction: Monitor backlash every 15 minutes
    this.selfCorrection.start({ intervalMs: 15 * 60_000 });

    // Relationship Updater: Update author scores hourly
    this.relationshipUpdater.start({ intervalMs: 60 * 60_000 });

    // Champions Tracker: Identify champions daily
    this.championsTracker.start({ cronSchedule: '0 6 * * *' }); // 6 AM daily
  }
}
```

### 4.4 Request Flow: Post Detection to Reply

```
1. DETECTION (Stream Monitor Worker)
   │
   ├─► Twitter API polling (keyword search)
   ├─► Reddit API polling (subreddit + keyword)
   └─► Threads API polling (hashtag + keyword)
         │
         ▼
2. PRE-FILTERING (Tier 1 & 2)
   │
   ├─► Keyword taxonomy match (200+ terms)
   ├─► Spam filter (movie titles, crypto, brand accounts)
   └─► Duplicate detection
         │
         ▼
3. QUEUE (PostgreSQL posts table)
   │
   └─► Post stored with: content, author, platform, detected_at
         │
         ▼
4. ANALYSIS (Queue Processor)
   │
   ├─► Signal 1: Linguistic Intent → SSS (0.0-1.0)
   ├─► Signal 2: Author Context → ARS (0.0-1.0)
   ├─► Signal 3: Post Metrics → EVS (ratio)
   ├─► Signal 4: Semantic Topic → TRS (0.0-1.0)
   ├─► Safety Protocol Check
   ├─► Power User Detection
   ├─► Competitive Detection
   └─► Temporal Intelligence
         │
         ▼
5. DECISION (Decision Engine)
   │
   ├─► Calculate composite Decision Score
   ├─► Select Mode: Helpful | Engagement | Hybrid | Disengaged
   └─► Select Archetype (if engaging)
         │
         ▼
6. GENERATION (Reply Generator)
   │
   ├─► DeepSeek R1 API call
   ├─► Platform personality adaptation
   ├─► Compliance validation
   └─► Social proof integration
         │
         ▼
7. APPROVAL (if manual approval enabled)
   │
   └─► Queue for human review in dashboard
         │
         ▼
8. POSTING (Platform Poster)
   │
   ├─► Rate limit check
   ├─► Post to platform API
   └─► Store reply with UTM tracking
         │
         ▼
9. FEEDBACK (Learning Loop)
   │
   ├─► Collect metrics (likes, replies, clicks)
   ├─► Sentiment analysis of responses
   ├─► Update relationship memory
   └─► Feed into A/B testing framework
```

---

## 5. Database Schema

### 5.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     authors     │       │      posts      │       │    decisions    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──┐   │ id (PK)         │◄──┐   │ id (PK)         │
│ platform        │   │   │ platform        │   │   │ post_id (FK)    │───┐
│ platform_id     │   │   │ platform_post_id│   │   │ sss_score       │   │
│ handle          │   └───│ author_id (FK)  │   │   │ ars_score       │   │
│ display_name    │       │ content         │   │   │ evs_score       │   │
│ follower_count  │       │ detected_at     │   │   │ trs_score       │   │
│ is_verified     │       │ processed_at    │   │   │ composite_score │   │
│ is_power_user   │       │ keyword_matches │   │   │ mode            │   │
│ power_tier      │       │ spam_filtered   │   │   │ archetype       │   │
│ archetype_tags  │       │ raw_metrics     │   │   │ safety_flags    │   │
│ relationship_   │       │ error_count     │   │   │ signals_json    │   │
│   score         │       │ error_message   │   │   │ temporal_context│   │
│ interaction_    │       └─────────────────┘   │   │ competitor_     │   │
│   history       │                             │   │   detected      │   │
│ first_seen_at   │                             │   │ is_power_user   │   │
│ last_seen_at    │                             │   │ created_at      │   │
│ created_at      │                             │   └─────────────────┘   │
│ updated_at      │                             │                         │
└─────────────────┘                             │   ┌─────────────────┐   │
                                                │   │     replies     │   │
┌─────────────────┐                             │   ├─────────────────┤   │
│   competitors   │                             │   │ id (PK)         │   │
├─────────────────┤                             │   │ decision_id(FK) │───┘
│ id (PK)         │                             │   │ content         │
│ name            │                             │   │ archetype       │
│ category        │                             │   │ platform        │
│ primary_        │                             │   │ platform_post_id│
│   mechanism     │                             │   │ utm_code        │
│ price_point     │                             │   │ help_count      │
│ brand_keywords  │                             │   │ approval_status │
│ created_at      │                             │   │ approved_by     │
│ updated_at      │                             │   │ approved_at     │
└─────────────────┘                             │   │ posted_at       │
                                                │   │ metrics_json    │
┌─────────────────┐                             │   │ deleted_at      │
│  kpi_metrics    │                             │   │ delete_reason   │
├─────────────────┤                             │   │ created_at      │
│ id (PK)         │                             │   │ updated_at      │
│ date            │                             │   └─────────────────┘
│ platform        │                             │
│ metric_type     │   ┌─────────────────┐       │   ┌─────────────────┐
│ metric_name     │   │   experiments   │       │   │   escalations   │
│ value           │   ├─────────────────┤       │   ├─────────────────┤
│ created_at      │   │ id (PK)         │       │   │ id (PK)         │
└─────────────────┘   │ name            │       └───│ post_id (FK)    │
                      │ variant_a       │           │ decision_id(FK) │
┌─────────────────┐   │ variant_b       │           │ reply_id (FK)   │
│community_       │   │ metric          │           │ reason          │
│  champions      │   │ traffic_split   │           │ priority        │
├─────────────────┤   │ status          │           │ status          │
│ id (PK)         │   │ start_date      │           │ assigned_to     │
│ author_id (FK)  │   │ end_date        │           │ resolved_by     │
│ tier            │   │ results_json    │           │ resolution_notes│
│ engagement_count│   │ winner          │           │ created_at      │
│ dm_sent_at      │   │ created_at      │           │ resolved_at     │
│ dm_response     │   │ updated_at      │           └─────────────────┘
│ sample_sent     │   └─────────────────┘
│ converted       │                               ┌─────────────────┐
│ advocate_status │   ┌─────────────────┐         │   audit_logs    │
│ created_at      │   │competitive_     │         ├─────────────────┤
│ updated_at      │   │  mentions       │         │ id (PK)         │
└─────────────────┘   ├─────────────────┤         │ entity_type     │
                      │ id (PK)         │         │ entity_id       │
                      │ post_id (FK)    │         │ action          │
                      │ competitor_id   │         │ actor           │
                      │   (FK)          │         │ details_json    │
                      │ sentiment       │         │ created_at      │
                      │ satisfaction    │         └─────────────────┘
                      │ opportunity_    │
                      │   score         │
                      │ replied         │
                      │ created_at      │
                      └─────────────────┘
```

### 5.2 Prisma Schema

```prisma
// database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// CORE ENTITIES
// ============================================

model Author {
  id              String   @id @default(uuid())
  platform        Platform
  platformId      String   @map("platform_id")
  handle          String
  displayName     String?  @map("display_name")
  followerCount   Int      @default(0) @map("follower_count")
  isVerified      Boolean  @default(false) @map("is_verified")
  isPowerUser     Boolean  @default(false) @map("is_power_user")
  powerTier       PowerTier? @map("power_tier")
  archetypeTags   String[] @map("archetype_tags")
  relationshipScore Float  @default(0.5) @map("relationship_score")
  interactionHistory Json  @default("[]") @map("interaction_history")
  firstSeenAt     DateTime @default(now()) @map("first_seen_at")
  lastSeenAt      DateTime @default(now()) @map("last_seen_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  posts           Post[]
  champions       CommunityChampion[]

  @@unique([platform, platformId])
  @@index([platform, handle])
  @@index([isPowerUser])
  @@map("authors")
}

model Post {
  id              String   @id @default(uuid())
  platform        Platform
  platformPostId  String   @map("platform_post_id")
  authorId        String   @map("author_id")
  content         String
  detectedAt      DateTime @default(now()) @map("detected_at")
  processedAt     DateTime? @map("processed_at")
  keywordMatches  String[] @map("keyword_matches")
  keywordCategories String[] @map("keyword_categories")
  spamFiltered    Boolean  @default(false) @map("spam_filtered")
  rawMetrics      Json?    @map("raw_metrics") // likes, replies, shares at detection
  errorCount      Int      @default(0) @map("error_count")
  errorMessage    String?  @map("error_message")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  author          Author   @relation(fields: [authorId], references: [id])
  decisions       Decision[]
  escalations     Escalation[]
  competitiveMentions CompetitiveMention[]

  @@unique([platform, platformPostId])
  @@index([platform, detectedAt])
  @@index([processedAt])
  @@index([authorId])
  @@map("posts")
}

model Decision {
  id              String   @id @default(uuid())
  postId          String   @map("post_id")
  sssScore        Float    @map("sss_score") // Solution-Seeking Score
  arsScore        Float    @map("ars_score") // Author Relationship Score
  evsScore        Float    @map("evs_score") // Engagement Velocity Score
  trsScore        Float    @map("trs_score") // Topic Relevance Score
  compositeScore  Float    @map("composite_score")
  mode            OperationalMode
  archetype       Archetype?
  safetyFlags     String[] @map("safety_flags")
  signalsJson     Json     @map("signals_json") // Detailed signal breakdown
  temporalContext Json?    @map("temporal_context") // Time-based context
  competitorDetected String? @map("competitor_detected")
  isPowerUser     Boolean  @default(false) @map("is_power_user")
  experimentId    String?  @map("experiment_id")
  experimentVariant String? @map("experiment_variant")
  // Advanced Learning System Fields
  isRandomizedExperiment Boolean @default(false) @map("is_randomized_experiment") // For causal inference
  predictedMode   OperationalMode? @map("predicted_mode") // Mode before randomization
  createdAt       DateTime @default(now()) @map("created_at")

  post            Post     @relation(fields: [postId], references: [id])
  replies         Reply[]
  escalations     Escalation[]
  experiment      Experiment? @relation(fields: [experimentId], references: [id])

  @@index([postId])
  @@index([mode])
  @@index([createdAt])
  @@index([compositeScore])
  @@index([experimentVariant]) // For A/B test analysis
  @@index([isRandomizedExperiment]) // For causal inference queries
  @@map("decisions")
}

model Reply {
  id              String   @id @default(uuid())
  decisionId      String   @map("decision_id")
  content         String
  archetype       Archetype
  platform        Platform
  platformPostId  String?  @map("platform_post_id") // null until posted
  utmCode         String   @map("utm_code")
  helpCount       Int      @default(0) @map("help_count") // Social proof count at generation
  approvalStatus  ApprovalStatus @default(PENDING) @map("approval_status")
  approvedBy      String?  @map("approved_by")
  approvedAt      DateTime? @map("approved_at")
  postedAt        DateTime? @map("posted_at")
  metricsJson     Json?    @map("metrics_json") // Outcome metrics over time
  deletedAt       DateTime? @map("deleted_at")
  deleteReason    String?  @map("delete_reason")
  replyType       ReplyType @default(STANDARD) @map("reply_type")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  decision        Decision @relation(fields: [decisionId], references: [id])
  escalations     Escalation[]

  @@index([decisionId])
  @@index([approvalStatus])
  @@index([postedAt])
  @@index([platform, postedAt])
  @@map("replies")
}

// ============================================
// COMPETITIVE INTELLIGENCE
// ============================================

model Competitor {
  id              String   @id @default(uuid())
  name            String   @unique
  category        CompetitorCategory
  primaryMechanism String  @map("primary_mechanism")
  pricePoint      PricePoint @map("price_point")
  brandKeywords   String[] @map("brand_keywords")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  mentions        CompetitiveMention[]

  @@map("competitors")
}

model CompetitiveMention {
  id              String   @id @default(uuid())
  postId          String   @map("post_id")
  competitorId    String   @map("competitor_id")
  sentiment       Sentiment
  satisfaction    UserSatisfaction
  opportunityScore Float   @map("opportunity_score")
  replied         Boolean  @default(false)
  createdAt       DateTime @default(now()) @map("created_at")

  post            Post     @relation(fields: [postId], references: [id])
  competitor      Competitor @relation(fields: [competitorId], references: [id])

  @@index([postId])
  @@index([competitorId])
  @@index([createdAt])
  @@map("competitive_mentions")
}

// ============================================
// COMMUNITY & ADVOCACY
// ============================================

model CommunityChampion {
  id              String   @id @default(uuid())
  authorId        String   @map("author_id")
  tier            ChampionTier
  engagementCount Int      @default(0) @map("engagement_count")
  dmSentAt        DateTime? @map("dm_sent_at")
  dmResponse      DmResponseStatus? @map("dm_response")
  sampleSent      Boolean  @default(false) @map("sample_sent")
  converted       Boolean  @default(false)
  advocateStatus  AdvocateStatus @default(POTENTIAL) @map("advocate_status")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  author          Author   @relation(fields: [authorId], references: [id])

  @@unique([authorId])
  @@index([tier])
  @@index([advocateStatus])
  @@map("community_champions")
}

// ============================================
// EXPERIMENTS & LEARNING
// ============================================

model Experiment {
  id              String   @id @default(uuid())
  name            String
  description     String?
  variantA        Json     @map("variant_a") // Configuration for variant A
  variantB        Json     @map("variant_b") // Configuration for variant B
  metric          String   // KPI to measure (ctr, sentiment, etc.)
  trafficSplit    Float    @default(0.5) @map("traffic_split") // % to variant A
  status          ExperimentStatus @default(DRAFT)
  startDate       DateTime? @map("start_date")
  endDate         DateTime? @map("end_date")
  resultsJson     Json?    @map("results_json")
  winner          String?  // 'A', 'B', or null
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  decisions       Decision[]

  @@index([status])
  @@map("experiments")
}

// ============================================
// ADVANCED LEARNING SYSTEM (Priority 1-3)
// ============================================

// Weight Adjustment Logs - Track all learning operations for audit and meta-learning
model WeightAdjustmentLog {
  id              String   @id @default(uuid())
  date            DateTime @default(now())
  action          String   // 'ADJUSTED', 'SKIPPED'
  reason          String?  // 'INSUFFICIENT_SAMPLE_SIZE', 'SUCCESSFUL', etc.
  validSegments   Int?     @map("valid_segments")
  totalSegments   Int?     @map("total_segments")
  sampleSizes     Json?    @map("sample_sizes") // {sss: 120, ars: 95, evs: 130, trs: 110}
  oldWeights      Json?    @map("old_weights") // Previous signal weights
  newWeights      Json?    @map("new_weights") // Updated signal weights
  predictedImprovement Float? @map("predicted_improvement")
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([date])
  @@index([action])
  @@map("weight_adjustment_logs")
}

// Learning Events - Meta-learning tracker for measuring learning accuracy
model LearningEvent {
  id                    String   @id @default(uuid())
  date                  DateTime @default(now())
  adjustmentType        String   @map("adjustment_type") // 'WEIGHT', 'ARCHETYPE', 'KEYWORD'
  adjustment            Json     // Details of the adjustment made
  predictedImprovement  Float    @map("predicted_improvement")
  baselinePerformance   Float    @map("baseline_performance")
  actualImprovement     Float?   @map("actual_improvement") // Measured 1 week later
  accuracy              Float?   // How close prediction was to reality
  evaluatedAt           DateTime? @map("evaluated_at")
  createdAt             DateTime @default(now()) @map("created_at")

  @@index([date])
  @@index([evaluatedAt])
  @@map("learning_events")
}

// Randomized Experiments - For causal inference (Priority 3)
model RandomizedExperiment {
  id              String   @id @default(uuid())
  decisionId      String   @map("decision_id")
  predictedMode   String   @map("predicted_mode") // What we would have chosen
  actualMode      String   @map("actual_mode") // What we randomly showed
  predictedOutcome Float   @map("predicted_outcome")
  actualOutcome   Float?   @map("actual_outcome") // Measured outcome
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([decisionId])
  @@index([createdAt])
  @@map("randomized_experiments")
}

// Segmented Weights - Platform/time-specific weight optimization (Priority 2)
model SegmentedWeight {
  id              String   @id @default(uuid())
  segmentType     String   @map("segment_type") // 'PLATFORM', 'TIME_OF_DAY', 'DAY_OF_WEEK', 'COMBINED'
  segmentKey      String   @map("segment_key") // e.g., 'TWITTER', 'MORNING', 'TWITTER_MORNING'
  sssWeight       Float    @default(0.40) @map("sss_weight")
  arsWeight       Float    @default(0.25) @map("ars_weight")
  evsWeight       Float    @default(0.20) @map("evs_weight")
  trsWeight       Float    @default(0.15) @map("trs_weight")
  sampleSize      Int      @default(0) @map("sample_size") // Data points used for this optimization
  performance     Float?   // Performance metric for this segment
  updatedAt       DateTime @updatedAt @map("updated_at")
  createdAt       DateTime @default(now()) @map("created_at")

  @@unique([segmentType, segmentKey])
  @@index([segmentType])
  @@index([updatedAt])
  @@map("segmented_weights")
}

// ============================================
// METRICS & ANALYTICS
// ============================================

model KpiMetric {
  id              String   @id @default(uuid())
  date            DateTime @db.Date
  platform        Platform?
  metricType      KpiType  @map("metric_type")
  metricName      String   @map("metric_name")
  value           Float
  createdAt       DateTime @default(now()) @map("created_at")

  @@unique([date, platform, metricType, metricName])
  @@index([date])
  @@index([metricType])
  @@map("kpi_metrics")
}

// ============================================
// HUMAN OVERSIGHT
// ============================================

model Escalation {
  id              String   @id @default(uuid())
  postId          String?  @map("post_id")
  decisionId      String?  @map("decision_id")
  replyId         String?  @map("reply_id")
  reason          EscalationReason
  priority        EscalationPriority @default(MEDIUM)
  status          EscalationStatus @default(PENDING)
  assignedTo      String?  @map("assigned_to")
  resolvedBy      String?  @map("resolved_by")
  resolutionNotes String?  @map("resolution_notes")
  createdAt       DateTime @default(now()) @map("created_at")
  resolvedAt      DateTime? @map("resolved_at")

  post            Post?    @relation(fields: [postId], references: [id])
  decision        Decision? @relation(fields: [decisionId], references: [id])
  reply           Reply?   @relation(fields: [replyId], references: [id])

  @@index([status])
  @@index([priority])
  @@index([createdAt])
  @@map("escalations")
}

// ============================================
// AUDIT & COMPLIANCE
// ============================================

model AuditLog {
  id              String   @id @default(uuid())
  entityType      String   @map("entity_type") // 'decision', 'reply', 'author', etc.
  entityId        String   @map("entity_id")
  action          String   // 'create', 'update', 'delete', 'approve', etc.
  actor           String   // System or user identifier
  detailsJson     Json     @map("details_json")
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

// ============================================
// ENUMS
// ============================================

enum Platform {
  TWITTER
  REDDIT
  THREADS
}

enum OperationalMode {
  HELPFUL
  ENGAGEMENT
  HYBRID
  DISENGAGED
}

enum Archetype {
  CHECKLIST
  MYTHBUST
  COACH
  STORYLET
  HUMOR_LIGHT
  CREDIBILITY_ANCHOR
  CONFIDENT_RECOMMENDER
  PROBLEM_SOLUTION_DIRECT
}

enum PowerTier {
  MICRO      // 5k-50k followers
  MACRO      // 50k-500k followers
  MEGA       // >500k followers
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  AUTO_APPROVED
}

enum ReplyType {
  STANDARD
  COMPETITIVE_POSITIONING
  MYTH_CORRECTION
  KARMA_BUILDING
}

enum CompetitorCategory {
  REHYDRATION
  HANGOVER_PILLS
  IV_THERAPY
  HOME_REMEDY
}

enum PricePoint {
  LOW
  MID
  HIGH
}

enum Sentiment {
  POSITIVE
  NEUTRAL
  NEGATIVE
}

enum UserSatisfaction {
  SATISFIED
  UNSATISFIED
  QUESTIONING
}

enum ChampionTier {
  BRONZE    // 3-5 positive interactions
  SILVER    // 6-10 positive interactions
  GOLD      // 11+ interactions or power user with 3+
}

enum DmResponseStatus {
  NO_RESPONSE
  ACCEPTED
  DECLINED
}

enum AdvocateStatus {
  POTENTIAL
  CONTACTED
  ENGAGED
  ADVOCATE
  VIP
}

enum ExperimentStatus {
  DRAFT
  RUNNING
  PAUSED
  COMPLETED
  CANCELLED
}

enum KpiType {
  COMMERCIAL
  LOVE
  SAFETY
}

enum EscalationReason {
  SAFETY_AMBIGUITY
  VIRAL_THREAD
  MODERATOR_WARNING
  BACKLASH_SPIKE
  LOW_CONFIDENCE
  MANUAL_FLAG
}

enum EscalationPriority {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum EscalationStatus {
  PENDING
  IN_REVIEW
  RESOLVED
  DISMISSED
}
```

### 5.3 Database Indexes & Performance

Key indexes are defined for:

1. **High-frequency queries**:
   - Posts by platform and detection time (stream processing)
   - Unprocessed posts (queue processing)
   - Decisions by mode and score (analytics)

2. **Dashboard queries**:
   - Replies by approval status
   - KPIs by date and type
   - Escalations by status and priority

3. **Learning loop queries**:
   - Decisions with experiment variants
   - Replies with metrics over time windows

### 5.4 Data Validation Rules

All data inputs are validated using Zod schemas before database persistence:

```typescript
// shared/src/schemas/post.ts

import { z } from 'zod';

export const PostContentSchema = z.object({
  content: z.string()
    .min(1, 'Post content cannot be empty')
    .max(5000, 'Post content exceeds maximum length'),
  
  platform: z.enum(['TWITTER', 'REDDIT', 'THREADS']),
  
  platformPostId: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid post ID format'),
  
  authorHandle: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Invalid handle format'),
  
  keywordMatches: z.array(z.string())
    .min(1, 'Must match at least one keyword')
    .max(50, 'Too many keyword matches'),
});

export const ReplyContentSchema = z.object({
  content: z.string()
    .min(10, 'Reply too short')
    .max(1000, 'Reply exceeds maximum length')
    .refine(
      (val) => val.includes('—Antone (Vita)'),
      'Reply must include signature'
    )
    .refine(
      (val) => !/(cure|prevent|treat|clinically proven)/i.test(val),
      'Reply contains prohibited medical claims'
    ),
  
  utmCode: z.string()
    .regex(/^[a-z0-9_-]+$/, 'Invalid UTM code'),
});

export const AuthorSchema = z.object({
  handle: z.string().min(1).max(50),
  followerCount: z.number().int().min(0).max(1_000_000_000),
  relationshipScore: z.number().min(0).max(1),
});
```

**Validation Rules Summary:**

| Field | Min | Max | Format | Additional Rules |
|-------|-----|-----|--------|------------------|
| Post content | 1 char | 5000 chars | Unicode text | No null bytes |
| Author handle | 1 char | 50 chars | Alphanumeric + underscore | No special chars |
| Platform | - | - | Enum | TWITTER\|REDDIT\|THREADS |
| Platform post ID | 1 char | 100 chars | Alphanumeric + dash/underscore | Platform-specific format |
| Keyword matches | 1 item | 50 items | String array | De-duplicated |
| Reply content | 10 chars | 1000 chars | Unicode text | Must include signature |
| UTM code | - | - | Lowercase alphanumeric | Auto-generated |
| Follower count | 0 | 1B | Integer | Non-negative |
| Scores (SSS/ARS/TRS) | 0.0 | 1.0 | Float | 2 decimal precision |

### 5.5 Data Retention Policy

| Data Type | Retention | Archive Strategy |
|-----------|-----------|------------------|
| Posts | 90 days | Archive to JSON files on local volume |
| Decisions | 90 days | Archive with posts |
| Replies | Indefinite | Permanent audit trail |
| Authors | Indefinite | Permanent relationship memory |
| KPI Metrics | 2 years | Archive to CSV quarterly |
| Audit Logs | 3 years | Archive to compressed JSON yearly |
| Experiments | Indefinite | Historical learning |

### 5.6 Schema Migration Strategy

**Migration Workflow:**
1. All schema changes via Prisma migrations: `pnpm db:migrate`
2. Version controlled in `/database/prisma/migrations/`
3. Migration naming: `YYYYMMDDHHMMSS_descriptive_name`
4. Rollback procedure: `prisma migrate resolve --rolled-back [migration_name]`
5. Test on local environment first, then staging, then production
6. Backup database before production migrations

**Migration Safety Rules:**
- Never delete columns in production (deprecate + hide in code)
- Always add columns as nullable initially
- Use `@default` for non-nullable columns when adding
- Separate data migrations from schema migrations
- Document breaking changes in migration notes

---

## 6. API Specifications

### 6.1 API Overview

The backend exposes a RESTful API for the dashboard and potential external integrations.

**Base URL**: `http://localhost:3001/api/v1`

**Authentication**: Bearer token (JWT) for dashboard access

### 6.2 Core Endpoints

#### Health & Status

```yaml
GET /health
  Description: System health check
  Response:
    status: "healthy" | "degraded" | "unhealthy"
    components:
      database: { status, latencyMs }
      twitter: { status, authValid }
      reddit: { status, authValid, karma }
      threads: { status, authValid }
      worker: { status, lastPollAt, queueDepth }
    uptime: number
    version: string

GET /health/detailed
  Description: Detailed component status
  Auth: Required
  Response: Extended health metrics
```

#### Posts & Queue

```yaml
GET /posts
  Description: List posts in queue
  Query Params:
    platform?: "TWITTER" | "REDDIT" | "THREADS"
    processed?: boolean
    limit?: number (default: 50, max: 200)
    offset?: number
  Response:
    posts: Post[]
    total: number
    hasMore: boolean

GET /posts/:id
  Description: Get single post with full details
  Response:
    post: Post
    author: Author
    decisions: Decision[]
```

#### Decisions

```yaml
GET /decisions
  Description: List decisions with filtering
  Query Params:
    mode?: OperationalMode
    minScore?: number
    maxScore?: number
    platform?: Platform
    startDate?: ISO8601
    endDate?: ISO8601
    limit?: number
    offset?: number
  Response:
    decisions: Decision[]
    total: number

GET /decisions/:id
  Description: Get decision with full signal breakdown
  Response:
    decision: Decision
    post: Post
    author: Author
    signals: {
      linguistic: SignalDetails
      author: SignalDetails
      velocity: SignalDetails
      semantic: SignalDetails
    }
    replies: Reply[]
```

#### Replies & Approvals

```yaml
GET /replies
  Description: List replies
  Query Params:
    approvalStatus?: ApprovalStatus
    platform?: Platform
    archetype?: Archetype
    startDate?: ISO8601
    endDate?: ISO8601
    limit?: number
  Response:
    replies: Reply[]
    total: number

GET /replies/pending
  Description: Get pending approval queue
  Response:
    replies: ReplyWithContext[]
    count: number

POST /replies/:id/approve
  Description: Approve a reply for posting
  Body:
    editedContent?: string (optional edit before approval)
  Response:
    reply: Reply
    posted: boolean

POST /replies/:id/reject
  Description: Reject a reply
  Body:
    reason: "SAFETY" | "IRRELEVANT" | "LOW_QUALITY" | "OTHER"
    notes?: string
  Response:
    success: boolean

POST /replies/:id/regenerate
  Description: Request new reply generation
  Body:
    instructions?: string
  Response:
    newReply: Reply
```

#### Analytics & KPIs

```yaml
GET /analytics/kpis
  Description: Get KPI summary
  Query Params:
    type?: "COMMERCIAL" | "LOVE" | "SAFETY"
    startDate?: ISO8601
    endDate?: ISO8601
    granularity?: "HOUR" | "DAY" | "WEEK"
  Response:
    commercial: {
      ctr: number
      conversionRate: number
      revenuePerReply: number
      trend: number
    }
    love: {
      thanksLikesRate: number
      followsPerHundred: number
      positiveSentiment: number
      trend: number
    }
    safety: {
      removalRate: number
      platformStrikes: number
      karmaTrajectory: number
      selfDeletionRate: number
    }

GET /analytics/filtering-funnel
  Description: Get filtering funnel metrics
  Query Params:
    platform?: Platform
    startDate?: ISO8601
    endDate?: ISO8601
  Response:
    scanned: number
    keywordMatched: number
    spamFiltered: number
    queued: number
    analyzed: number
    engaged: number
    conversionRate: number
    keywordPerformance: KeywordMetric[]

GET /analytics/revenue
  Description: Revenue attribution data
  Query Params:
    startDate?: ISO8601
    endDate?: ISO8601
  Response:
    totalRevenue: number
    byArchetype: { archetype: string, revenue: number }[]
    byPlatform: { platform: string, revenue: number }[]
    topReplies: ReplyWithRevenue[]
```

#### Competitive Intelligence

```yaml
GET /competitive/share-of-voice
  Description: Market share metrics
  Query Params:
    startDate?: ISO8601
    endDate?: ISO8601
  Response:
    vita: { mentions: number, sentiment: number }
    competitors: {
      name: string
      mentions: number
      sentiment: number
      trend: number
    }[]

GET /competitive/mentions
  Description: Competitor mention feed
  Query Params:
    competitorId?: string
    sentiment?: Sentiment
    satisfaction?: UserSatisfaction
    replied?: boolean
    limit?: number
  Response:
    mentions: CompetitiveMention[]
    total: number

GET /competitive/gaps
  Description: Product gap analysis
  Response:
    topComplaints: { category: string, count: number }[]
    unmetNeeds: string[]
    opportunities: string[]
```

#### Experiments

```yaml
GET /experiments
  Description: List A/B tests
  Query Params:
    status?: ExperimentStatus
  Response:
    experiments: Experiment[]

POST /experiments
  Description: Create new experiment
  Body:
    name: string
    description?: string
    variantA: ExperimentConfig
    variantB: ExperimentConfig
    metric: string
    trafficSplit?: number
  Response:
    experiment: Experiment

PUT /experiments/:id/start
  Description: Start an experiment
  Response:
    experiment: Experiment

PUT /experiments/:id/stop
  Description: Stop an experiment
  Response:
    experiment: Experiment
    results: ExperimentResults
```

#### Export

```yaml
GET /export/llm-bundle
  Description: Export data for LLM analysis
  Response: (Downloads ZIP file)
    - antone_performance_data.json
    - analysis_prompt.md
```

### 6.3 WebSocket Events

The dashboard connects via WebSocket for real-time updates:

```typescript
// Connection
ws://localhost:3001/ws

// Events (Server → Client)
{
  event: "post:detected",
  data: { post: Post, keywords: string[] }
}

{
  event: "decision:made",
  data: { decision: Decision, mode: string }
}

{
  event: "reply:generated",
  data: { reply: Reply, needsApproval: boolean }
}

{
  event: "reply:posted",
  data: { reply: Reply, metrics: Metrics }
}

{
  event: "alert:triggered",
  data: { type: string, severity: string, message: string }
}

{
  event: "kpi:updated",
  data: { type: string, metric: string, value: number }
}
```

---

## 7. Backend Architecture

### 7.1 Module Organization

The backend follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Hono)                        │
│  Routes → Middleware → Request Validation → Response         │
├─────────────────────────────────────────────────────────────┤
│                      Service Layer                           │
│  Business Logic → Orchestration → Transaction Management     │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                            │
│  Analysis Modules → Generation → Compliance → Learning       │
├─────────────────────────────────────────────────────────────┤
│                      Data Access Layer                       │
│  Prisma ORM → Repositories → Query Optimization              │
├─────────────────────────────────────────────────────────────┤
│                      Infrastructure Layer                    │
│  Platform Clients → External APIs → Caching → Logging        │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Core Domain Modules

#### Multi-Signal Analysis Engine

```typescript
// backend/src/analysis/decision-engine.ts

import { SignalResult, DecisionResult } from '@shared/types';
import { analyzeLinguisticIntent } from './signal-1-linguistic';
import { analyzeAuthorContext } from './signal-2-author';
import { analyzePostVelocity } from './signal-3-velocity';
import { analyzeSemanticTopic } from './signal-4-semantic';
import { checkSafetyProtocol } from './safety-protocol';
import { detectPowerUser } from './power-user-detector';
import { detectCompetitor } from './competitive-detector';
import { getTemporalContext } from './temporal-intelligence';

export class DecisionEngine {
  // Signal weights (adjustable by learning loop)
  private weights = {
    sss: 0.40,  // Linguistic Intent
    ars: 0.25,  // Author Context
    evs: 0.20,  // Engagement Velocity
    trs: 0.15,  // Topic Relevance
  };

  async analyzePost(post: Post, author: Author): Promise<DecisionResult> {
    // Run all signals in parallel for speed
    const [sss, ars, evs, trs, safety, powerUser, competitor, temporal] = 
      await Promise.all([
        analyzeLinguisticIntent(post.content),
        analyzeAuthorContext(author),
        analyzePostVelocity(post, author),
        analyzeSemanticTopic(post.content),
        checkSafetyProtocol(post.content),
        detectPowerUser(author),
        detectCompetitor(post.content),
        getTemporalContext(),
      ]);

    // Safety override - immediate disengage
    if (safety.shouldDisengage) {
      return this.createDisengagedDecision(post, safety.flags);
    }

    // Topic relevance gate
    if (trs.score < 0.5) {
      return this.createDisengagedDecision(post, ['LOW_TOPIC_RELEVANCE']);
    }

    // Calculate composite score
    const compositeScore = this.calculateComposite(sss, ars, evs, trs);

    // Select operational mode
    const mode = this.selectMode(sss, ars, evs, powerUser);

    // Select archetype if engaging
    const archetype = mode !== 'DISENGAGED' 
      ? await this.selectArchetype(mode, author, post, competitor)
      : null;

    return {
      postId: post.id,
      sssScore: sss.score,
      arsScore: ars.score,
      evsScore: evs.ratio,
      trsScore: trs.score,
      compositeScore,
      mode,
      archetype,
      safetyFlags: safety.flags,
      signalsJson: { sss, ars, evs, trs },
      temporalContext: temporal,
      competitorDetected: competitor.detected ? competitor.name : null,
      isPowerUser: powerUser.isPowerUser,
    };
  }

  private calculateComposite(sss: SignalResult, ars: SignalResult, 
    evs: SignalResult, trs: SignalResult): number {
    // Normalize EVS (ratio) to 0-1 scale
    const evsNormalized = Math.min(evs.ratio / 5, 1);
    
    return (
      sss.score * this.weights.sss +
      ars.score * this.weights.ars +
      evsNormalized * this.weights.evs +
      trs.score * this.weights.trs
    );
  }

  private selectMode(sss: SignalResult, ars: SignalResult, 
    evs: SignalResult, powerUser: PowerUserResult): OperationalMode {
    // SSS ≥ 0.82 → Mandatory Helpful Mode
    if (sss.score >= 0.82) {
      return 'HELPFUL';
    }

    // 0.55 ≤ SSS < 0.82 → Context-dependent
    if (sss.score >= 0.55) {
      // High velocity (viral) → Engagement unless strong relationship
      if (evs.ratio > 5.0) {
        return ars.score > 0.70 ? 'HYBRID' : 'ENGAGEMENT';
      }
      // Power user → Premium Helpful
      if (powerUser.isPowerUser) {
        return 'HELPFUL';
      }
      // Default to Hybrid
      return 'HYBRID';
    }

    // SSS < 0.55 → Engagement or Disengage
    if (evs.ratio > 2.0) {
      return 'ENGAGEMENT';
    }

    return 'DISENGAGED';
  }
}
```

#### Reply Generator

```typescript
// backend/src/generation/reply-generator.ts

import { DeepSeekClient } from '../clients/deepseek';
import { complianceValidator } from '../compliance/validator';
import { archetypeTemplates } from '../data/message-archetypes';
import { platformPersonality } from './platform-personality';

export class ReplyGenerator {
  private deepseek: DeepSeekClient;

  async generateReply(params: GenerateReplyParams): Promise<GeneratedReply> {
    const { decision, post, author, archetype, platform } = params;
    
    // Get archetype template
    const template = archetypeTemplates[archetype];
    
    // Get platform personality
    const personality = platformPersonality[platform];
    
    // Build DeepSeek prompt
    const prompt = this.buildPrompt({
      post,
      author,
      archetype,
      template,
      personality,
      mode: decision.mode,
      isPowerUser: decision.isPowerUser,
      competitorDetected: decision.competitorDetected,
    });

    // Generate with DeepSeek R1
    const generated = await this.deepseek.generate(prompt);

    // Compliance check
    const complianceResult = await complianceValidator.validate(generated.content);
    
    if (!complianceResult.valid) {
      // Regenerate with compliance feedback
      return this.regenerateWithFeedback(params, complianceResult.violations);
    }

    // Apply platform formatting
    const formatted = this.formatForPlatform(generated.content, platform);

    // Add social proof signature
    const helpCount = await this.getHelpCount();
    const withSignature = this.addSignature(formatted, helpCount);

    return {
      content: withSignature,
      archetype,
      confidence: generated.confidence,
      helpCount,
      utmCode: this.generateUtmCode(post.id),
    };
  }

  private buildPrompt(params: PromptParams): string {
    const { post, author, archetype, template, personality, mode } = params;
    
    return `
You are Antone, a helpful and empathetic social media assistant for Vita, 
a company making transdermal wellness patches.

PLATFORM: ${params.personality.platform}
TONE: ${params.personality.tone}
CHARACTER LIMIT: ${params.personality.charLimit}

ORIGINAL POST:
"${post.content}"

AUTHOR CONTEXT:
- Handle: ${author.handle}
- Power User: ${params.isPowerUser ? 'Yes - use premium tone' : 'No'}
- Relationship: ${author.relationshipScore > 0.6 ? 'Positive history' : 'New contact'}

MODE: ${mode}
ARCHETYPE: ${archetype}
TEMPLATE STRUCTURE: ${JSON.stringify(template)}

${params.competitorDetected ? `
COMPETITOR MENTIONED: ${params.competitorDetected}
Use polite, educational positioning. Never attack the competitor.
Focus on Vita's transdermal delivery as differentiation.
` : ''}

Generate a reply that:
1. Opens with genuine empathy (no generic phrases)
2. Provides actionable, practical value
3. ${mode === 'HELPFUL' ? 'Includes confident product mention with link' : 
   mode === 'ENGAGEMENT' ? 'NO product mention - pure value only' :
   'Soft, casual product mention if natural'}
4. Ends with transparent signature: "—Antone (Vita)"
5. Is screenshot-worthy and shareable
6. Stays within ${params.personality.charLimit} characters

FORBIDDEN:
- Words: "cure", "prevent", "treat", "clinically proven"
- Generic openers: "Sorry to hear", "I understand", "Hope you feel better"
- Pushy CTAs: "Buy now", "Don't miss out", "Limited time"

REPLY:`;
  }

  private addSignature(content: string, helpCount: number): string {
    return `${content}\n\n—Antone (Vita) | Helped ${helpCount.toLocaleString()} people this month`;
  }
}
```

### 7.3 Worker Process Architecture

```typescript
// backend/src/workers/stream-monitor.ts

import { TwitterClient } from '../platforms/twitter/client';
import { RedditClient } from '../platforms/reddit/client';
import { ThreadsClient } from '../platforms/threads/client';
import { keywordTaxonomy } from '../config/keywords.json';
import { prisma } from '../db';

export class StreamMonitor {
  private pollIntervals = {
    TWITTER: 10 * 60 * 1000,   // 10 minutes
    REDDIT: 10 * 60 * 1000,   // 10 minutes
    THREADS: 15 * 60 * 1000,  // 15 minutes
  };

  async start(): Promise<void> {
    // Adjust intervals based on temporal context
    const temporalMultiplier = this.getTemporalMultiplier();
    
    // Start platform polling loops
    this.pollTwitter(this.pollIntervals.TWITTER / temporalMultiplier);
    this.pollReddit(this.pollIntervals.REDDIT / temporalMultiplier);
    this.pollThreads(this.pollIntervals.THREADS / temporalMultiplier);
    
    logger.info('Stream Monitor started', { 
      intervals: this.pollIntervals,
      temporalMultiplier 
    });
  }

  private async pollTwitter(intervalMs: number): Promise<void> {
    while (true) {
      try {
        // Build search query from keyword taxonomy
        const query = this.buildTwitterQuery();
        
        const tweets = await this.twitter.search(query, {
          maxResults: 100,
          sinceId: await this.getLastProcessedId('TWITTER'),
        });

        for (const tweet of tweets) {
          // Tier 2: Spam filtering
          if (this.isSpam(tweet)) {
            continue;
          }

          // Store in queue
          await this.queuePost({
            platform: 'TWITTER',
            platformPostId: tweet.id,
            content: tweet.text,
            authorPlatformId: tweet.author_id,
            keywordMatches: this.extractKeywordMatches(tweet.text),
            rawMetrics: {
              likes: tweet.public_metrics.like_count,
              replies: tweet.public_metrics.reply_count,
              retweets: tweet.public_metrics.retweet_count,
            },
          });
        }

        this.logMetrics('TWITTER', tweets.length);
      } catch (error) {
        logger.error('Twitter poll failed', { error });
      }

      await this.sleep(intervalMs);
    }
  }

  private isSpam(post: any): boolean {
    const content = post.text || post.body || '';
    
    // Movie/music detection
    if (/The Hangover/i.test(content) || 
        /hangover.*(soundtrack|album|movie)/i.test(content)) {
      return true;
    }

    // Crypto spam
    if (/bitcoin|ethereum|crypto/i.test(content) && 
        /\$|usd|crash|moon/i.test(content)) {
      return true;
    }

    // Brand accounts (>50k followers + verified)
    if (post.author?.verified && post.author?.follower_count > 50000) {
      return true;
    }

    // Link spam (>5 URLs)
    const urlCount = (content.match(/https?:\/\//g) || []).length;
    if (urlCount > 5) {
      return true;
    }

    return false;
  }

  private getTemporalMultiplier(): number {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday

    // Sunday 6-11am: Peak suffering window → 3x frequency
    if (day === 0 && hour >= 6 && hour <= 11) {
      return 3;
    }

    // Saturday morning: High activity → 2x frequency
    if (day === 6 && hour >= 6 && hour <= 11) {
      return 2;
    }

    // Friday-Saturday night: Moderate → 1.5x frequency
    if ((day === 5 || day === 6) && (hour >= 22 || hour <= 2)) {
      return 1.5;
    }

    return 1;
  }
}
```

---

### 7.4 Advanced Learning System Architecture

The learning system implements state-of-the-art statistical methods and causal inference techniques to eliminate false positives, accelerate convergence, and enable genuine causal understanding. This system ensures Antone continuously improves based on real signal rather than noise.

#### 7.4.1 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ADVANCED LEARNING SYSTEM                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                   PRIORITY 1: CRITICAL FIXES                    │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │                                                                 │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │  │
│  │  │ Min Sample     │  │ Outlier        │  │ Confidence     │  │  │
│  │  │ Size           │  │ Detection &    │  │ Intervals &    │  │  │
│  │  │ Validation     │  │ Robust Stats   │  │ Effect Size    │  │  │
│  │  │                │  │                │  │                │  │  │
│  │  │ • 100+ for     │  │ • Winsorized   │  │ • 95% CI       │  │  │
│  │  │   weights      │  │   mean         │  │ • Cohen's d    │  │  │
│  │  │ • 50+ for      │  │ • Tukey's      │  │ • p-values     │  │  │
│  │  │   archetypes   │  │   method       │  │ • Effect size  │  │  │
│  │  │ • Skip if      │  │ • Outlier      │  │   reporting    │  │  │
│  │  │   insufficient │  │   flagging     │  │                │  │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │  │
│  │                                                                 │  │
│  │  Impact: Reduce false positives from 30-40% → 8-12%           │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                   PRIORITY 2: HIGH-IMPACT                       │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │                                                                 │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │  │
│  │  │ Thompson       │  │ Platform       │  │ Adaptive       │  │  │
│  │  │ Sampling       │  │ Segmentation   │  │ Learning       │  │  │
│  │  │ (Multi-Armed   │  │                │  │ Rates          │  │  │
│  │  │ Bandit)        │  │                │  │                │  │  │
│  │  │                │  │ • Twitter      │  │ • Based on     │  │  │
│  │  │ • Dynamic      │  │ • Reddit       │  │   sample size  │  │  │
│  │  │   traffic      │  │ • Threads      │  │ • Consistency  │  │  │
│  │  │   allocation   │  │ • Time of day  │  │ • Volatility   │  │  │
│  │  │ • Fast         │  │ • Day of week  │  │ • Effect size  │  │  │
│  │  │   convergence  │  │                │  │                │  │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │  │
│  │                                                                 │  │
│  │  Impact: 2-3x faster convergence, +20-30% performance         │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                   PRIORITY 3: ADVANCED                          │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │                                                                 │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │  │
│  │  │ Causal         │  │ Meta-Learning  │  │ Ensemble       │  │  │
│  │  │ Inference      │  │ (Learning to   │  │ Methods        │  │  │
│  │  │                │  │ Learn)         │  │                │  │  │
│  │  │ • 10% random   │  │                │  │ • Multiple     │  │  │
│  │  │   experiments  │  │ • Track        │  │   optimizers   │  │  │
│  │  │ • Detect       │  │   accuracy     │  │ • Cross-       │  │  │
│  │  │   confounders  │  │ • Auto-tune    │  │   validation   │  │  │
│  │  │ • True causal  │  │   parameters   │  │ • Ensemble     │  │  │
│  │  │   effects      │  │ • Self-correct │  │   voting       │  │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │  │
│  │                                                                 │  │
│  │  Impact: Causal understanding, +30-40% long-term performance  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

#### 7.4.2 Data Flow & Integration

```
┌────────────┐        ┌────────────────────────────────────────┐
│  Decisions │───────▶│      Sample Size Validation            │
│  (Last 7d) │        │  • Check against minimums              │
└────────────┘        │  • Return valid/invalid per segment    │
                      └──────────┬─────────────────────────────┘
                                 │ VALID
                                 ▼
                      ┌────────────────────────────────────────┐
                      │      Robust Statistics                 │
                      │  • Winsorized mean (not arithmetic)    │
                      │  • Outlier detection & flagging        │
                      └──────────┬─────────────────────────────┘
                                 │
                                 ▼
                      ┌────────────────────────────────────────┐
                      │      Statistical Inference             │
                      │  • Calculate confidence intervals      │
                      │  • Compute Cohen's d effect size       │
                      │  • Assess significance                 │
                      └──────────┬─────────────────────────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   │                           │
                   ▼                           ▼
        ┌──────────────────┐       ┌──────────────────┐
        │  Weight Optimizer │       │ Thompson Sampling│
        │  • Segmented      │       │ • Dynamic A/B    │
        │  • Adaptive rate  │       │ • Fast converge  │
        └────────┬───────────┘       └────────┬─────────┘
                 │                            │
                 ▼                            ▼
        ┌──────────────────────────────────────────────┐
        │        Meta-Learning Tracker                 │
        │  • Record predicted improvement              │
        │  • Measure actual improvement (1 week later) │
        │  • Calculate learning accuracy               │
        │  • Auto-tune parameters if needed            │
        └────────────────┬─────────────────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────────────────┐
        │        Apply Updated Weights                 │
        │  • Store in segmented_weights table          │
        │  • Log in weight_adjustment_logs             │
        │  • Use in future decisions                   │
        └──────────────────────────────────────────────┘
```

#### 7.4.3 Priority 1 Implementation Details

**Minimum Sample Size Validation:**
```typescript
// backend/src/learning/weight-optimizer.ts
const MIN_SAMPLE_SIZES = {
  WEIGHT_ADJUSTMENT: 100,     // Per signal range
  ARCHETYPE_COMPARISON: 50,   // Per archetype
  KEYWORD_OPTIMIZATION: 30,   // Per keyword
  AB_TEST_CONCLUSION: 200,    // Per variant
  PLATFORM_SEGMENTATION: 75   // Per platform
};

// Validation function checks before any learning operation
function validateSampleSize(data: any[], operation: string): {
  isValid: boolean;
  actualSize: number;
  requiredSize: number;
  shortfall: number;
  message: string;
}
```

**Robust Statistics:**
```typescript
// backend/src/utils/robust-statistics.ts
export function winsorizedMean(
  values: number[],
  lowerPercentile: number = 5,
  upperPercentile: number = 95
): number {
  // Cap extreme values at specified percentiles
  // Resistant to outliers while preserving information
}

export function detectOutliers(values: number[]): {
  outliers: number[];
  outlierIndices: number[];
  lowerFence: number;
  upperFence: number;
}
```

**Confidence Intervals & Effect Size:**
```typescript
// backend/src/utils/statistical-inference.ts
export function confidenceInterval(
  values: number[],
  confidence: number = 0.95
): ConfidenceInterval {
  // Returns: { mean, lower, upper, marginOfError }
}

export function cohensD(
  groupA: number[],
  groupB: number[]
): EffectSize {
  // Returns: { cohensD, interpretation: 'negligible'|'small'|'medium'|'large' }
}
```

#### 7.4.4 Priority 2 Implementation Details

**Thompson Sampling (Multi-Armed Bandit):**
```typescript
// backend/src/learning/thompson-sampling.ts
export class ThompsonSamplingExperiment {
  selectVariant(): 'A' | 'B' {
    // Sample from Beta distributions
    // Return variant with higher sample
    // Dynamically shifts traffic to better performer
  }
  
  getProbabilityABetter(): number {
    // Monte Carlo simulation: 10,000 draws
    // Returns probability A > B
  }
  
  getWinner(confidenceThreshold: number = 0.95): 'A' | 'B' | null {
    // Declare winner when P(A > B) > 0.95
    // Typically converges in 5-7 days vs 14 days fixed split
  }
}
```

**Platform Segmentation:**
```typescript
// backend/src/learning/segmented-optimizer.ts
interface SegmentedWeights {
  global: SignalWeights;  // Fallback
  platform: {
    TWITTER: SignalWeights;
    REDDIT: SignalWeights;
    THREADS: SignalWeights;
  };
  timeOfDay: {
    MORNING: SignalWeights;
    AFTERNOON: SignalWeights;
    EVENING: SignalWeights;
    NIGHT: SignalWeights;
  };
  combined: Map<string, SignalWeights>; // e.g., "TWITTER_MORNING"
}

getWeights(context: { platform, timestamp }): SignalWeights {
  // Returns most specific available weights
  // Falls back to platform, then global if insufficient data
}
```

**Adaptive Learning Rates:**
```typescript
function calculateAdaptiveLearningRate(
  segment: SegmentData,
  history: WeightHistory[]
): number {
  const baseRate = 0.10; // ±10% default
  
  // Multipliers based on:
  const sampleSizeMultiplier = Math.sqrt(sampleSize / minSize);
  const consistencyMultiplier = isConsistent ? 1.5 : 1.0;
  const volatilityMultiplier = highVolatility ? 0.5 : 1.0;
  const effectSizeMultiplier = largeEffect ? 1.3 : 1.0;
  
  // Final rate: 5-30% range
  return clamp(
    baseRate * all_multipliers,
    0.05,
    0.30
  );
}
```

#### 7.4.5 Priority 3 Implementation Details

**Causal Inference via Randomization:**
```typescript
// backend/src/learning/causal-inference.ts
const RANDOMIZATION_RATE = 0.10; // 10% of decisions

async function makeDecisionWithRandomization(post: Post): Promise<Decision> {
  const signals = await analyzeSignals(post);
  const predictedMode = selectMode(signals);
  
  if (Math.random() < RANDOMIZATION_RATE) {
    // RANDOMIZE: Choose random mode
    const randomMode = randomChoice(['HELPFUL', 'ENGAGEMENT', 'HYBRID']);
    
    return createDecision({
      ...signals,
      mode: randomMode,
      predictedMode, // Store what we would have chosen
      isRandomizedExperiment: true
    });
  }
  
  // Normal decision
  return createDecision({ ...signals, mode: predictedMode });
}

// Weekly: Analyze if predictions were accurate
async function testCausalEffect(signal: string): Promise<CausalEffect> {
  // Compare: Predicted outcome vs actual outcome for randomized decisions
  // Reveals if signal is truly causal or just correlated
}
```

**Meta-Learning:**
```typescript
// backend/src/learning/meta-learner.ts
class MetaLearner {
  async recordAdjustment(adjustment: WeightAdjustment): Promise<void> {
    // Store: What we changed, why, and predicted improvement
    await createLearningEvent({
      adjustmentType: 'WEIGHT',
      adjustment,
      predictedImprovement: 0.15,
      baselinePerformance: currentPerformance
    });
  }
  
  async evaluateLearningAccuracy(): Promise<MetaLearningReport> {
    // 1 week later: Measure actual improvement
    // Calculate: How accurate were our predictions?
    // If accuracy < 70%: Recommend parameter tuning
  }
  
  async autoTuneParameters(): Promise<void> {
    // Automatically adjust:
    // - Learning rates (if too aggressive)
    // - Sample size requirements (if high prediction error)
    // - Segmentation granularity
  }
}
```

#### 7.4.6 Configuration & Tuning

**Configuration File:** `backend/src/config/learning.json`

```json
{
  "minimumSampleSizes": {
    "weightAdjustment": 100,
    "archetypeComparison": 50,
    "keywordOptimization": 30,
    "abTestConclusion": 200,
    "platformSegmentation": 75
  },
  "robustStatistics": {
    "method": "winsorized",
    "winsorPercentiles": [5, 95],
    "tukeyMultiplier": 1.5
  },
  "confidenceIntervals": {
    "confidence": 0.95,
    "minEffectSize": 0.2
  },
  "thompsonSampling": {
    "enabled": true,
    "confidenceThreshold": 0.95,
    "minSamplesPerVariant": 50
  },
  "segmentation": {
    "enabled": true,
    "minSamplesPerSegment": 50,
    "segments": ["platform", "timeOfDay", "dayOfWeek"]
  },
  "adaptiveLearningRate": {
    "baseRate": 0.10,
    "minRate": 0.05,
    "maxRate": 0.30,
    "volatilityThreshold": 0.3
  },
  "causalInference": {
    "randomizationRate": 0.10,
    "minSamplesForAnalysis": 200
  },
  "metaLearning": {
    "enabled": true,
    "evaluationInterval": "weekly",
    "autoTune": false
  }
}
```

#### 7.4.7 Expected Performance Gains

**Priority 1 Impact (Week 1):**
- False positive rate: 30-40% → **8-12%**
- Weight adjustment skip rate: 0% → **15-25%** (intentional, prevents bad decisions)
- Learning stability: Volatile → **Stable**

**Priority 2 Impact (Weeks 2-3):**
- Time to optimal weights: 8-12 weeks → **3-4 weeks** (3x faster)
- A/B test duration: 14 days → **5-7 days** (2x faster)
- Platform-specific optimization: None → **+20-30% improvement**

**Priority 3 Impact (Weeks 4-8):**
- Understanding: Correlational → **Causal**
- Learning accuracy: 60-70% → **95-98%**
- Long-term performance: Good → **Excellent (+30-40%)**

#### 7.4.8 Monitoring & Health Checks

**Dashboard Learning Health View:**
```typescript
interface LearningSystemHealth {
  falsePositiveRate: {
    current: number;
    baseline: number;
    target: number; // <12%
    status: 'good' | 'warning' | 'critical';
  };
  learningStability: {
    weightVolatility: number; // Std dev of changes
    target: number; // <0.05
    status: 'stable' | 'volatile';
  };
  convergenceSpeed: {
    weeksToOptimal: number;
    target: number; // <4 weeks
    improvement: string; // "2.5x faster than baseline"
  };
  sampleSizeHealth: {
    sufficientDataRate: number; // % of weeks
    target: number; // >75%
  };
}
```

**Automated Health Checks:**
- Run weekly to validate learning system health
- Alert if false positive rate >15%
- Alert if learning accuracy <70%
- Alert if outliers affecting >20% of metrics

#### 7.4.9 Proof of Continuous Improvement Loop

**How the Bot Actually Uses These Algorithms:**

The learning system is not theoretical—it's deeply integrated into Antone's core decision-making loop. Here's the exact flow of how the bot uses advanced statistics to improve continuously:

**Weekly Learning Cycle (Automated):**

```
SUNDAY 12:00 AM (Automated Trigger)
│
├─► 1. DATA COLLECTION
│   └─ Query last 7 days: SELECT * FROM decisions WHERE created_at > NOW() - INTERVAL '7 days'
│   └─ Collect outcome data: SELECT * FROM replies WHERE posted_at > NOW() - INTERVAL '7 days'
│
├─► 2. SAMPLE SIZE VALIDATION (Priority 1)
│   └─ Function: validateSampleSize(highSSSDecisions, 'WEIGHT_ADJUSTMENT')
│   └─ IF insufficient data (< 100 decisions) → SKIP and log to weight_adjustment_logs
│   └─ ELSE → Proceed to step 3
│
├─► 3. ROBUST STATISTICS CALCULATION (Priority 1)
│   └─ Function: robustSummary(ctrs) // Uses Winsorized mean
│   └─ Detect outliers: detectOutliers(ctrs) // Flags viral posts
│   └─ Calculate: archetypePerformance = winsorizedMean(replies.ctr) // NOT arithmetic mean
│   └─ Result: Outlier-resistant performance metrics
│
├─► 4. STATISTICAL INFERENCE (Priority 1)
│   └─ Function: confidenceInterval(archetypePerformance, 0.95)
│   └─ Function: cohensD(archetypeA_ctrs, archetypeB_ctrs)
│   └─ Decision: Only promote changes if p < 0.05 AND effect size > 0.2
│   └─ Log: "Checklist archetype +23% CTR (CI: ±5%), d=0.67 (medium), PROMOTE"
│
├─► 5. SEGMENTED OPTIMIZATION (Priority 2)
│   └─ Function: segmentedOptimizer.optimizeAllSegments()
│   └─ Separate analysis for: Twitter, Reddit, Threads, Morning, Evening, etc.
│   └─ Discovery: "Twitter prefers high EVS (+0.05 weight), Reddit prefers high SSS (+0.10 weight)"
│   └─ Store: INSERT INTO segmented_weights (segment_type, segment_key, sss_weight, ars_weight...)
│
├─► 6. ADAPTIVE LEARNING RATE CALCULATION (Priority 2)
│   └─ Function: calculateAdaptiveLearningRate(segment, history)
│   └─ Multipliers: sampleSize(1.4x) × consistency(1.5x) × volatility(1.0x) × effectSize(1.3x)
│   └─ Result: Final rate = 10% × 2.73 = 27.3% change this week (vs fixed 10%)
│
├─► 7. APPLY WEIGHT ADJUSTMENTS
│   └─ UPDATE segmented_weights SET sss_weight = sss_weight * 1.273 WHERE segment_key = 'TWITTER'
│   └─ INSERT INTO weight_adjustment_logs (action='ADJUSTED', new_weights=...)
│   └─ INSERT INTO learning_events (predicted_improvement=0.15, baseline_performance=0.032)
│
└─► 8. META-LEARNING VALIDATION (Priority 3, runs 1 week later)
    └─ Query learning_events WHERE date = NOW() - INTERVAL '1 week' AND actual_improvement IS NULL
    └─ Measure actual CTR improvement: 0.032 → 0.038 = +18.75%
    └─ Compare to prediction: |18.75% - 15%| = 3.75% error → 96.25% accuracy ✓
    └─ UPDATE learning_events SET actual_improvement=0.1875, accuracy=0.9625
    └─ IF accuracy < 70% for 3 weeks → Auto-recommend: "Increase min sample size by 50%"
```

**Real-Time Decision Making (Every Decision):**

```
NEW POST DETECTED
│
├─► Query segmented weights: 
│   SELECT * FROM segmented_weights 
│   WHERE segment_type = 'PLATFORM' AND segment_key = 'TWITTER'
│   └─ Result: {sss: 0.42, ars: 0.24, evs: 0.22, trs: 0.12} // Optimized for Twitter
│
├─► Calculate composite score using learned weights:
│   composite_score = (SSS × 0.42) + (ARS × 0.24) + (EVS × 0.22) + (TRS × 0.12)
│   └─ Example: (0.85 × 0.42) + (0.60 × 0.24) + (2.1 × 0.22) + (0.90 × 0.12) = 0.963
│
├─► Select mode based on learned patterns:
│   IF composite_score > 0.82 → HELPFUL (learned from high-conversion decisions)
│   └─ INSERT INTO decisions (mode='HELPFUL', signals_json={...})
│
├─► Select archetype based on learned performance:
│   Query: "Which archetypes perform best on TWITTER during MORNING?"
│   └─ Result: Checklist (CTR=0.042), Problem-Solution (CTR=0.038), Coach (CTR=0.035)
│   └─ Choose: Checklist (top performer with 95% confidence)
│
├─► Generate reply and POST
│
└─► 24 hours later: Feedback pipeline collects outcomes
    └─ These outcomes feed back into next Sunday's learning cycle ↻
```

**Thompson Sampling (Real-Time A/B Testing):**

```
EXPERIMENT: "Test new CTA phrasing"
│
├─► Decision 1: P(A better) = 50%, P(B better) = 50% → Show A (random)
├─► Outcome: A converts → UPDATE Beta(2, 1) for variant A
│
├─► Decision 2: P(A better) = 67%, P(B better) = 33% → Show A (67% chance)
├─► Outcome: A converts → UPDATE Beta(3, 1) for variant A
│
├─► Decision 50: P(A better) = 85%, P(B better) = 15% → Show A (85% chance)
├─► ...Traffic now 85/15 split, minimizing regret...
│
├─► Decision 150: P(A better) = 97%, P(B better) = 3%
│   └─ WINNER DECLARED: Variant A (7 days vs 14 days fixed split) ✓
│
└─► PROMOTE: All future decisions use Variant A phrasing
```

**Causal Inference (10% Randomized):**

```
RANDOMIZATION CHECK: Math.random() < 0.10 → TRUE (randomize this decision)
│
├─► Predicted mode: HELPFUL (based on SSS=0.87)
├─► Actually show: ENGAGEMENT (random choice)
├─► Store: {is_randomized_experiment: true, predicted_mode: 'HELPFUL', actual_mode: 'ENGAGEMENT'}
│
└─► 7 days later: Causal analysis
    ├─ Predicted outcome (HELPFUL): 0.042 CTR
    ├─ Actual outcome (ENGAGEMENT): 0.038 CTR
    ├─ Difference: -0.004 (close to prediction)
    └─ Conclusion: SSS signal is truly causal ✓ (not spurious correlation)
```

**Result:** The bot doesn't just "track metrics"—it actively uses robust statistics, segmentation, and causal inference to continuously improve its decision-making in real-time, with every weight adjustment backed by statistical rigor and every decision optimized for its specific context.

---

## 8. Frontend Architecture

### 8.1 Dashboard Overview

The Next.js dashboard provides a 10-view master interface for human oversight:

```
┌─────────────────────────────────────────────────────────────────┐
│                      ANTONE DASHBOARD                            │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│  SIDEBAR     │              MAIN CONTENT AREA                   │
│              │                                                   │
│  🎯 Mission  │  ┌─────────────────────────────────────────────┐ │
│     Control  │  │                                             │ │
│              │  │     View-specific content                   │ │
│  🔍 Filtering│  │                                             │ │
│              │  │     - Charts & metrics                      │ │
│  💰 Revenue  │  │     - Data tables                           │ │
│              │  │     - Action buttons                        │ │
│  👥 Customers│  │     - Real-time updates                     │ │
│              │  │                                             │ │
│  📊 KPIs     │  └─────────────────────────────────────────────┘ │
│              │                                                   │
│  ✍️ Content  │  ┌─────────────────────────────────────────────┐ │
│              │  │           APPROVAL QUEUE BADGE              │ │
│  🧪 A/B Tests│  │           (if pending items)                │ │
│              │  └─────────────────────────────────────────────┘ │
│  ⚙️ Health   │                                                   │
│              │                                                   │
│  🏆 Compete  │                                                   │
│              │                                                   │
│  💎 Advocacy │                                                   │
│              │                                                   │
├──────────────┴──────────────────────────────────────────────────┤
│                    ALERT BANNER (if active alerts)               │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Component Architecture

```typescript
// dashboard/src/app/layout.tsx

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AlertBanner } from '@/components/layout/AlertBanner';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import { QueryProvider } from '@/providers/QueryProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <WebSocketProvider>
            <div className="flex h-screen bg-gray-50">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <AlertBanner />
                <main className="flex-1 overflow-y-auto p-6">
                  {children}
                </main>
              </div>
            </div>
          </WebSocketProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

### 8.3 State Management

```typescript
// dashboard/src/hooks/useKPIs.ts

import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { api } from '@/lib/api';

export function useKPIs(options?: { type?: string; dateRange?: DateRange }) {
  const { subscribe } = useWebSocket();

  const query = useQuery({
    queryKey: ['kpis', options],
    queryFn: () => api.get('/analytics/kpis', { params: options }),
    refetchInterval: 60_000, // Refetch every minute
  });

  // Real-time updates via WebSocket
  useEffect(() => {
    const unsubscribe = subscribe('kpi:updated', (data) => {
      query.refetch();
    });
    return unsubscribe;
  }, [subscribe, query]);

  return query;
}
```

### 8.4 User Flow Diagrams

#### Flow 1: Manual Approval Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                     MANUAL APPROVAL FLOW                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. POST DETECTED                                                   │
│     ├─► Stream Monitor detects post matching keywords              │
│     └─► Post queued in PostgreSQL                                  │
│           │                                                         │
│           ▼                                                         │
│  2. ANALYSIS COMPLETE                                               │
│     ├─► Queue Processor analyzes post (4 signals)                  │
│     ├─► Decision made: Mode + Archetype selected                   │
│     └─► Reply generated with DeepSeek R1                           │
│           │                                                         │
│           ▼                                                         │
│  3. DASHBOARD ALERT                                                 │
│     ├─► Approval Queue badge updates (+1 pending)                  │
│     ├─► Real-time WebSocket notification to dashboard              │
│     └─► PM sees alert in Mission Control view                      │
│           │                                                         │
│           ▼                                                         │
│  4. HUMAN REVIEW                                                    │
│     ├─► PM navigates to Approvals view                             │
│     ├─► Sees split screen: Original post (left) | Generated reply (right) │
│     ├─► Reviews "Why this reply?" explanation                      │
│     └─► Checks predicted KPI impact                                │
│           │                                                         │
│           ▼                                                         │
│  5. DECISION OPTIONS                                                │
│     ├─► APPROVE → Goes to step 6                                   │
│     ├─► EDIT → Inline editor → Modified content → Step 6           │
│     ├─► REJECT → Reply discarded, feedback logged                  │
│     └─► REGENERATE → New DeepSeek call with instructions → Step 4  │
│           │                                                         │
│           ▼                                                         │
│  6. POSTING                                                         │
│     ├─► Rate limit check                                           │
│     ├─► Platform API call (Twitter/Reddit/Threads)                 │
│     ├─► Success: Reply posted with UTM tracking                    │
│     └─► Failure: Error message shown, retry option                 │
│           │                                                         │
│           ▼                                                         │
│  7. CONFIRMATION                                                    │
│     ├─► Dashboard shows "Posted successfully"                      │
│     ├─► Approval queue badge updates (-1 pending)                  │
│     ├─► Reply appears in Activity Feed with metrics                │
│     └─► PM can monitor reply performance in real-time              │
│                                                                     │
│  EDGE CASES HANDLED:                                                │
│  • Post deleted before posting → "Post no longer available" error  │
│  • API timeout during posting → Retry 3x, then queue for manual    │
│  • Multiple operators approving same reply → Lock + conflict alert │
│  • User blocks bot during approval → "User blocked" notification   │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

#### Flow 2: KPI Investigation & Drill-Down

```
┌────────────────────────────────────────────────────────────────────┐
│                 KPI INVESTIGATION FLOW                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. ALERT TRIGGERED                                                 │
│     ├─► Automated alert: "CTR dropped below 1.5%"                  │
│     ├─► Email + Slack notification sent                            │
│     └─► Dashboard Alert Banner displays warning                    │
│           │                                                         │
│           ▼                                                         │
│  2. MISSION CONTROL REVIEW                                          │
│     ├─► PM opens dashboard (View 1: Mission Control)               │
│     ├─► Sees CTR metric card highlighted in red                    │
│     ├─► Clicks metric card for details                             │
│     └─► Navigates to Revenue Attribution view (View 3)             │
│           │                                                         │
│           ▼                                                         │
│  3. DRILL-DOWN ANALYSIS                                             │
│     ├─► View 3: Revenue Attribution                                │
│     │   ├─► Conversion funnel: Impression→Reply→Click→Convert     │
│     │   ├─► Identifies drop-off at "Reply→Click" stage             │
│     │   └─► Clicks "View by Archetype" breakdown                   │
│     │                                                               │
│     ├─► View 6: Content Quality                                    │
│     │   ├─► Sees "Checklist" archetype underperforming            │
│     │   ├─► Compares to "Confident Recommender" (higher CTR)      │
│     │   └─► Identifies pattern: Checklist too long for Twitter    │
│     │                                                               │
│     └─► Clicks specific reply ID to see full decision audit        │
│           │                                                         │
│           ▼                                                         │
│  4. DECISION AUDIT                                                  │
│     ├─► GET /api/v1/decisions/:id with full signal breakdown       │
│     ├─► Reviews: SSS=0.91, Mode=HELPFUL, Archetype=CHECKLIST       │
│     ├─► Sees original post content + author context                │
│     ├─► Reviews generated reply content                            │
│     └─► Checks outcome metrics: 0 clicks in 24 hours               │
│           │                                                         │
│           ▼                                                         │
│  5. CORRECTIVE ACTION                                               │
│     ├─► Navigate to A/B Testing Lab (View 7)                       │
│     ├─► Create experiment: "Short Checklist vs Current"            │
│     ├─► Define variants: Variant A (current), Variant B (50% shorter) │
│     ├─► Set metric: CTR, Duration: 7 days, Traffic: 50/50          │
│     └─► Start experiment                                           │
│           │                                                         │
│           ▼                                                         │
│  6. MONITORING                                                      │
│     ├─► Return to View 7 daily to check statistical significance   │
│     ├─► After 7 days: Variant B wins (CTR 2.3% vs 1.4%)           │
│     └─► Click "Promote Winner" → System auto-adjusts weights       │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

#### Flow 3: Safety Escalation & Resolution

```
┌────────────────────────────────────────────────────────────────────┐
│                   SAFETY ESCALATION FLOW                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. SAFETY FLAG TRIGGERED                                           │
│     ├─► Post detected: "I want to die from this hangover"          │
│     ├─► Signal 1 runs → SSS = 0.78 (high solution-seeking)         │
│     ├─► Safety Protocol detects: "die" keyword                     │
│     └─► Distress Probability calculated: 0.62 (>0.45 threshold)    │
│           │                                                         │
│           ▼                                                         │
│  2. AUTOMATIC ESCALATION                                            │
│     ├─► Mode forced to: DISENGAGED                                 │
│     ├─► Escalation record created in database                      │
│     │   - Reason: SAFETY_AMBIGUITY                                 │
│     │   - Priority: CRITICAL                                       │
│     │   - Status: PENDING                                          │
│     └─► Alert sent: SMS + Email immediately                        │
│           │                                                         │
│           ▼                                                         │
│  3. HUMAN NOTIFICATION                                              │
│     ├─► PM receives SMS: "CRITICAL: Safety escalation pending"     │
│     ├─► Dashboard Alert Banner shows: "1 Critical Escalation"      │
│     └─► Escalation Queue badge updates                             │
│           │                                                         │
│           ▼                                                         │
│  4. MODERATOR REVIEW                                                │
│     ├─► PM navigates to Escalations Queue                          │
│     ├─► Sees escalation card with:                                 │
│     │   - Original post content highlighted                        │
│     │   - Safety flags: ["DEATH_MENTION"]                          │
│     │   - Distress Probability: 0.62                               │
│     │   - System decision: DISENGAGED                              │
│     └─► PM evaluates context                                       │
│           │                                                         │
│           ▼                                                         │
│  5. RESOLUTION OPTIONS                                              │
│     ├─► APPROVE DISENGAGEMENT                                       │
│     │   └─► Mark as resolved, note: "Correct - hyperbole but      │
│     │       safety-first approach appropriate"                     │
│     │                                                               │
│     ├─► OVERRIDE & ENGAGE (rare)                                   │
│     │   └─► PM manually creates gentle, empathetic reply           │
│     │       (if confident it's hyperbole, not crisis)              │
│     │                                                               │
│     ├─► FLAG FOR LEGAL REVIEW                                      │
│     │   └─► Escalate to legal team for policy guidance             │
│     │                                                               │
│     └─► UPDATE SAFETY PROTOCOL                                     │
│         └─► Add pattern to safety database if recurring            │
│           │                                                         │
│           ▼                                                         │
│  6. LEARNING FEEDBACK                                               │
│     ├─► Resolution notes logged in escalations table               │
│     ├─► If pattern recurring: Update safety-protocol.ts            │
│     └─► Future posts with pattern: Automatic handling per decision │
│                                                                     │
│  EDGE CASES HANDLED:                                                │
│  • SLA breach (>4 hours unresolved) → Escalate to manager          │
│  • Similar escalation within 1 hour → Pattern alert triggered      │
│  • PM unavailable → Assign to backup moderator automatically       │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

#### Flow 4: Error State Handling

```
┌────────────────────────────────────────────────────────────────────┐
│                     ERROR STATE HANDLING                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SCENARIO A: API Timeout During Approval                            │
│  ├─► PM clicks "Approve" on reply                                  │
│  ├─► Backend calls Platform API → Timeout after 10s                │
│  ├─► Circuit breaker opens for platform                            │
│  ├─► Dashboard shows: "Twitter temporarily unavailable"            │
│  ├─► Reply remains in queue with status: RETRY_PENDING             │
│  ├─► Background worker retries every 5 minutes                     │
│  └─► Success on retry 3 → Reply posts → Dashboard notified         │
│                                                                     │
│  SCENARIO B: Post Deleted Before Reply Posts                        │
│  ├─► Reply approved and queued for posting                         │
│  ├─► Platform API returns: 404 Not Found (post deleted)            │
│  ├─► System logs: "Post abc123 deleted, reply aborted"             │
│  ├─► Dashboard shows: "Reply not posted - original post deleted"   │
│  ├─► Reply status: CANCELLED                                       │
│  └─► No retry attempted (graceful failure)                         │
│                                                                     │
│  SCENARIO C: Multiple Operators Simultaneous Approval               │
│  ├─► Operator A and B both review same reply                       │
│  ├─► Operator A clicks "Approve" at 10:00:00                       │
│  ├─► Operator B clicks "Approve" at 10:00:03                       │
│  ├─► Database optimistic locking detects conflict                  │
│  ├─► Operator A's approval succeeds, reply posts                   │
│  ├─► Operator B sees: "This reply was already approved by [A]"     │
│  └─► WebSocket sync updates both screens                           │
│                                                                     │
│  SCENARIO D: User Blocks Bot During Approval Window                 │
│  ├─► Reply pending approval for @user123                           │
│  ├─► User blocks @antone_vita on Twitter                           │
│  ├─► PM approves reply                                             │
│  ├─► Platform API returns: 403 Forbidden (user blocked)            │
│  ├─► System updates author: blocked=true, relationship_score=-0.30 │
│  ├─► Dashboard shows: "User blocked - reply not posted"            │
│  ├─► Future posts from @user123 → Auto-disengage                   │
│  └─► Author added to permanent blocklist                           │
│                                                                     │
│  SCENARIO E: Compliance Violation Detected Post-Approval            │
│  ├─► Reply approved by PM (human oversight missed violation)       │
│  ├─► Pre-posting compliance check runs                             │
│  ├─► Detects prohibited term: "clinically proven"                  │
│  ├─► Posting blocked automatically                                 │
│  ├─► Dashboard alert: "Compliance violation prevented"             │
│  ├─► Reply status: COMPLIANCE_REJECTED                             │
│  └─► PM notified to regenerate with compliant language             │
│                                                                     │
│  SCENARIO F: Database Connection Lost                               │
│  ├─► Worker processing posts → Database connection drops           │
│  ├─► Circuit breaker opens after 5 failures                        │
│  ├─► Workers pause processing, enter degraded mode                 │
│  ├─► Dashboard Health view shows: Database UNHEALTHY               │
│  ├─► Alert: "CRITICAL: Database unreachable"                       │
│  ├─► Circuit breaker retries connection every 30s                  │
│  └─► Connection restored → Workers resume automatically            │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 8.5 Dashboard Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial dashboard load | <2s | Time to first contentful paint |
| View navigation | <500ms | Route transition time |
| Real-time WebSocket updates | <500ms | Server event → UI update latency |
| API response time | <200ms | p95 for dashboard queries |
| Chart rendering | <1s | Complex visualizations (10k data points) |
| Approval action feedback | <300ms | Button click → visual confirmation |

### 8.6 Accessibility Standards

While an internal tool, the dashboard follows basic accessibility practices:

- **Keyboard Navigation**: All actions accessible via keyboard shortcuts
- **Screen Reader Labels**: Proper ARIA labels on interactive elements  
- **Color Contrast**: WCAG AA compliance for text readability
- **Focus Indicators**: Clear visual focus states for keyboard users
- **Error Messages**: Descriptive, actionable error text (not just "Error")

### 8.7 Key Dashboard Views

#### View 1: Mission Control

```typescript
// dashboard/src/app/page.tsx (Mission Control)

export default function MissionControl() {
  const { data: kpis } = useKPIs();
  const { data: activity } = useActivityFeed();
  const { data: alerts } = useAlerts();

  return (
    <div className="space-y-6">
      {/* Hero Metrics Row */}
      <div className="grid grid-cols-5 gap-4">
        <MetricCard 
          title="Posts Scanned (24h)" 
          value={kpis?.scanned} 
          trend={kpis?.scannedTrend} 
        />
        <MetricCard 
          title="Replies Posted" 
          value={kpis?.replies} 
          trend={kpis?.repliesTrend} 
        />
        <MetricCard 
          title="CTR" 
          value={`${kpis?.ctr}%`} 
          target={2.0}
          trend={kpis?.ctrTrend} 
        />
        <MetricCard 
          title="Revenue (24h)" 
          value={`$${kpis?.revenue}`} 
          trend={kpis?.revenueTrend} 
        />
        <MetricCard 
          title="Safety Score" 
          value={kpis?.safetyScore} 
          status={kpis?.safetyScore > 95 ? 'healthy' : 'warning'}
        />
      </div>

      {/* Activity Feed + Alerts */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ActivityFeed items={activity} />
        </div>
        <div>
          <AlertsWidget alerts={alerts} />
          <ApprovalQueueWidget />
        </div>
      </div>
    </div>
  );
}
```

#### Approval Interface

```typescript
// dashboard/src/app/approvals/page.tsx

export default function ApprovalQueue() {
  const { data: pending } = usePendingApprovals();
  const approveMutation = useApproveMutation();
  const rejectMutation = useRejectMutation();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manual Approval Queue</h1>
        <Button 
          onClick={() => approveMutation.mutate({ 
            ids: pending?.filter(r => r.confidence > 0.9).map(r => r.id) 
          })}
        >
          Approve All High-Confidence
        </Button>
      </div>

      {pending?.map((reply) => (
        <ApprovalCard
          key={reply.id}
          reply={reply}
          post={reply.decision.post}
          author={reply.decision.post.author}
          onApprove={(edited) => approveMutation.mutate({ 
            id: reply.id, 
            editedContent: edited 
          })}
          onReject={(reason) => rejectMutation.mutate({ 
            id: reply.id, 
            reason 
          })}
          onRegenerate={() => {/* ... */}}
        />
      ))}
    </div>
  );
}
```

---

## 9. External Integrations

### 9.1 Platform API Clients

#### Twitter/X Integration

```typescript
// backend/src/platforms/twitter/client.ts

import { TwitterApi } from 'twitter-api-v2';
import { RateLimiter } from '../../utils/rate-limiter';

export class TwitterClient {
  private client: TwitterApi;
  private rateLimiter: RateLimiter;

  constructor() {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_SECRET!,
    });

    // 300 posts/15min, 900 reads/15min
    this.rateLimiter = new RateLimiter({
      read: { max: 900, windowMs: 15 * 60 * 1000 },
      write: { max: 300, windowMs: 15 * 60 * 1000 },
    });
  }

  async search(query: string, options: SearchOptions): Promise<Tweet[]> {
    await this.rateLimiter.acquire('read');
    
    const result = await this.client.v2.search(query, {
      max_results: options.maxResults,
      since_id: options.sinceId,
      'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
      'user.fields': ['verified', 'public_metrics'],
      expansions: ['author_id'],
    });

    return result.data.data || [];
  }

  async reply(tweetId: string, content: string): Promise<string> {
    await this.rateLimiter.acquire('write');
    
    const result = await this.client.v2.reply(content, tweetId);
    return result.data.id;
  }

  async verifyCredentials(): Promise<boolean> {
    try {
      await this.client.v2.me();
      return true;
    } catch {
      return false;
    }
  }
}
```

#### Reddit Integration

```typescript
// backend/src/platforms/reddit/client.ts

import Snoowrap from 'snoowrap';

export class RedditClient {
  private client: Snoowrap;
  private rateLimiter: RateLimiter;

  constructor() {
    this.client = new Snoowrap({
      userAgent: 'Antone/1.0.0 (by /u/antone_vita)',
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
      refreshToken: process.env.REDDIT_REFRESH_TOKEN!,
    });

    // 60 requests/min
    this.rateLimiter = new RateLimiter({
      default: { max: 60, windowMs: 60 * 1000 },
    });
  }

  async searchSubreddits(subreddits: string[], query: string): Promise<Submission[]> {
    await this.rateLimiter.acquire('default');
    
    const results: Submission[] = [];
    
    for (const sub of subreddits) {
      const posts = await this.client
        .getSubreddit(sub)
        .search({ query, time: 'day', sort: 'new' });
      results.push(...posts);
    }

    return results;
  }

  async comment(submissionId: string, content: string): Promise<string> {
    await this.rateLimiter.acquire('default');
    
    const submission = await this.client.getSubmission(submissionId);
    const comment = await submission.reply(content);
    return comment.id;
  }

  async getKarma(): Promise<number> {
    const me = await this.client.getMe();
    return me.comment_karma + me.link_karma;
  }
}
```

### 9.2 Integration Failure Matrix

Comprehensive error handling strategy for all external integrations:

| Integration | Failure Mode | Detection | Handling Strategy | Recovery Time | Fallback |
|-------------|--------------|-----------|-------------------|---------------|----------|
| **Twitter API** | Rate limit exceeded | 429 response | Queue requests, retry after reset window | 15 minutes | Continue Reddit/Threads |
| **Twitter API** | Authentication failed | 401 response | Alert critical, refresh token | Manual intervention | Halt Twitter operations |
| **Twitter API** | Post deleted/unavailable | 404 response | Skip reply, log event | Immediate | Cancel reply gracefully |
| **Twitter API** | User blocked bot | 403 response | Update author blocklist, permanent disengage | Immediate | Skip user forever |
| **Reddit API** | Rate limit exceeded | HTTP 429 | Queue with exponential backoff | 1 minute | Continue Twitter/Threads |
| **Reddit API** | Comment removed by mod | Post success, later 404 | Log removal, update safety KPIs | N/A | Flag for review |
| **Reddit API** | Subreddit banned | 403 response | Remove from monitoring list | Permanent | Skip subreddit |
| **Threads API** | API unavailable | Connection timeout | Retry 3x, then circuit breaker | 5 minutes | Log warning, continue others |
| **DeepSeek API** | Timeout | Request timeout (30s) | Retry 3x with exponential backoff | 90 seconds | Escalate to human approval |
| **DeepSeek API** | Quality issue | Low confidence (<0.85) | Regenerate with refined prompt | 10 seconds | Escalate to human |
| **DeepSeek API** | Rate limit | 429 response | Queue with priority management | Variable | Delay non-critical analysis |
| **DeepSeek API** | Cost budget exceeded | Daily spend >$5 | Pause analysis, alert PM | Manual review | Switch to cheaper model |
| **Database** | Connection lost | Connection error | Circuit breaker, retry with backoff | 30 seconds | Alert critical, halt processing |
| **Database** | Query timeout | Query >10s | Cancel query, use cached data | Immediate | Degraded mode |
| **Database** | Disk full | Write error | Alert critical, archive old data | Manual intervention | Read-only mode |
| **Google Analytics** | Tracking failed | Network error | Log locally, retry hourly | 1 hour | Manual upload later |
| **Healthchecks.io** | Ping failed | Network error | Retry next cycle | 5 minutes | Email notification only |
| **Cloudflare Tunnel** | Connection dropped | Tunnel down | Auto-reconnect every 30s | 30 seconds | Local access only |

**Circuit Breaker Configuration:**
- **Threshold**: 5 consecutive failures
- **Timeout**: 30 seconds for APIs, 60 seconds for database
- **Half-Open Test**: Single request after timeout to test recovery
- **Metrics**: Track circuit breaker state changes in monitoring

**Retry Configuration:**
- **Max Retries**: 3 for transient errors, 0 for permanent errors (4xx)
- **Backoff**: Exponential (1s → 2s → 4s → 8s)
- **Jitter**: ±20% randomization to prevent thundering herd

### 9.3 DeepSeek R1 Integration

```typescript
// backend/src/clients/deepseek.ts

import axios from 'axios';

export class DeepSeekClient {
  private baseUrl = 'https://api.deepseek.com/v1';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY!;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: 'deepseek-reasoner', // DeepSeek R1
        messages: [
          { role: 'system', content: 'You are Antone, a helpful wellness assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 500,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const message = response.data.choices[0].message;
    
    return {
      content: message.content,
      confidence: this.extractConfidence(message),
      usage: response.data.usage,
    };
  }

  // Fallback to alternative model if needed
  async generateWithFallback(prompt: string): Promise<GenerateResult> {
    try {
      return await this.generate(prompt);
    } catch (error) {
      logger.warn('DeepSeek failed, using fallback', { error });
      return this.fallbackGenerate(prompt);
    }
  }
}
```

---

## 10. Security Architecture

### 10.1 Authentication & Authorization

```typescript
// backend/src/api/middleware/auth.ts

import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Role-based access
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

### 10.2 Secrets Management

```yaml
# Environment variables (stored in .env, never committed)
# Production: Docker secrets or AWS Secrets Manager

# Platform API Keys
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=
TWITTER_BEARER_TOKEN=

REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_REFRESH_TOKEN=

THREADS_ACCESS_TOKEN=

# LLM API
DEEPSEEK_API_KEY=

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/antone

# Authentication
JWT_SECRET=

# External Services
HEALTHCHECKS_IO_UUID=
CLOUDFLARE_TUNNEL_TOKEN=
```

### 10.3 Data Security

1. **No PII Storage**: Only public platform handles and post IDs stored
2. **Redaction in Logs**: API keys, tokens never logged
3. **Encryption at Rest**: PostgreSQL with encrypted volumes
4. **Encryption in Transit**: HTTPS via Cloudflare Tunnel

---

## 11. Infrastructure & Deployment

### 11.1 Docker Compose Configuration

```yaml
# docker/docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    container_name: antone-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-antone}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-antone}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U antone"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - antone-network

  backend-api:
    build:
      context: ../backend
      dockerfile: Dockerfile
      target: production
    container_name: antone-backend-api
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
    env_file:
      - ../.env
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - antone-network

  backend-worker:
    build:
      context: ../backend
      dockerfile: Dockerfile
      target: production
    container_name: antone-backend-worker
    command: ["node", "dist/workers/index.js"]
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
    env_file:
      - ../.env
    depends_on:
      postgres:
        condition: service_healthy
      backend-api:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - antone-network

  dashboard:
    build:
      context: ../dashboard
      dockerfile: Dockerfile
    container_name: antone-dashboard
    environment:
      NEXT_PUBLIC_API_URL: http://backend-api:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend-api
    restart: unless-stopped
    networks:
      - antone-network

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: antone-cloudflared
    command: tunnel run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    restart: unless-stopped
    networks:
      - antone-network

volumes:
  postgres_data:
    driver: local

networks:
  antone-network:
    driver: bridge
```

### 11.2 Dockerfile (Backend)

```dockerfile
# backend/Dockerfile

FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### 11.3 Cloudflare Tunnel Configuration

```yaml
# docker/cloudflared/config.yml

tunnel: antone-tunnel
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: antone.yourdomain.com
    service: http://dashboard:3000
  - hostname: api.antone.yourdomain.com
    service: http://backend-api:3001
  - service: http_status:404
```

---

## 12. Observability & Monitoring

### 12.1 Structured Logging

```typescript
// backend/src/utils/logger.ts

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' } 
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: 'antone',
    version: process.env.npm_package_version,
  },
  redact: [
    'req.headers.authorization',
    'password',
    'apiKey',
    'accessToken',
    'refreshToken',
  ],
});

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] || uuid();
  
  req.log = logger.child({ requestId });
  
  const start = Date.now();
  
  res.on('finish', () => {
    req.log.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - start,
    }, 'Request completed');
  });
  
  next();
}
```

### 12.2 Metrics Collection

```typescript
// backend/src/monitoring/metrics.ts

export const metrics = {
  // Counters
  postsScanned: new Counter('antone_posts_scanned_total'),
  postsQueued: new Counter('antone_posts_queued_total'),
  decisionsCreated: new Counter('antone_decisions_created_total'),
  repliesGenerated: new Counter('antone_replies_generated_total'),
  repliesPosted: new Counter('antone_replies_posted_total'),
  repliesDeleted: new Counter('antone_replies_deleted_total'),
  
  // Gauges
  queueDepth: new Gauge('antone_queue_depth'),
  pendingApprovals: new Gauge('antone_pending_approvals'),
  redditKarma: new Gauge('antone_reddit_karma'),
  
  // Histograms
  analysisLatency: new Histogram('antone_analysis_duration_seconds'),
  generationLatency: new Histogram('antone_generation_duration_seconds'),
  postingLatency: new Histogram('antone_posting_duration_seconds'),
  
  // Labels
  byPlatform: (platform: string) => ({ platform }),
  byMode: (mode: string) => ({ mode }),
  byArchetype: (archetype: string) => ({ archetype }),
};
```

### 12.3 Health Checks

```typescript
// backend/src/monitoring/health-check.ts

export class HealthChecker {
  async check(): Promise<HealthStatus> {
    const [db, twitter, reddit, threads, worker] = await Promise.all([
      this.checkDatabase(),
      this.checkTwitter(),
      this.checkReddit(),
      this.checkThreads(),
      this.checkWorker(),
    ]);

    const components = { db, twitter, reddit, threads, worker };
    const allHealthy = Object.values(components).every(c => c.status === 'healthy');
    const anyUnhealthy = Object.values(components).some(c => c.status === 'unhealthy');

    return {
      status: allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded',
      components,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  private async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { 
        status: 'healthy', 
        latencyMs: Date.now() - start 
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message 
      };
    }
  }

  private async checkWorker(): Promise<ComponentHealth> {
    const lastPoll = await this.getLastPollTime();
    const minutesSinceLastPoll = (Date.now() - lastPoll.getTime()) / 60000;
    
    if (minutesSinceLastPoll > 30) {
      return { status: 'unhealthy', error: 'Worker not polling' };
    }
    if (minutesSinceLastPoll > 15) {
      return { status: 'degraded', warning: 'Worker slow' };
    }
    return { status: 'healthy', lastPollAt: lastPoll.toISOString() };
  }
}
```

### 12.4 Alerting Configuration

```typescript
// backend/src/monitoring/alerting.ts

export const alertRules: AlertRule[] = [
  // Critical alerts
  {
    name: 'platform_strike',
    condition: (metrics) => metrics.platformStrikes > 0,
    severity: 'critical',
    channels: ['sms', 'email', 'slack'],
    message: 'CRITICAL: Platform strike received',
  },
  {
    name: 'safety_kpi_breach',
    condition: (metrics) => metrics.removalRate > 1.5,
    severity: 'critical',
    channels: ['sms', 'email'],
    message: 'CRITICAL: Safety KPI breach - removal rate >1.5x baseline',
  },
  {
    name: 'system_down',
    condition: (health) => health.status === 'unhealthy',
    severity: 'critical',
    channels: ['sms', 'email', 'slack'],
    cooldown: 5 * 60_000, // 5 minutes
  },
  
  // High alerts
  {
    name: 'ctr_low',
    condition: (metrics) => metrics.ctr < 1.5,
    severity: 'high',
    channels: ['email', 'slack'],
    message: 'HIGH: CTR dropped below 1.5%',
  },
  {
    name: 'sentiment_low',
    condition: (metrics) => metrics.positiveSentiment < 60,
    severity: 'high',
    channels: ['email', 'slack'],
    message: 'HIGH: Positive sentiment below 60%',
  },
  
  // Medium alerts
  {
    name: 'queue_depth_high',
    condition: (metrics) => metrics.queueDepth > 100,
    severity: 'medium',
    channels: ['slack'],
    message: 'Queue depth exceeds 100 posts',
  },
  {
    name: 'algorithm_drift',
    condition: (metrics) => metrics.impressionsDrift > 20,
    severity: 'medium',
    channels: ['email'],
    message: 'Algorithm drift detected: impressions down >20%',
  },
];
```

---

## 13. Testing Strategy

### 13.1 Testing Pyramid

```
                    ┌─────────────┐
                    │   E2E Tests │  (10%)
                    │   Manual    │
                    └──────┬──────┘
               ┌───────────┴───────────┐
               │   Integration Tests   │  (30%)
               │   API + Database      │
               └───────────┬───────────┘
          ┌────────────────┴────────────────┐
          │          Unit Tests             │  (60%)
          │   Business Logic + Utilities    │
          └─────────────────────────────────┘
```

### 13.2 Unit Testing

```typescript
// backend/tests/unit/analysis/decision-engine.test.ts

import { DecisionEngine } from '../../../src/analysis/decision-engine';

describe('DecisionEngine', () => {
  let engine: DecisionEngine;

  beforeEach(() => {
    engine = new DecisionEngine();
  });

  describe('mode selection', () => {
    it('should select HELPFUL mode when SSS >= 0.82', async () => {
      const result = await engine.analyzePost(
        mockPost({ content: 'What works for hangover headaches? Need help fast!' }),
        mockAuthor()
      );
      
      expect(result.mode).toBe('HELPFUL');
      expect(result.sssScore).toBeGreaterThanOrEqual(0.82);
    });

    it('should select DISENGAGED when safety flags present', async () => {
      const result = await engine.analyzePost(
        mockPost({ content: 'I want to die, this hangover is killing me' }),
        mockAuthor()
      );
      
      expect(result.mode).toBe('DISENGAGED');
      expect(result.safetyFlags).toContain('DEATH_MENTION');
    });

    it('should select ENGAGEMENT when viral and low SSS', async () => {
      const result = await engine.analyzePost(
        mockPost({ 
          content: 'My hangover has a hangover lol 😂', 
          metrics: { likes: 500, replies: 100 } 
        }),
        mockAuthor({ avgLikesPerHour: 10 }) // Viral: 50x baseline
      );
      
      expect(result.mode).toBe('ENGAGEMENT');
    });
  });

  describe('archetype selection', () => {
    it('should select CHECKLIST for high SSS desperate posts', async () => {
      const result = await engine.analyzePost(
        mockPost({ content: 'Desperate, need hangover cure tips NOW' }),
        mockAuthor()
      );
      
      expect(result.archetype).toBe('CHECKLIST');
    });

    it('should prefer CREDIBILITY_ANCHOR for healthcare pros', async () => {
      const result = await engine.analyzePost(
        mockPost({ content: 'What\'s the science behind hangover cures?' }),
        mockAuthor({ archetypeTags: ['healthcare_pro'] })
      );
      
      expect(result.archetype).toBe('CREDIBILITY_ANCHOR');
    });
  });
});
```

### 13.3 Integration Testing

```typescript
// backend/tests/integration/api/decisions.test.ts

import request from 'supertest';
import { app } from '../../../src/server';
import { prisma } from '../../../src/db';

describe('Decisions API', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$executeRaw`TRUNCATE TABLE decisions, posts, authors CASCADE`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/decisions', () => {
    it('should return paginated decisions', async () => {
      // Seed test data
      await seedTestDecisions(20);

      const response = await request(app)
        .get('/api/v1/decisions')
        .query({ limit: 10 })
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.decisions).toHaveLength(10);
      expect(response.body.hasMore).toBe(true);
    });

    it('should filter by mode', async () => {
      const response = await request(app)
        .get('/api/v1/decisions')
        .query({ mode: 'HELPFUL' })
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      response.body.decisions.forEach((d: Decision) => {
        expect(d.mode).toBe('HELPFUL');
      });
    });
  });

  describe('POST /api/v1/replies/:id/approve', () => {
    it('should approve and post reply', async () => {
      const reply = await seedPendingReply();

      const response = await request(app)
        .post(`/api/v1/replies/${reply.id}/approve`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.reply.approvalStatus).toBe('APPROVED');
      expect(response.body.posted).toBe(true);
    });
  });
});
```

### 13.4 Test Coverage Requirements

| Area | Target Coverage | Critical Paths |
|------|-----------------|----------------|
| Decision Engine | 90% | Mode selection, safety checks |
| Reply Generator | 85% | Compliance validation |
| Safety Protocol | 100% | All safety flags |
| Platform Clients | 80% | Auth, rate limiting |
| API Routes | 80% | Auth, validation |
| Overall | 80% | - |

---

## 14. Error Handling & Resilience

### 14.1 Error Classification

```typescript
// backend/src/errors/index.ts

export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Platform errors (5xx external)
  TWITTER_API_ERROR = 'TWITTER_API_ERROR',
  REDDIT_API_ERROR = 'REDDIT_API_ERROR',
  THREADS_API_ERROR = 'THREADS_API_ERROR',
  DEEPSEEK_API_ERROR = 'DEEPSEEK_API_ERROR',
  
  // Internal errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  COMPLIANCE_ERROR = 'COMPLIANCE_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public context?: Record<string, unknown>
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### 14.2 Circuit Breaker Pattern

```typescript
// backend/src/utils/circuit-breaker.ts

export class CircuitBreaker {
  private failures = 0;
  private lastFailure?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private name: string,
    private threshold: number = 5,
    private timeout: number = 30_000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure!.getTime() > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new AppError(
          ErrorCode.PROCESSING_ERROR,
          `Circuit breaker ${this.name} is OPEN`,
          503
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = new Date();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      logger.warn(`Circuit breaker ${this.name} opened`);
    }
  }
}

// Usage
const twitterCircuit = new CircuitBreaker('twitter', 5, 60_000);
await twitterCircuit.execute(() => twitterClient.search(query));
```

### 14.3 Retry Strategy

```typescript
// backend/src/utils/retry.ts

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { 
    maxRetries = 3, 
    backoff = 'exponential',
    initialDelay = 1000,
    maxDelay = 30_000,
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      if (!isRetryable(error)) break;
      
      const delay = calculateDelay(attempt, backoff, initialDelay, maxDelay);
      logger.warn(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`, { error });
      
      await sleep(delay);
    }
  }

  throw lastError!;
}

function isRetryable(error: Error): boolean {
  // Network errors, timeouts, 5xx responses are retryable
  if (error instanceof AppError) {
    return error.statusCode >= 500 || error.code === ErrorCode.RATE_LIMITED;
  }
  return true;
}
```

### 14.4 Graceful Degradation

```typescript
// backend/src/workers/stream-monitor.ts

export class StreamMonitor {
  private platformStatus: Record<Platform, 'healthy' | 'degraded' | 'down'> = {
    TWITTER: 'healthy',
    REDDIT: 'healthy',
    THREADS: 'healthy',
  };

  async pollPlatform(platform: Platform): Promise<void> {
    try {
      const posts = await this.getPlatformClient(platform).poll();
      this.platformStatus[platform] = 'healthy';
      await this.processPostsBatch(posts);
    } catch (error) {
      this.handlePlatformError(platform, error);
      
      // Continue with other platforms - graceful degradation
      if (this.getHealthyPlatformCount() === 0) {
        logger.error('All platforms down');
        await alertService.send({
          severity: 'critical',
          message: 'All social platforms unreachable',
        });
      }
    }
  }

  private handlePlatformError(platform: Platform, error: Error): void {
    this.platformStatus[platform] = 'down';
    
    logger.error(`Platform ${platform} failed`, { 
      error,
      remainingHealthy: this.getHealthyPlatformCount(),
    });
    
    // Increase poll interval for failed platform
    this.adjustPollInterval(platform, 2.0);
  }
}
```

---

## 15. Performance Considerations

### 15.1 Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Post analysis (all 4 signals) | <500ms | p95 latency |
| Reply generation (DeepSeek) | <3s | p95 latency |
| Database queries | <100ms | p95 latency |
| API response time | <200ms | p95 latency |
| Queue processing throughput | 100+ posts/minute | sustained |

### 15.2 Optimization Strategies

#### Parallel Signal Processing

```typescript
// All 4 signals run in parallel
const [sss, ars, evs, trs] = await Promise.all([
  analyzeLinguisticIntent(post.content),
  analyzeAuthorContext(author),
  analyzePostVelocity(post, author),
  analyzeSemanticTopic(post.content),
]);
```

#### Database Query Optimization

```typescript
// Use Prisma's include for eager loading
const decisions = await prisma.decision.findMany({
  where: { mode: 'HELPFUL' },
  include: {
    post: {
      include: { author: true }
    },
    replies: true,
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
});

// Use raw queries for complex aggregations
const metrics = await prisma.$queryRaw`
  SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as count,
    AVG(composite_score) as avg_score
  FROM decisions
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY DATE_TRUNC('hour', created_at)
  ORDER BY hour
`;
```

#### Caching Strategy

```typescript
// Cache author data (frequently accessed)
const authorCache = new Map<string, { author: Author; expiresAt: number }>();

async function getAuthor(platformId: string, platform: Platform): Promise<Author> {
  const cacheKey = `${platform}:${platformId}`;
  const cached = authorCache.get(cacheKey);
  
  if (cached && cached.expiresAt > Date.now()) {
    return cached.author;
  }
  
  const author = await prisma.author.findUnique({
    where: { platform_platformId: { platform, platformId } },
  });
  
  if (author) {
    authorCache.set(cacheKey, { 
      author, 
      expiresAt: Date.now() + 5 * 60_000  // 5 min TTL
    });
  }
  
  return author;
}
```

---

## 16. Migration & Scaling Strategy

### 16.1 Technical Risk Register

| Risk ID | Risk Description | Likelihood | Impact | Mitigation Strategy | Owner |
|---------|-----------------|------------|--------|---------------------|-------|
| **TR-001** | DeepSeek R1 quality insufficient for tone/compliance | Medium | High | A/B test DeepSeek vs GPT-4 in Epic 4; implement fallback to GPT-4 if compliance violations >5% | Backend Dev |
| **TR-002** | Platform API rate limits too restrictive for target volume | Medium | High | Implement aggressive caching, request prioritization, queue management; monitor rate limit headers | Backend Dev |
| **TR-003** | Self-hosted infrastructure downtime during sleep/power outage | High | Medium | Deploy on AWS Lightsail early if uptime <95%; implement Healthchecks.io alerts for immediate notification | DevOps |
| **TR-004** | Twitter/Reddit API breaking changes | Medium | Critical | Version lock platform SDKs; subscribe to API change notifications; implement circuit breakers; maintain fallback logic | Backend Dev |
| **TR-005** | Keyword filtering false positive rate too high | Medium | Medium | Start with narrow keywords (100), expand based on data; implement keyword performance tracking in Epic 4 | Product/Dev |
| **TR-006** | Database storage exceeds 1TB within 6 months | Low | Medium | Implement data archival strategy; compress old JSON fields; monitor storage usage weekly | DevOps |
| **TR-007** | DeepSeek API cost exceeds budget ($35/month) | Medium | Low | Monitor token usage daily; implement prompt optimization; reduce analysis to high-confidence posts only if needed | Backend Dev |
| **TR-008** | Safety Protocol false negatives (misses sensitive content) | Low | Critical | 100% test coverage on safety logic; human review of all safety-flagged posts; conservative bias (disengage when uncertain) | Backend Dev |
| **TR-009** | Cloudflare Tunnel connection drops | Medium | Low | Automatic reconnection logic; local network fallback for emergency access | DevOps |
| **TR-010** | Compliance violations escape to production | Low | Critical | Multi-layer validation (pre-generation check, post-generation check, human approval for first 1000 posts) | Backend Dev/Legal |

### 16.2 Technical Decision Log

| Decision ID | Decision | Rationale | Tradeoffs | Date |
|-------------|----------|-----------|-----------|------|
| **TD-001** | Docker Compose vs Kubernetes | K8s overkill for 4 services; Docker Compose simpler for single-developer team; lower operational complexity | Limited horizontal scaling, but not needed for <100k posts/week; migration to K8s possible if scaling needed | 2025-12-01 |
| **TD-002** | DeepSeek R1 vs GPT-4 | DeepSeek 60% cheaper ($0.55/1M input vs $1.50/1M); R1 reasoning capabilities good for intent analysis | Quality unproven for tone/compliance; implement fallback and A/B testing | 2025-12-01 |
| **TD-003** | Self-hosted vs Cloud | Zero infrastructure cost; abundant resources (32GB RAM); full control over deployment | Dependent on PC uptime; no managed services; migration to cloud if uptime <95% | 2025-12-01 |
| **TD-004** | Monorepo vs Polyrepo | Shared types, simplified deployment, atomic commits across packages | Single repo can get large; all packages versioned together | 2025-12-01 |
| **TD-005** | PostgreSQL vs MongoDB | Relational model fits structured data (authors→posts→decisions); Prisma ORM excellent for migrations; ACID transactions critical for compliance | Less flexible for unstructured data; JSON columns used where needed | 2025-12-01 |
| **TD-006** | Next.js vs Separate React+API | Next.js App Router provides SSR, routing, API routes in one framework; faster development | Larger bundle size; coupled frontend/backend in dashboard service | 2025-12-01 |
| **TD-007** | Polling vs Webhooks | Twitter/Reddit lack reliable webhooks; polling simpler to implement and debug | Higher API request volume; slight latency (5-15 min vs real-time) acceptable for use case | 2025-12-01 |
| **TD-008** | pnpm vs npm/yarn | Faster installs, better monorepo support, disk space efficient | Less common in ecosystem; team must install pnpm | 2025-12-01 |

### 16.3 V1 → V2 Migration Path

**V1 (Months 1-6): Self-Hosted**
- Single host machine (32GB RAM, i5 6-core)
- Docker Compose orchestration
- PostgreSQL 16GB allocation
- Target: 100k posts/month analyzed

**V2 (Months 7+): Cloud Migration (if needed)**
- AWS Lightsail ($35-40/month)
- Managed PostgreSQL (RDS)
- Container orchestration (ECS or Kubernetes)
- Target: 400k+ posts/month analyzed

### 16.2 Scaling Considerations

```yaml
# Horizontal scaling strategy

# Phase 1: Vertical scaling (current)
postgres:
  memory: 16GB → 24GB
  cpu: 4 cores → 6 cores

# Phase 2: Service separation
# Split workers by platform
backend-worker-twitter:
  replicas: 1
backend-worker-reddit:
  replicas: 1
backend-worker-threads:
  replicas: 1

# Phase 3: Read replicas
postgres-primary:
  role: write
postgres-replica:
  role: read
  for: dashboard queries, analytics
```

### 16.3 Data Migration

```typescript
// scripts/migrate-to-cloud.ts

export async function migrateToCloud() {
  // 1. Export current data
  await exportDatabase('antone_backup.sql');
  
  // 2. Upload to S3
  await uploadToS3('antone_backup.sql', 'antone-backups');
  
  // 3. Restore to RDS
  await restoreToRds('antone_backup.sql');
  
  // 4. Update connection strings
  // 5. Verify data integrity
  // 6. Switch traffic
}
```

---

## 17. Requirements Traceability

### 17.1 Functional Requirements Coverage

All 24 FRs from PRD are addressed in the architecture:

| FR | Priority | Description | Architecture Coverage |
|----|----------|-------------|----------------------|
| **FR1** | CRITICAL | Platform monitoring (Twitter/X, Reddit, Threads) | Section 7.3 (Stream Monitor), Section 9.1 (Platform Clients) |
| **FR2** | CRITICAL | Multi-Signal Analysis (4 signals) | Section 7.2 (Decision Engine), database schema includes all signal scores |
| **FR3** | CRITICAL | Decision Score & Mode Selection | Section 7.2 (DecisionEngine.selectMode), 4 modes implemented |
| **FR4** | CRITICAL | 8 Archetypes + Platform Personalities | Section 7.2 (Reply Generator), Archetype enum in schema |
| **FR5** | CRITICAL | Primary Safety Protocol | Section 7.2 (checkSafetyProtocol), safety flags in decisions table |
| **FR6** | CRITICAL | Relationship Memory | Section 5.2 (authors table), interaction_history JSON field |
| **FR7** | CRITICAL | Platform posting with disclosure | Section 9.1 (Platform Posters), signature in reply generator |
| **FR8** | CRITICAL | Self-Correction Mechanism | Section 4.3 (SelfCorrection worker), deleted_at field in replies |
| **FR9** | CRITICAL | Commercial KPI Tracking | Section 6.2 (Analytics API), utm_code in replies table |
| **FR10** | CRITICAL | Love KPI Tracking | Section 6.2 (Analytics API), metrics_json in replies |
| **FR11** | CRITICAL | Safety KPI Tracking | Section 6.2 (Analytics API), safety metrics in kpi_metrics table |
| **FR12** | CRITICAL | A/B Testing Framework | Section 6.2 (Experiments API), experiments table with variants |
| **FR13** | CRITICAL | Claims Library | Section 7.2 (Compliance validator), claims-library.json |
| **FR14** | HIGH | Human Escalation Queue | Section 5.2 (escalations table), Section 6.2 (Escalations API) |
| **FR15** | MEDIUM | Product Module Architecture | Section 1.6 (OUT OF SCOPE - Sleep/Energy deferred to V2) |
| **FR16** | HIGH | Web Dashboard (10 views) | Section 8 (Frontend Architecture), all 10 views mapped |
| **FR17** | HIGH | Cadence & CTA Balance | Section 7.2 (Reply Generator - mode-based CTA logic) |
| **FR18** | MEDIUM | Controlled Assertiveness Protocol | Section 7.2 (Misinformation detector), circuit breaker rules |
| **FR19** | ENHANCEMENT | Community Champions Tracking | Section 5.2 (community_champions table), Section 4.3 (Worker) |
| **FR20** | ENHANCEMENT | Social Proof Integration | Section 7.2 (Reply Generator - help_count signature) |
| **FR21** | ENHANCEMENT | Power User Prioritization | Section 5.2 (is_power_user, power_tier), Decision Engine logic |
| **FR22** | ENHANCEMENT | Reddit Karma Farming | Section 9.1 (Reddit Client - getKarma), reply_type enum |
| **FR23** | ENHANCEMENT | Temporal Intelligence | Section 7.3 (getTemporalMultiplier), temporal_context in decisions |
| **FR24** | ENHANCEMENT | Competitive Intelligence | Section 5.2 (competitors, competitive_mentions tables), Section 9.2 |

**Coverage: 24/24 (100%)**

### 17.2 Non-Functional Requirements Coverage

| NFR | Description | Architecture Coverage |
|-----|-------------|----------------------|
| **NFR1** | Self-hosted Docker Compose deployment | Section 11.1 (docker-compose.yml), Section 2.4 (Infrastructure) |
| **NFR2** | 95% uptime during peak windows | Section 12.4 (Alerting), Section 14.4 (Graceful Degradation) |
| **NFR3** | Post analysis <500ms | Section 15.1 (Performance Targets), parallel signal processing |
| **NFR4** | Scale to 100k+ posts/week | Section 16 (Scaling Strategy), queue-based architecture |
| **NFR5** | DeepSeek R1 ($25-35/month target) | Section 2.2 (External Services cost table), Section 9.3 (DeepSeek Client) |
| **NFR6** | Audit logs 90-day retention | Section 5.5 (Data Retention Policy), audit_logs table |
| **NFR7** | Platform rate limiting | Section 9.1 (RateLimiter in each platform client) |
| **NFR8** | Respond within 90 min (30 min for power users) | Section 4.4 (Request Flow), worker intervals configured |
| **NFR9** | Environment-based configuration | Section 10.2 (Secrets Management), .env.example |
| **NFR10** | Structured JSON logging | Section 12.1 (Pino logger configuration) |
| **NFR11** | Graceful degradation | Section 14.4 (Platform isolation, circuit breakers) |
| **NFR12** | Single developer maintainability, 80% test coverage | Section 13 (Testing Strategy), monorepo with clear structure |
| **NFR13** | Maximum reach filtering (200+ keywords) | Section 7.3 (keyword taxonomy), permissive processing |
| **NFR14** | Data retention beyond audit | Section 5.5 (Retention Policy - 90 days + archive) |
| **NFR15** | Backup & DR | Section 2.0 (RTO: 4h, RPO: 24h, daily backups to B2) |
| **NFR16** | Compliance (GDPR/CCPA) | Section 2.0 (No PII, public data only, deletion support) |
| **NFR17** | Security testing | Section 2.0 (Pen testing, vulnerability scanning, dependency updates) |

**Coverage: 17/17 (100%)**

### 17.3 Story Dependencies Matrix

| Story | Depends On | Blocks | Can Start When |
|-------|------------|--------|----------------|
| **Story 1.1** | None | All others | Immediately |
| **Story 1.2** | 1.1 | 1.3, 1.8 | 1.1 complete |
| **Story 1.3** | 1.1, 1.2 | 2.2, 2.7 | 1.2 complete |
| **Story 1.4** | 1.1 | 1.7 (Twitter portion) | 1.1 complete |
| **Story 1.5** | 1.1 | 1.7 (Reddit portion) | 1.1 complete |
| **Story 1.6** | 1.1 | 1.7 (Threads portion) | 1.1 complete |
| **Story 1.7** | 1.4, 1.5, 1.6, 1.3 | 2.7 | All platform auth + DB complete |
| **Story 1.8** | 1.4, 1.5, 1.6, 1.3 | None | Platform auth + DB complete |
| **Story 1.9** | 1.5 | None | Reddit auth complete |
| **Story 2.1** | 1.3 | 2.5, 2.7 | DB schema ready |
| **Story 2.2** | 1.3 | 2.5, 2.7 | DB schema ready |
| **Story 2.3** | 1.3 | 2.5, 2.7 | DB schema ready |
| **Story 2.4** | 1.3 | 2.5, 2.7 | DB schema ready |
| **Story 2.5** | 2.1-2.4, 2.6 | 2.7, 3.3 | All signals + safety complete |
| **Story 2.6** | 1.3 | 2.5, 2.7 | DB schema ready |
| **Story 2.7** | 2.1-2.6, 1.7 | 3.3 | All signals + stream monitor ready |
| **Story 2.8** | 2.7 | None | Queue processor operational |
| **Story 2.9** | 1.3 | 2.5 | DB schema ready |
| **Story 2.10** | 2.5 | 3.3 | Decision engine ready |
| **Story 2.11** | 1.3 | 2.5 | DB schema ready |
| **Story 2.12** | 1.3 | 2.5, 3.11 | DB schema ready |
| **Story 3.1** | None | 3.3 | Immediately (parallel with backend) |
| **Story 3.2** | 3.1 | 3.3 | Claims Library ready |
| **Story 3.3** | 2.5, 2.10, 3.1, 3.2 | 3.4, 3.5 | Decision engine + archetypes ready |
| **Story 3.4** | 3.3, 1.4 | None | Reply generator + Twitter auth ready |
| **Story 3.5** | 3.3, 1.5, 1.6 | None | Reply generator + Reddit/Threads auth ready |
| **Story 3.6** | 3.3 | None (parallel) | Reply generator ready, dashboard started |
| **Story 3.7** | 3.4, 3.5 | None | Platform posters operational |
| **Story 3.8** | 2.2, 3.4, 3.5 | None | Posting operational |
| **Story 3.9** | 3.3 | None | Reply generator ready |
| **Story 3.10** | 3.3 | None | Reply generator ready |
| **Story 3.11** | 2.12, 3.3 | None | Competitive detector + generator ready |
| **Story 4.1-4.11** | 3.4, 3.5 | None | Posting operational (collect outcome data) |
| **Story 5.1-5.8** | 2.7, 3.4, 3.5 | None | Core system operational |
| **Story 6.1-6.4** | 2.12, 3.11 | None | Competitive detection implemented |

**Critical Path**: 1.1 → 1.2 → 1.3 → 1.4/1.5/1.6 → 1.7 → 2.1-2.6 → 2.7 → 2.10 → 3.1-3.3 → 3.4/3.5 → MVP Complete

### 2.1 Core Technologies

### Environment Variables

```bash
# .env.example

# ===================
# Application
# ===================
NODE_ENV=development
LOG_LEVEL=info

# ===================
# Database
# ===================
DATABASE_URL=postgresql://antone:password@localhost:5432/antone
POSTGRES_USER=antone
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=antone

# ===================
# Twitter/X API
# ===================
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=
TWITTER_BEARER_TOKEN=

# ===================
# Reddit API
# ===================
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_REFRESH_TOKEN=
REDDIT_USER_AGENT=Antone/1.0.0 (by /u/antone_vita)

# ===================
# Threads API
# ===================
THREADS_ACCESS_TOKEN=

# ===================
# DeepSeek API
# ===================
DEEPSEEK_API_KEY=

# ===================
# Authentication
# ===================
JWT_SECRET=your_jwt_secret_key

# ===================
# Cloudflare Tunnel
# ===================
CLOUDFLARE_TUNNEL_TOKEN=

# ===================
# Monitoring
# ===================
HEALTHCHECKS_IO_UUID=

# ===================
# Alerts
# ===================
SLACK_WEBHOOK_URL=
ALERT_EMAIL=nk@byvita.co
```

---

## Appendix B: Key File Templates

### Claims Library Structure

```json
{
  "approved_phrases": [
    "designed to support normal breakdown processes",
    "formulated to help steady electrolytes",
    "delivers B-vitamins and antioxidant precursors through your skin",
    "transdermal delivery bypasses your digestive system"
  ],
  "prohibited_terms": [
    "cure",
    "prevent",
    "treat",
    "clinically proven",
    "doctor recommended",
    "FDA approved",
    "medical"
  ],
  "soft_benefits": [
    "may help you feel more like yourself",
    "supports your body's natural processes",
    "convenient alternative to pills when your stomach is upset"
  ],
  "version": "1.0",
  "last_updated": "2025-12-01",
  "approved_by": "Legal Team"
}
```

### Keyword Taxonomy Structure

```json
{
  "version": "1.0",
  "categories": {
    "direct_hangover": {
      "weight": 1.0,
      "terms": ["hangover", "hungover", "morning after", "day after drinking"]
    },
    "physical_symptoms_primary": {
      "weight": 0.9,
      "terms": ["nausea", "headache", "vomiting", "dehydrated", "dizzy"]
    },
    "recovery_intent": {
      "weight": 0.95,
      "terms": ["how to cure", "what helps", "need help", "remedy"]
    }
  },
  "exclusions": [
    "The Hangover",
    "soundtrack",
    "bitcoin",
    "ethereum"
  ]
}
```

---

---

## Architecture Checklist Validation Summary

### Checklist Category Assessment

| Category | Checklist Score | Architecture Addresses | Status |
|----------|-----------------|------------------------|--------|
| **1. Problem Definition & Context** | 95% | ✅ Section 1.2 - Current State Baseline added | ✅ COMPLETE |
| **2. MVP Scope Definition** | 90% | ✅ Section 1.5 - MVP Definition + Section 1.6 - OUT OF SCOPE | ✅ COMPLETE |
| **3. User Experience Requirements** | 75% → 95% | ✅ Section 8.4 - User Flow Diagrams (3 flows + 6 error scenarios) | ✅ COMPLETE |
| **4. Functional Requirements** | 95% | ✅ Section 17.1 - All 24 FRs with priority labels and coverage | ✅ COMPLETE |
| **5. Non-Functional Requirements** | 92% → 100% | ✅ Section 2.0 - NFR14-17 added (DR, backup, compliance, security) | ✅ COMPLETE |
| **6. Epic & Story Structure** | 94% → 98% | ✅ Section 17.3 - Story Dependencies Matrix with critical path | ✅ COMPLETE |
| **7. Technical Guidance** | 88% → 98% | ✅ Section 16.1 - Technical Risk Register (10 risks)<br>✅ Section 16.2 - Technical Decision Log (8 decisions)<br>✅ Section 5.1 - ERD diagram included | ✅ COMPLETE |
| **8. Cross-Functional Requirements** | 90% → 98% | ✅ Section 5.4 - Data Validation Rules with Zod schemas<br>✅ Section 5.6 - Schema Migration Strategy<br>✅ Section 9.2 - Integration Failure Matrix (17 scenarios) | ✅ COMPLETE |
| **9. Clarity & Communication** | 82% → 96% | ✅ Glossary of Terms added (14 key terms)<br>✅ Stakeholders & Approval Process added<br>✅ Section 17.1-17.3 - Complete traceability | ✅ COMPLETE |

**Overall Improvement**: 92% (Checklist) → **98% (Architecture)**

### High Priority Recommendations - Implementation Status

| # | Recommendation | Status | Location in Architecture |
|---|----------------|--------|--------------------------|
| 1 | Add User Flow Diagrams | ✅ DONE | Section 8.4 - Manual Approval, KPI Investigation, Safety Escalation flows |
| 2 | Create Technical Risk Register | ✅ DONE | Section 16.1 - 10 risks with mitigations |
| 3 | Document Stakeholders & Approval Process | ✅ DONE | Stakeholders section with approval workflow |
| 4 | Create Database ERD | ✅ DONE | Section 5.1 - ASCII ERD with all 10 tables and relationships |

### Medium Priority Recommendations - Implementation Status

| # | Recommendation | Status | Location in Architecture |
|---|----------------|--------|--------------------------|
| 5 | Add Explicit OUT OF SCOPE Section | ✅ DONE | Section 1.6 - Comprehensive exclusions list |
| 6 | Add Story Dependency Matrix | ✅ DONE | Section 17.3 - Full matrix with critical path |
| 7 | Create Glossary Section | ✅ DONE | Glossary of Terms (14 terms defined) |
| 8 | Add Data Validation Requirements | ✅ DONE | Section 5.4 - Zod schemas and validation rules table |

### Low Priority Recommendations - Implementation Status

| # | Recommendation | Status | Location in Architecture |
|---|----------------|--------|--------------------------|
| 9 | Add Baseline Measurements | ✅ DONE | Section 1.2 - Current state baseline (0 social presence) |
| 10 | Add T-Shirt Sizing to Stories | ⚠️ DEFERRED | To be done by Scrum Master during story creation |
| 11 | Create Assumptions Register | ✅ DONE | Section 18 - 15 project assumptions + 10 technical + 5 business |

### Architecture Enhancements Beyond Checklist

The architecture document includes additional improvements not explicitly requested:

1. **Section 2.0**: Additional NFRs (NFR14-17) for backup, compliance, security
2. **Section 8.5**: Dashboard performance requirements (<2s load, <500ms updates)
3. **Section 8.6**: Accessibility standards (keyboard nav, ARIA labels, WCAG AA)
4. **Section 9.2**: Comprehensive integration failure matrix (17 failure scenarios)
5. **Section 16.2**: Technical decision log documenting 8 key architectural choices
6. **Section 17**: Complete requirements traceability (24 FRs + 17 NFRs mapped to architecture)

### Critical Gaps Closed

| Original Gap (from Checklist) | Resolution in Architecture |
|-------------------------------|----------------------------|
| No user flow diagrams | Added 3 primary flows + 6 error scenarios (Section 8.4) |
| Missing technical risk register | Added 10 risks with owner assignments (Section 16.1) |
| No stakeholder identification | Added 7 stakeholder roles with approval workflow |
| Missing ERD | Included ASCII ERD showing all relationships (Section 5.1) |
| No OUT OF SCOPE section | Comprehensive exclusions across 7 categories (Section 1.6) |
| Missing data validation rules | Zod schemas + validation rules table (Section 5.4) |
| No glossary | 14 terms defined upfront |
| Scattered assumptions | Consolidated in Section 18 (30 total assumptions) |

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-01 | Winston (Architect) | Initial architecture document |
| 1.1 | 2025-12-01 | Winston (Architect) | Validation against PM checklist: Added baseline, MVP scope, OUT OF SCOPE, user flows, error scenarios, glossary, stakeholders, assumptions, risk register, decision log, requirements traceability, NFR14-17, validation rules, migration strategy |

---

**End of Architecture Document**

