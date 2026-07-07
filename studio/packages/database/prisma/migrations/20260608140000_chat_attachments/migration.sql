-- CreateEnum
CREATE TYPE "ChatAttachmentKind" AS ENUM ('IMAGE', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "ChatAttachmentStatus" AS ENUM ('PENDING', 'LINKED', 'DELETED');

-- CreateTable
CREATE TABLE "chat_attachments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_key" TEXT,
    "kind" "ChatAttachmentKind" NOT NULL,
    "mime_type" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_path" TEXT,
    "storage_key" TEXT,
    "status" "ChatAttachmentStatus" NOT NULL DEFAULT 'PENDING',
    "linked_run_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_attachments_project_id_status_idx" ON "chat_attachments"("project_id", "status");

-- CreateIndex
CREATE INDEX "chat_attachments_project_id_user_id_idx" ON "chat_attachments"("project_id", "user_id");

-- CreateIndex
CREATE INDEX "chat_attachments_expires_at_idx" ON "chat_attachments"("expires_at");

-- AddForeignKey
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
