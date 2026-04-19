-- CreateEnum
CREATE TYPE "ContainerInstanceStatus" AS ENUM ('STARTING', 'RUNNING', 'STOPPING', 'STOPPED', 'ERROR', 'DESTROYED');

-- CreateTable
CREATE TABLE "container_instances" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "containerId" TEXT,
    "imageVersion" TEXT NOT NULL,
    "cpuLimit" DECIMAL(3,1) NOT NULL,
    "ramLimit" INTEGER NOT NULL,
    "status" "ContainerInstanceStatus" NOT NULL DEFAULT 'STARTING',
    "nodeId" TEXT NOT NULL DEFAULT 'vps-1',
    "exitCode" INTEGER,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "container_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "container_instances_projectId_idx" ON "container_instances"("projectId");

-- CreateIndex
CREATE INDEX "idx_instances_node_status" ON "container_instances"("nodeId", "status");

-- AddForeignKey
ALTER TABLE "container_instances" ADD CONSTRAINT "container_instances_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
