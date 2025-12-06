-- DropForeignKey
ALTER TABLE "escalations" DROP CONSTRAINT "escalations_decision_id_fkey";

-- DropForeignKey
ALTER TABLE "escalations" DROP CONSTRAINT "escalations_post_id_fkey";

-- DropForeignKey
ALTER TABLE "escalations" DROP CONSTRAINT "escalations_reply_id_fkey";

-- AlterTable
ALTER TABLE "decisions" ADD COLUMN "decision_logic_version" TEXT NOT NULL DEFAULT 'v2.1';

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_decision_id_fkey" FOREIGN KEY ("decision_id") REFERENCES "decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_reply_id_fkey" FOREIGN KEY ("reply_id") REFERENCES "replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
