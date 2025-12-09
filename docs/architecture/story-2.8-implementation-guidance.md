# Story 2.8 Implementation Guidance

**Story:** Decision Audit & Logging
**Architect:** Winston
**Date:** 2025-12-06

## 1. Story Scope & Split Recommendation

**Recommendation:** **SPLIT** the story.
The original story conflates "Logging/Storage" (Backend foundation) with "Complex Analytics" (Frontend/API advanced query features).

*   **Story 2.8a: Foundation (Audit Storage & Logging)**
    *   **Goal:** Reliable storage, logging, and partitioning.
    *   **Deliverables:** Partitioned DB table, Pino enhancements, basic API (`GET /decisions/:id`).
*   **Story 2.8b: Decision Explorer (API & Analytics)**
    *   **Goal:** Querying and filtering capability.
    *   **Deliverables:** Enhanced `GET /decisions` with filters, composite indexes, frontend implementation.

*If splitting is not possible, implement 2.8a first as the blocking dependency.*

## 2. Database Changes

### 2.1 Migration Strategy
Since we cannot easily convert an existing table to a partitioned one in-place, we will:

1.  **Rename** current `decisions` -> `decisions_legacy`.
2.  **Create** new partitioned `decisions` table (Range Partition by `created_at`).
3.  **Attach** default or initial partition.
4.  **Migrate** recent data (optional, or keep legacy for reference).

### 2.2 Schema Extensions
Add `platform` to `Decision` to optimize common queries.

```sql
-- Migration Step 1: Rename
ALTER TABLE "decisions" RENAME TO "decisions_legacy";

-- Migration Step 2: Create Partitioned Table
CREATE TABLE "decisions" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL, -- NEW: Denormalized for perf
    "sss_score" DOUBLE PRECISION NOT NULL,
    "ars_score" DOUBLE PRECISION NOT NULL,
    "evs_score" DOUBLE PRECISION NOT NULL,
    "trs_score" DOUBLE PRECISION NOT NULL,
    "composite_score" DOUBLE PRECISION NOT NULL,
    "mode" "OperationalMode" NOT NULL,
    -- ... (Copy all other columns)
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id", "created_at") -- Partition key must be part of PK
) PARTITION BY RANGE ("created_at");

-- Migration Step 3: Create Partitions
CREATE TABLE "decisions_y2025m12" PARTITION OF "decisions"
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE "decisions_y2026m01" PARTITION OF "decisions"
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Migration Step 4: Indexes
CREATE INDEX "idx_decisions_platform_mode" ON "decisions"("platform", "mode", "created_at" DESC);
CREATE INDEX "idx_decisions_composite" ON "decisions"("composite_score");
```

## 3. API Design Specification

### 3.1 GET `/api/decisions/:id`
*   **Returns:** Full `DecisionResult` JSON + related `Post` info.
*   **Performance:** Lookup by ID (and ideally date, but ID lookup on partitioned table might need global index or knowing the date. *Correction:* IDs are UUIDs. In partitioned tables, unique constraints must include the partition key. To fetch by ID efficiently without scanning all partitions, we might need a separate lookup table or just accept that we need `id` AND `createdAt` for fast lookup, or use a Global Index (pg17 feature check? No, usually not).
*   *Refinement:* For simple lookup, searching recent partitions (current + last month) is usually enough. Or maintain a separate "ID -> Date" mapping if critical. For this scale, scanning 3 active partitions for an ID is fast enough.

### 3.2 GET `/api/decisions` (Search)
**Query Parameters:**
*   `platform` (Twitter, Reddit...)
*   `mode` (Helpful, Disengaged...)
*   `startDate`, `endDate` (Required for partition pruning)
*   `sssMin`, `sssMax` (Signal filtering)
*   `limit`, `offset`

## 4. Logging Implementation Guidance

### 4.1 Pino Config Update
Ensure `redact` is configured in `logger.ts`.

```typescript
// backend/src/utils/logger.ts
export const logger = pino({
  // ...
  redact: {
    paths: ['email', 'password', 'token', 'content', 'author.handle'],
    censor: '[REDACTED]'
  }
});
```

### 4.2 DeepSeek Client Update
Update `backend/src/clients/deepseek.ts` to accept options.

```typescript
// Add to DeepSeekClientOptions
requestId?: string;

// In generateWithRetry
headers: {
  'x-request-id': this.requestId, // if passed in constructor or method
  // ...
}
```

## 5. Archiving Strategy

*   **Tool:** `pg_partman` is great but might be complex to set up in Docker for a simple bot.
*   **Script approach (Recommended for simplicity):**
    *   Cron job runs `scripts/manage-partitions.ts` monthly.
    *   1. Create next month's partition.
    *   2. Dump partitions older than 90 days to `volumes/archive/decisions_yyyy_mm.json.gz`.
    *   3. DROP the old partition.

## 6. Testing Requirements

1.  **Unit Tests:**
    *   Test `DecisionEngine` logs the correct event structure.
    *   Test `DeepSeekClient` passes header.
2.  **Integration Tests:**
    *   Write a decision, verify it lands in the correct partition (based on date).
    *   Query API with filters, verify correct results.

## 7. Acceptance Criteria Implementation Map

| AC | Status | Implementation Note |
| :--- | :--- | :--- |
| 1. DB Storage | ✅ | Implemented via Partitioned Table. |
| 2. Structured Logs | ✅ | Pino + Redaction + Trace ID. |
| 3. Log Levels | ✅ | Defined in Strategy. |
| 4. Detail API | ✅ | `GET /decisions/:id` |
| 5. Archiving | ✏️ | "Partition Drop + Export" strategy. |
| 6. Search Filters | ✅ | `GET /decisions` with indexes. |
| 7. Complex Queries | ⚠️ | Simplify to "Filtered Search". Full OLAP is out of scope. |