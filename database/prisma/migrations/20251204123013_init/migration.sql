-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('TWITTER', 'REDDIT', 'THREADS');

-- CreateEnum
CREATE TYPE "OperationalMode" AS ENUM ('HELPFUL', 'ENGAGEMENT', 'HYBRID', 'DISENGAGED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReplyType" AS ENUM ('MANUAL', 'AUTO');

-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('DRAFT', 'RUNNING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EscalationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EscalationStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "archetypes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "archetypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_followers" INTEGER NOT NULL,
    "max_followers" INTEGER,
    "description" TEXT,
    "priority_weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "power_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitor_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "aggregation_type" TEXT NOT NULL DEFAULT 'SUM',
    "unit" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_reasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "severity" "EscalationPriority" NOT NULL DEFAULT 'MEDIUM',
    "auto_escalate" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escalation_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "champion_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_engagement" INTEGER NOT NULL,
    "benefits" JSONB NOT NULL DEFAULT '[]',
    "description" TEXT,
    "priority_score" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "champion_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platform_id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "display_name" TEXT,
    "follower_count" INTEGER NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_power_user" BOOLEAN NOT NULL DEFAULT false,
    "power_tier_id" TEXT,
    "archetype_tags" TEXT[],
    "relationship_score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "interaction_history" JSONB NOT NULL DEFAULT '[]',
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platform_post_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "keyword_matches" TEXT[],
    "keyword_categories" TEXT[],
    "spam_filtered" BOOLEAN NOT NULL DEFAULT false,
    "raw_metrics" JSONB,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
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
    "competitor_detected" BOOLEAN NOT NULL DEFAULT false,
    "is_power_user" BOOLEAN NOT NULL DEFAULT false,
    "experiment_id" TEXT,
    "experiment_variant" TEXT,
    "is_randomized_experiment" BOOLEAN NOT NULL DEFAULT false,
    "predicted_mode" "OperationalMode",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replies" (
    "id" TEXT NOT NULL,
    "decision_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "archetype_id" TEXT,
    "platform" "Platform" NOT NULL,
    "platform_post_id" TEXT,
    "utm_code" TEXT,
    "help_count" INTEGER NOT NULL DEFAULT 0,
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "posted_at" TIMESTAMP(3),
    "metrics_json" JSONB,
    "deleted_at" TIMESTAMP(3),
    "delete_reason" TEXT,
    "reply_type" "ReplyType" NOT NULL DEFAULT 'AUTO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" TEXT,
    "primary_mechanism" TEXT,
    "price_point" TEXT,
    "brand_keywords" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitive_mentions" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "competitor_id" TEXT NOT NULL,
    "sentiment" TEXT,
    "satisfaction" TEXT,
    "opportunity_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitive_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_champions" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "tier_id" TEXT,
    "engagement_count" INTEGER NOT NULL DEFAULT 0,
    "dm_sent_at" TIMESTAMP(3),
    "dm_response" TEXT,
    "sample_sent" BOOLEAN NOT NULL DEFAULT false,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "advocate_status" TEXT NOT NULL DEFAULT 'POTENTIAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_champions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "variant_a" JSONB NOT NULL,
    "variant_b" JSONB NOT NULL,
    "metric" TEXT NOT NULL,
    "traffic_split" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "status" "ExperimentStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "results_json" JSONB,
    "winner" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_adjustment_logs" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "valid_segments" INTEGER NOT NULL,
    "total_segments" INTEGER NOT NULL,
    "sample_sizes" JSONB NOT NULL,
    "old_weights" JSONB NOT NULL,
    "new_weights" JSONB NOT NULL,
    "predicted_improvement" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_adjustment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_events" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adjustment_type" TEXT NOT NULL,
    "adjustment" JSONB NOT NULL,
    "predicted_improvement" DOUBLE PRECISION NOT NULL,
    "baseline_performance" DOUBLE PRECISION NOT NULL,
    "actual_improvement" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "evaluated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "randomized_experiments" (
    "id" TEXT NOT NULL,
    "decision_id" TEXT NOT NULL,
    "predicted_mode" "OperationalMode" NOT NULL,
    "actual_mode" "OperationalMode" NOT NULL,
    "predicted_outcome" DOUBLE PRECISION NOT NULL,
    "actual_outcome" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "randomized_experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segmented_weights" (
    "id" TEXT NOT NULL,
    "segment_type" TEXT NOT NULL,
    "segment_key" TEXT NOT NULL,
    "sss_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "ars_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "evs_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "trs_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "sample_size" INTEGER NOT NULL DEFAULT 0,
    "performance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "segmented_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "platform" "Platform" NOT NULL,
    "kpi_type_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalations" (
    "id" TEXT NOT NULL,
    "post_id" TEXT,
    "decision_id" TEXT,
    "reply_id" TEXT,
    "reason_id" TEXT,
    "reason_text" TEXT,
    "priority" "EscalationPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "EscalationStatus" NOT NULL DEFAULT 'OPEN',
    "assigned_to" TEXT,
    "resolved_by" TEXT,
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "escalations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "details_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_checks" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "archetypes_name_key" ON "archetypes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "power_tiers_name_key" ON "power_tiers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "competitor_categories_name_key" ON "competitor_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_types_name_key" ON "kpi_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "escalation_reasons_name_key" ON "escalation_reasons"("name");

-- CreateIndex
CREATE UNIQUE INDEX "champion_tiers_name_key" ON "champion_tiers"("name");

-- CreateIndex
CREATE INDEX "authors_platform_handle_idx" ON "authors"("platform", "handle");

-- CreateIndex
CREATE INDEX "authors_is_power_user_idx" ON "authors"("is_power_user");

-- CreateIndex
CREATE INDEX "authors_relationship_score_idx" ON "authors"("relationship_score");

-- CreateIndex
CREATE UNIQUE INDEX "authors_platform_platform_id_key" ON "authors"("platform", "platform_id");

-- CreateIndex
CREATE INDEX "posts_processed_at_idx" ON "posts"("processed_at");

-- CreateIndex
CREATE INDEX "posts_platform_detected_at_idx" ON "posts"("platform", "detected_at");

-- CreateIndex
CREATE INDEX "posts_spam_filtered_idx" ON "posts"("spam_filtered");

-- CreateIndex
CREATE UNIQUE INDEX "posts_platform_platform_post_id_key" ON "posts"("platform", "platform_post_id");

-- CreateIndex
CREATE INDEX "decisions_created_at_idx" ON "decisions"("created_at");

-- CreateIndex
CREATE INDEX "decisions_experiment_variant_idx" ON "decisions"("experiment_variant");

-- CreateIndex
CREATE INDEX "decisions_is_randomized_experiment_idx" ON "decisions"("is_randomized_experiment");

-- CreateIndex
CREATE INDEX "decisions_mode_idx" ON "decisions"("mode");

-- CreateIndex
CREATE INDEX "decisions_composite_score_idx" ON "decisions"("composite_score");

-- CreateIndex
CREATE INDEX "replies_posted_at_idx" ON "replies"("posted_at");

-- CreateIndex
CREATE INDEX "replies_approval_status_idx" ON "replies"("approval_status");

-- CreateIndex
CREATE INDEX "replies_platform_posted_at_idx" ON "replies"("platform", "posted_at");

-- CreateIndex
CREATE INDEX "replies_platform_post_id_idx" ON "replies"("platform_post_id");

-- CreateIndex
CREATE UNIQUE INDEX "competitors_name_key" ON "competitors"("name");

-- CreateIndex
CREATE INDEX "competitive_mentions_sentiment_idx" ON "competitive_mentions"("sentiment");

-- CreateIndex
CREATE INDEX "competitive_mentions_opportunity_score_idx" ON "competitive_mentions"("opportunity_score");

-- CreateIndex
CREATE UNIQUE INDEX "community_champions_author_id_key" ON "community_champions"("author_id");

-- CreateIndex
CREATE INDEX "community_champions_advocate_status_idx" ON "community_champions"("advocate_status");

-- CreateIndex
CREATE INDEX "community_champions_engagement_count_idx" ON "community_champions"("engagement_count");

-- CreateIndex
CREATE INDEX "experiments_status_idx" ON "experiments"("status");

-- CreateIndex
CREATE INDEX "experiments_start_date_idx" ON "experiments"("start_date");

-- CreateIndex
CREATE INDEX "weight_adjustment_logs_date_idx" ON "weight_adjustment_logs"("date");

-- CreateIndex
CREATE INDEX "learning_events_date_idx" ON "learning_events"("date");

-- CreateIndex
CREATE INDEX "learning_events_adjustment_type_idx" ON "learning_events"("adjustment_type");

-- CreateIndex
CREATE INDEX "randomized_experiments_predicted_mode_idx" ON "randomized_experiments"("predicted_mode");

-- CreateIndex
CREATE INDEX "randomized_experiments_actual_mode_idx" ON "randomized_experiments"("actual_mode");

-- CreateIndex
CREATE UNIQUE INDEX "segmented_weights_segment_type_segment_key_key" ON "segmented_weights"("segment_type", "segment_key");

-- CreateIndex
CREATE INDEX "kpi_metrics_date_idx" ON "kpi_metrics"("date");

-- CreateIndex
CREATE INDEX "kpi_metrics_platform_idx" ON "kpi_metrics"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_metrics_date_platform_kpi_type_id_metric_name_key" ON "kpi_metrics"("date", "platform", "kpi_type_id", "metric_name");

-- CreateIndex
CREATE INDEX "escalations_status_priority_idx" ON "escalations"("status", "priority");

-- CreateIndex
CREATE INDEX "escalations_created_at_idx" ON "escalations"("created_at");

-- CreateIndex
CREATE INDEX "escalations_assigned_to_idx" ON "escalations"("assigned_to");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs"("actor");

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_power_tier_id_fkey" FOREIGN KEY ("power_tier_id") REFERENCES "power_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_archetype_id_fkey" FOREIGN KEY ("archetype_id") REFERENCES "archetypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_decision_id_fkey" FOREIGN KEY ("decision_id") REFERENCES "decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_archetype_id_fkey" FOREIGN KEY ("archetype_id") REFERENCES "archetypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "competitor_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitive_mentions" ADD CONSTRAINT "competitive_mentions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitive_mentions" ADD CONSTRAINT "competitive_mentions_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_champions" ADD CONSTRAINT "community_champions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_champions" ADD CONSTRAINT "community_champions_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "champion_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "randomized_experiments" ADD CONSTRAINT "randomized_experiments_decision_id_fkey" FOREIGN KEY ("decision_id") REFERENCES "decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_metrics" ADD CONSTRAINT "kpi_metrics_kpi_type_id_fkey" FOREIGN KEY ("kpi_type_id") REFERENCES "kpi_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_decision_id_fkey" FOREIGN KEY ("decision_id") REFERENCES "decisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_reply_id_fkey" FOREIGN KEY ("reply_id") REFERENCES "replies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_reason_id_fkey" FOREIGN KEY ("reason_id") REFERENCES "escalation_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
