-- AlterTable
ALTER TABLE "projects" ADD COLUMN "sandbox_exempt_agent_slugs" JSONB NOT NULL DEFAULT '[]';
