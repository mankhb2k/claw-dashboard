-- OSS auth: login identifier → username only (no email)
ALTER TABLE "users" RENAME COLUMN "login" TO "username";

ALTER INDEX "users_login_key" RENAME TO "users_username_key";
