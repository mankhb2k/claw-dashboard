-- AlterTable
ALTER TABLE "projects" ADD COLUMN "sandbox_default_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "sandbox_default_mode" TEXT NOT NULL DEFAULT 'non-main';
