-- Project-level agent collaboration (OpenClaw tools.agentToAgent allow list)
ALTER TABLE "projects"
ADD COLUMN "collaboration_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "collaboration_member_slugs" JSONB NOT NULL DEFAULT '[]';
