-- CreateTable
CREATE TABLE "project_provider_keys" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "env_key" TEXT NOT NULL,
    "label" TEXT,
    "ciphertext" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "default_model" TEXT,
    "last_tested_at" TIMESTAMP(3),
    "last_test_ok" BOOLEAN,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_provider_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_provider_keys_project_id_idx" ON "project_provider_keys"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_provider_keys_project_id_provider_id_key" ON "project_provider_keys"("project_id", "provider_id");

-- AddForeignKey
ALTER TABLE "project_provider_keys" ADD CONSTRAINT "project_provider_keys_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
