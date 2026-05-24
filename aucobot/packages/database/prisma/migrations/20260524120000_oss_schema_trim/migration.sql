-- OSS-only schema: drop cloud / unused tables and project runtime columns.
-- Keeps project_channels (Telegram, Discord, Zalo, …) — OSS messaging, not cloud-only.

DROP TABLE IF EXISTS "workspace_revisions";

ALTER TABLE "projects" DROP COLUMN IF EXISTS "container_name";
ALTER TABLE "projects" DROP COLUMN IF EXISTS "container_id";
ALTER TABLE "projects" DROP COLUMN IF EXISTS "host_port";
ALTER TABLE "projects" DROP COLUMN IF EXISTS "gateway_token";
ALTER TABLE "projects" DROP COLUMN IF EXISTS "volume_name";
ALTER TABLE "projects" DROP COLUMN IF EXISTS "sync_path_hint";

ALTER TYPE "ProjectStatus" RENAME TO "ProjectStatus_old";
CREATE TYPE "ProjectStatus" AS ENUM ('CREATING', 'RUNNING', 'ERROR');
ALTER TABLE "projects" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "projects" ALTER COLUMN "status" TYPE "ProjectStatus" USING (
  CASE
    WHEN "status"::text IN ('STARTING', 'STOPPED') THEN 'ERROR'::"ProjectStatus"
    ELSE "status"::text::"ProjectStatus"
  END
);
ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'CREATING';
DROP TYPE "ProjectStatus_old";

DROP TYPE IF EXISTS "WorkspaceRevisionKind";
