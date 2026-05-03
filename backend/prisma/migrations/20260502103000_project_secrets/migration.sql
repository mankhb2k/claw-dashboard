-- CreateTable
CREATE TABLE "project_secrets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "secretKey" VARCHAR(128) NOT NULL,
    "payloadEnc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_secrets_projectId_idx" ON "project_secrets"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_project_secret_key" ON "project_secrets"("projectId", "secretKey");

-- AddForeignKey
ALTER TABLE "project_secrets" ADD CONSTRAINT "project_secrets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
