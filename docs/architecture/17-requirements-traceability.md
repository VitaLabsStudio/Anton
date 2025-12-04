# 17. Requirements Traceability

## 17.1 Functional Requirements Coverage

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

## 17.2 Non-Functional Requirements Coverage

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

## 17.3 Story Dependencies Matrix

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

## 2.1 Core Technologies

## Environment Variables

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
