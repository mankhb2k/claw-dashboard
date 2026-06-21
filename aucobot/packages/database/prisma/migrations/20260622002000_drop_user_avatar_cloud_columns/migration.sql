-- Avatar stored as blob (avatar_data + avatar_mime_type).
-- Drop unused CDN / object-storage URL columns.
ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_url";
ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_storage_key";
