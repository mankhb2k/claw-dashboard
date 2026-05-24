-- Persist gateway token per project (env override or backend-generated).

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "gateway_token" TEXT;
