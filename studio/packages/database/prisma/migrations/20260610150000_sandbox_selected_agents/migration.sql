-- AlterTable
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "sandbox_applied_agent_slugs" JSONB NOT NULL DEFAULT '[]';

-- Migrate legacy non-main → selected (explicit agent pick in UI)
UPDATE "projects"
SET "sandbox_default_mode" = 'selected'
WHERE "sandbox_default_mode" = 'non-main';

-- Default new projects / unset rows to all agents
ALTER TABLE "projects" ALTER COLUMN "sandbox_default_mode" SET DEFAULT 'all';
