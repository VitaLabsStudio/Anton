-- CreateTable
CREATE TABLE "worker_heartbeats" (
    "id" TEXT NOT NULL,
    "worker_name" TEXT NOT NULL,
    "posts_processed_count" INTEGER NOT NULL DEFAULT 0,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_heartbeats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "worker_heartbeats_worker_name_key" ON "worker_heartbeats"("worker_name");

-- CreateIndex
CREATE INDEX "worker_heartbeats_last_activity_at_idx" ON "worker_heartbeats"("last_activity_at");
