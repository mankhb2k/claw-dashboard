-- CreateEnum
CREATE TYPE "public"."ConnectorKind" AS ENUM ('API', 'MCP', 'OAUTH');

-- CreateEnum
CREATE TYPE "public"."ConnectorDefinitionStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "public"."ProjectConnectorStatus" AS ENUM ('DISCONNECTED', 'CONNECTED', 'ERROR', 'NEEDS_REAUTH');

-- CreateEnum
CREATE TYPE "public"."ProjectConnectorEventType" AS ENUM ('CREATED', 'UPDATED', 'ENABLED', 'DISABLED', 'TEST_OK', 'TEST_FAIL', 'SECRET_ROTATED');

-- CreateTable
CREATE TABLE "public"."connector_definitions" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "kind" "public"."ConnectorKind" NOT NULL DEFAULT 'API',
    "status" "public"."ConnectorDefinitionStatus" NOT NULL DEFAULT 'ACTIVE',
    "configSchema" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connector_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_connectors" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "connectorDefinitionId" TEXT NOT NULL,
    "displayName" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "connectionStatus" "public"."ProjectConnectorStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "config" JSONB,
    "lastTestedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_connector_secrets" (
    "id" TEXT NOT NULL,
    "projectConnectorId" TEXT NOT NULL,
    "secretKey" VARCHAR(128) NOT NULL,
    "payloadEnc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_connector_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_connector_events" (
    "id" TEXT NOT NULL,
    "projectConnectorId" TEXT NOT NULL,
    "eventType" "public"."ProjectConnectorEventType" NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_connector_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connector_definitions_slug_key" ON "public"."connector_definitions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "uq_project_connector_definition" ON "public"."project_connectors"("projectId", "connectorDefinitionId");

-- CreateIndex
CREATE INDEX "idx_project_connectors_project_enabled" ON "public"."project_connectors"("projectId", "enabled");

-- CreateIndex
CREATE INDEX "idx_project_connectors_project_status" ON "public"."project_connectors"("projectId", "connectionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "uq_project_connector_secret_key" ON "public"."project_connector_secrets"("projectConnectorId", "secretKey");

-- CreateIndex
CREATE INDEX "idx_project_connector_secret_connector" ON "public"."project_connector_secrets"("projectConnectorId");

-- CreateIndex
CREATE INDEX "idx_project_connector_events_connector_created" ON "public"."project_connector_events"("projectConnectorId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."project_connectors" ADD CONSTRAINT "project_connectors_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_connectors" ADD CONSTRAINT "project_connectors_connectorDefinitionId_fkey" FOREIGN KEY ("connectorDefinitionId") REFERENCES "public"."connector_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_connector_secrets" ADD CONSTRAINT "project_connector_secrets_projectConnectorId_fkey" FOREIGN KEY ("projectConnectorId") REFERENCES "public"."project_connectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_connector_events" ADD CONSTRAINT "project_connector_events_projectConnectorId_fkey" FOREIGN KEY ("projectConnectorId") REFERENCES "public"."project_connectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
