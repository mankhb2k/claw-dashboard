-- CreateTable
CREATE TABLE "project_skills" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "heading" TEXT,
    "body_markdown" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "last_synced_at" TIMESTAMP(3),
    "last_sync_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_skills_project_id_idx" ON "project_skills"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_skills_project_id_slug_key" ON "project_skills"("project_id", "slug");

-- AddForeignKey
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
