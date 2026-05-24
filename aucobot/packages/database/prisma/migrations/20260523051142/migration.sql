-- CreateEnum
CREATE TYPE "ConnectorConnectionStatus" AS ENUM ('DISCONNECTED', 'CONNECTED', 'ERROR', 'NEEDS_REAUTH');

-- CreateTable
CREATE TABLE "project_connectors" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "connector_slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "connection_status" "ConnectorConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "config" JSONB NOT NULL DEFAULT '{}',
    "last_tested_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_connector_secrets" (
    "id" TEXT NOT NULL,
    "project_connector_id" TEXT NOT NULL,
    "secret_key" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_connector_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_connectors_project_id_idx" ON "project_connectors"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_connectors_project_id_connector_slug_key" ON "project_connectors"("project_id", "connector_slug");

-- CreateIndex
CREATE UNIQUE INDEX "project_connector_secrets_project_connector_id_secret_key_key" ON "project_connector_secrets"("project_connector_id", "secret_key");

-- AddForeignKey
ALTER TABLE "project_connectors" ADD CONSTRAINT "project_connectors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_connector_secrets" ADD CONSTRAINT "project_connector_secrets_project_connector_id_fkey" FOREIGN KEY ("project_connector_id") REFERENCES "project_connectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
