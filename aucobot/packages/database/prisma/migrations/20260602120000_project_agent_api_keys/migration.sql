-- CreateTable
CREATE TABLE "project_agent_api_keys" (
    "id" TEXT NOT NULL,
    "project_agent_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "token_prefix" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_agent_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_agent_api_keys_token_hash_key" ON "project_agent_api_keys"("token_hash");

-- CreateIndex
CREATE INDEX "project_agent_api_keys_project_agent_id_idx" ON "project_agent_api_keys"("project_agent_id");

-- CreateIndex
CREATE INDEX "project_agent_api_keys_project_agent_id_revoked_at_idx" ON "project_agent_api_keys"("project_agent_id", "revoked_at");

-- AddForeignKey
ALTER TABLE "project_agent_api_keys" ADD CONSTRAINT "project_agent_api_keys_project_agent_id_fkey" FOREIGN KEY ("project_agent_id") REFERENCES "project_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
