-- DropForeignKey
ALTER TABLE "escalations" DROP CONSTRAINT "escalations_decision_id_decision_created_at_fkey";

-- DropForeignKey
ALTER TABLE "randomized_experiments" DROP CONSTRAINT "randomized_experiments_decision_id_decision_created_at_fkey";

-- DropForeignKey
ALTER TABLE "replies" DROP CONSTRAINT "replies_decision_id_decision_created_at_fkey";

-- CreateIndex
CREATE INDEX "idx_decisions_platform_mode_created" ON "decisions"("platform", "mode", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_decisions_sss_mode" ON "decisions"("sss_score", "mode");

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_archetype_id_fkey" FOREIGN KEY ("archetype_id") REFERENCES "archetypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_decision_id_decision_created_at_fkey" FOREIGN KEY ("decision_id", "decision_created_at") REFERENCES "decisions"("id", "created_at") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "randomized_experiments" ADD CONSTRAINT "randomized_experiments_decision_id_decision_created_at_fkey" FOREIGN KEY ("decision_id", "decision_created_at") REFERENCES "decisions"("id", "created_at") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_decision_id_decision_created_at_fkey" FOREIGN KEY ("decision_id", "decision_created_at") REFERENCES "decisions"("id", "created_at") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_decisions_composite_score" RENAME TO "decisions_composite_score_idx";

-- RenameIndex
ALTER INDEX "idx_decisions_created_at" RENAME TO "decisions_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_decisions_experimentVariant" RENAME TO "decisions_experiment_variant_idx";

-- RenameIndex
ALTER INDEX "idx_decisions_isRandomizedExperiment" RENAME TO "decisions_is_randomized_experiment_idx";

-- RenameIndex
ALTER INDEX "idx_decisions_mode" RENAME TO "decisions_mode_idx";
