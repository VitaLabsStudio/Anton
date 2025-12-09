-- 1. Drop Foreign Keys referencing decisions
ALTER TABLE "replies" DROP CONSTRAINT "replies_decision_id_fkey";
ALTER TABLE "randomized_experiments" DROP CONSTRAINT "randomized_experiments_decision_id_fkey";
ALTER TABLE "escalations" DROP CONSTRAINT "escalations_decision_id_fkey";

-- 2. Rename legacy table
ALTER TABLE "decisions" RENAME TO "decisions_legacy";
ALTER TABLE "decisions_legacy" RENAME CONSTRAINT "decisions_pkey" TO "decisions_legacy_pkey";

-- Rename Indexes if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_decisions_composite_mode_needs_review') THEN
    ALTER INDEX "idx_decisions_composite_mode_needs_review" RENAME TO "idx_decisions_legacy_composite_mode_needs_review";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_decisions_post_id') THEN
    ALTER INDEX "idx_decisions_post_id" RENAME TO "idx_decisions_legacy_post_id";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_decisions_composite_score') THEN
    ALTER INDEX "idx_decisions_composite_score" RENAME TO "idx_decisions_legacy_composite_score";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_decisions_experimentVariant') THEN
    ALTER INDEX "idx_decisions_experimentVariant" RENAME TO "idx_decisions_legacy_experimentVariant";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_decisions_isRandomizedExperiment') THEN
    ALTER INDEX "idx_decisions_isRandomizedExperiment" RENAME TO "idx_decisions_legacy_isRandomizedExperiment";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_decisions_mode') THEN
    ALTER INDEX "idx_decisions_mode" RENAME TO "idx_decisions_legacy_mode";
  END IF;
END $$;

-- 3. Create new partitioned table
CREATE TABLE "decisions" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "sss_score" DOUBLE PRECISION NOT NULL,
    "ars_score" DOUBLE PRECISION NOT NULL,
    "evs_score" DOUBLE PRECISION NOT NULL,
    "trs_score" DOUBLE PRECISION NOT NULL,
    "composite_score" DOUBLE PRECISION NOT NULL,
    "mode" "OperationalMode" NOT NULL,
    "archetype_id" TEXT,
    "safety_flags" TEXT[],
    "signals_json" JSONB,
    "temporal_context" JSONB,
    "competitor_detected" TEXT,
    "is_power_user" BOOLEAN NOT NULL DEFAULT false,
    "segment_used" TEXT,
    "decision_logic_version" TEXT NOT NULL DEFAULT 'v2.1',
    "needs_review" BOOLEAN NOT NULL DEFAULT false,
    "review_reason" TEXT,
    "composite_score_lower" DOUBLE PRECISION NOT NULL,
    "composite_score_upper" DOUBLE PRECISION NOT NULL,
    "mode_confidence" DOUBLE PRECISION NOT NULL,
    "mode_probabilities" JSONB,
    "experiment_id" TEXT,
    "experiment_variant" TEXT,
    "is_randomized_experiment" BOOLEAN NOT NULL DEFAULT false,
    "predicted_mode" "OperationalMode",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id", "created_at")
) PARTITION BY RANGE ("created_at");

-- 4. Create Partitions
CREATE TABLE "decisions_y2025m12" PARTITION OF "decisions" FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
CREATE TABLE "decisions_y2026m01" PARTITION OF "decisions" FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE "decisions_y2026m02" PARTITION OF "decisions" FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- 5. Backfill Decisions (Active 90 days)
INSERT INTO "decisions" (
    id, post_id, platform, sss_score, ars_score, evs_score, trs_score, composite_score, mode,
    archetype_id, safety_flags, signals_json, temporal_context, competitor_detected, is_power_user,
    segment_used, decision_logic_version, needs_review, review_reason, composite_score_lower,
    composite_score_upper, mode_confidence, mode_probabilities, experiment_id, experiment_variant,
    is_randomized_experiment, predicted_mode, created_at
)
SELECT 
    d.id, d.post_id, p.platform, d.sss_score, d.ars_score, d.evs_score, d.trs_score, d.composite_score, d.mode,
    d.archetype_id, d.safety_flags, d.signals_json, d.temporal_context, 
    NULL as competitor_detected, 
    d.is_power_user,
    NULL as segment_used, 
    d.decision_logic_version, 
    false as needs_review, 
    NULL as review_reason, 
    d.composite_score as composite_score_lower, 
    d.composite_score as composite_score_upper, 
    1.0 as mode_confidence, 
    NULL as mode_probabilities, 
    d.experiment_id, d.experiment_variant,
    d.is_randomized_experiment, d.predicted_mode, d.created_at
FROM "decisions_legacy" d
JOIN "posts" p ON d.post_id = p.id
WHERE d.created_at >= NOW() - INTERVAL '90 days';

-- 6. Update related tables with decision_created_at

-- Replies
ALTER TABLE "replies" ADD COLUMN "decision_created_at" TIMESTAMP(3);
UPDATE "replies" r SET "decision_created_at" = d."created_at" FROM "decisions_legacy" d WHERE r."decision_id" = d."id";
DELETE FROM "replies" WHERE "decision_created_at" IS NULL;
ALTER TABLE "replies" ALTER COLUMN "decision_created_at" SET NOT NULL;

-- RandomizedExperiments
ALTER TABLE "randomized_experiments" ADD COLUMN "decision_created_at" TIMESTAMP(3);
UPDATE "randomized_experiments" r SET "decision_created_at" = d."created_at" FROM "decisions_legacy" d WHERE r."decision_id" = d."id";
DELETE FROM "randomized_experiments" WHERE "decision_created_at" IS NULL;
ALTER TABLE "randomized_experiments" ALTER COLUMN "decision_created_at" SET NOT NULL;

-- Escalations
ALTER TABLE "escalations" ADD COLUMN "decision_created_at" TIMESTAMP(3);
UPDATE "escalations" r SET "decision_created_at" = d."created_at" FROM "decisions_legacy" d WHERE r."decision_id" = d."id";
UPDATE "escalations" SET "decision_id" = NULL WHERE "decision_id" IS NOT NULL AND "decision_created_at" IS NULL;

-- 7. Add new Foreign Keys
ALTER TABLE "replies" ADD CONSTRAINT "replies_decision_id_decision_created_at_fkey" 
    FOREIGN KEY ("decision_id", "decision_created_at") REFERENCES "decisions"("id", "created_at") ON DELETE CASCADE;

ALTER TABLE "randomized_experiments" ADD CONSTRAINT "randomized_experiments_decision_id_decision_created_at_fkey" 
    FOREIGN KEY ("decision_id", "decision_created_at") REFERENCES "decisions"("id", "created_at") ON DELETE CASCADE;

ALTER TABLE "escalations" ADD CONSTRAINT "escalations_decision_id_decision_created_at_fkey" 
    FOREIGN KEY ("decision_id", "decision_created_at") REFERENCES "decisions"("id", "created_at") ON DELETE CASCADE;

-- 8. Create Indexes on parent table
CREATE INDEX "idx_decisions_composite_mode_needs_review" ON "decisions"("created_at", "composite_score", "mode", "needs_review");
CREATE INDEX "idx_decisions_post_id" ON "decisions"("post_id");
CREATE INDEX "idx_decisions_composite_score" ON "decisions"("composite_score");
CREATE INDEX "idx_decisions_experimentVariant" ON "decisions"("experiment_variant");
CREATE INDEX "idx_decisions_isRandomizedExperiment" ON "decisions"("is_randomized_experiment");
CREATE INDEX "idx_decisions_mode" ON "decisions"("mode");
CREATE INDEX "idx_decisions_created_at" ON "decisions"("created_at");

-- Indexes from the future migration
CREATE INDEX IF NOT EXISTS "idx_segment_weights_sample" ON "segmented_weights" ("segment_type", "segment_key", "sample_size");
CREATE INDEX IF NOT EXISTS "idx_posts_processed_at_null" ON "posts" ("processed_at") WHERE "processed_at" IS NULL;

-- 9. Drop legacy table
DROP TABLE "decisions_legacy";