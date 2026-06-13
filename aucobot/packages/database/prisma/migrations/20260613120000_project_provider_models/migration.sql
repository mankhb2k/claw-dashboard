-- CreateTable
CREATE TABLE "project_provider_models" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "openclaw_id" TEXT NOT NULL,
    "display_name" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_provider_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_provider_models_project_id_provider_id_idx" ON "project_provider_models"("project_id", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_provider_models_project_id_provider_id_openclaw_id_key" ON "project_provider_models"("project_id", "provider_id", "openclaw_id");

-- AddForeignKey
ALTER TABLE "project_provider_models" ADD CONSTRAINT "project_provider_models_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
