-- AlterTable
ALTER TABLE "projects" ADD COLUMN "displayName" TEXT NOT NULL DEFAULT '';

-- Backfill existing rows: use subdomain as default display name
UPDATE "projects" SET "displayName" = "subdomain" WHERE "displayName" = '';
