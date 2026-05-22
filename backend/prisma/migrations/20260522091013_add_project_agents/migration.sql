-- CreateTable
CREATE TABLE "agent_templates" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "vibe" TEXT NOT NULL,
    "default_model" TEXT NOT NULL,
    "tools_profile" TEXT NOT NULL,
    "sandbox_enabled" BOOLEAN NOT NULL DEFAULT false,
    "bootstrap_identity" TEXT NOT NULL,
    "bootstrap_soul" TEXT NOT NULL,
    "bootstrap_agents" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_templates_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "project_agents" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "form_data" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "last_synced_at" TIMESTAMP(3),
    "last_sync_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_agents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_agents_project_id_idx" ON "project_agents"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_agents_project_id_slug_key" ON "project_agents"("project_id", "slug");

-- AddForeignKey
ALTER TABLE "project_agents" ADD CONSTRAINT "project_agents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
