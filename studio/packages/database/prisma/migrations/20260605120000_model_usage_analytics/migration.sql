-- AlterTable
ALTER TABLE "users" ADD COLUMN "analytics_timezone" TEXT NOT NULL DEFAULT 'UTC';

-- CreateEnum
CREATE TYPE "UsageStatus" AS ENUM ('SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UsageSource" AS ENUM ('CHAT_UI', 'CHANNEL', 'CRON', 'API_KEY', 'HEARTBEAT', 'OTHER');

-- CreateTable
CREATE TABLE "model_usage_events" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "agent_slug" TEXT,
    "provider_id" TEXT,
    "model_id" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "status" "UsageStatus" NOT NULL,
    "latency_ms" INTEGER,
    "source" "UsageSource" NOT NULL,
    "external_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_pricing" (
    "provider_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "input_per_1m_usd" DECIMAL(10,6) NOT NULL,
    "output_per_1m_usd" DECIMAL(10,6) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_pricing_pkey" PRIMARY KEY ("provider_id","model_id")
);

-- CreateIndex
CREATE INDEX "model_usage_events_project_id_created_at_idx" ON "model_usage_events"("project_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "model_usage_events_user_id_created_at_idx" ON "model_usage_events"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "model_usage_events_project_id_external_id_key" ON "model_usage_events"("project_id", "external_id");

-- AddForeignKey
ALTER TABLE "model_usage_events" ADD CONSTRAINT "model_usage_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_usage_events" ADD CONSTRAINT "model_usage_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
