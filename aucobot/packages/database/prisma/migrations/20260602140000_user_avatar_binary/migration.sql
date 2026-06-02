-- OSS: avatar_data + avatar_mime_type. Cloud: avatar_storage_key (+ optional avatar_url CDN).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_mime_type" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_data" BYTEA;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_storage_key" TEXT;
