-- CreateTable
CREATE TABLE "node_invites" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "code_prefix" TEXT NOT NULL,
    "label" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "node_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "node_invites_code_hash_key" ON "node_invites"("code_hash");

-- CreateIndex
CREATE INDEX "node_invites_project_id_idx" ON "node_invites"("project_id");

-- CreateIndex
CREATE INDEX "node_invites_expires_at_idx" ON "node_invites"("expires_at");

-- AddForeignKey
ALTER TABLE "node_invites" ADD CONSTRAINT "node_invites_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
