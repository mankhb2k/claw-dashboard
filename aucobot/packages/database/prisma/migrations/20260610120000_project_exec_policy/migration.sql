-- AlterTable
ALTER TABLE "projects" ADD COLUMN "exec_ask_policy" TEXT NOT NULL DEFAULT 'on-miss';
ALTER TABLE "projects" ADD COLUMN "exec_safe_bins" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "projects" ADD COLUMN "exec_timeout_sec" INTEGER NOT NULL DEFAULT 1800;
