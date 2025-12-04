# 16. Migration & Scaling Strategy

## 16.1 Technical Risk Register

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

## 16.2 Technical Decision Log

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

## 16.3 V1 → V2 Migration Path

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

## 16.2 Scaling Considerations

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

## 16.3 Data Migration

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
