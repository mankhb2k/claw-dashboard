-- CreateEnum
CREATE TYPE "WorkspaceRevisionKind" AS ENUM ('OPENCLAW_JSON', 'WORKSPACE_BUNDLE');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "volume_name" TEXT,
ADD COLUMN "sync_path_hint" TEXT;

-- CreateTable
CREATE TABLE "workspace_revisions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "kind" "WorkspaceRevisionKind" NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspace_revisions_project_id_created_at_idx" ON "workspace_revisions"("project_id", "created_at");

-- AddForeignKey
ALTER TABLE "workspace_revisions" ADD CONSTRAINT "workspace_revisions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
