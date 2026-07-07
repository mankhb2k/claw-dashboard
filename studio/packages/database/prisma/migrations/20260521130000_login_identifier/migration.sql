-- Rename email → login (username or email, no verification)

ALTER TABLE "users" RENAME COLUMN "email" TO "login";

ALTER INDEX "users_email_key" RENAME TO "users_login_key";
