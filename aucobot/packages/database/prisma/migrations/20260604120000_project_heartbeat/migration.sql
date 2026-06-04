-- AlterTable
ALTER TABLE "projects" ADD COLUMN "heartbeat_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "heartbeat_every" TEXT NOT NULL DEFAULT '30m';
ALTER TABLE "projects" ADD COLUMN "heartbeat_md" TEXT;

-- AlterTable
ALTER TABLE "project_agents" ADD COLUMN "heartbeat_mode" TEXT NOT NULL DEFAULT 'off';
ALTER TABLE "project_agents" ADD COLUMN "heartbeat_every" TEXT;
ALTER TABLE "project_agents" ADD COLUMN "heartbeat_md" TEXT;
