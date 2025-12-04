# 5. Database Schema

## 5.1 Entity Relationship Diagram

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

## 5.2 Prisma Schema

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

## 5.3 Database Indexes & Performance

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

## 5.4 Data Validation Rules

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

## 5.5 Data Retention Policy

| Data Type | Retention | Archive Strategy |
|-----------|-----------|------------------|
| Posts | 90 days | Archive to JSON files on local volume |
| Decisions | 90 days | Archive with posts |
| Replies | Indefinite | Permanent audit trail |
| Authors | Indefinite | Permanent relationship memory |
| KPI Metrics | 2 years | Archive to CSV quarterly |
| Audit Logs | 3 years | Archive to compressed JSON yearly |
| Experiments | Indefinite | Historical learning |

## 5.6 Schema Migration Strategy

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
