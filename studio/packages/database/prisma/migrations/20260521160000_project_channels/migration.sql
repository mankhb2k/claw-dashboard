-- CreateEnum
CREATE TYPE "ChannelConnectionStatus" AS ENUM ('DISCONNECTED', 'CONFIGURED', 'CONNECTED', 'NEEDS_REAUTH', 'ERROR');

-- CreateTable
CREATE TABLE "project_channels" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "connection_status" "ChannelConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "config" JSONB NOT NULL DEFAULT '{}',
    "last_error" TEXT,
    "last_tested_at" TIMESTAMP(3),
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_channel_secrets" (
    "id" TEXT NOT NULL,
    "project_channel_id" TEXT NOT NULL,
    "secret_key" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_channel_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_channels_project_id_idx" ON "project_channels"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_channels_project_id_channel_id_key" ON "project_channels"("project_id", "channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_channel_secrets_project_channel_id_secret_key_key" ON "project_channel_secrets"("project_channel_id", "secret_key");

-- AddForeignKey
ALTER TABLE "project_channels" ADD CONSTRAINT "project_channels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_channel_secrets" ADD CONSTRAINT "project_channel_secrets_project_channel_id_fkey" FOREIGN KEY ("project_channel_id") REFERENCES "project_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
