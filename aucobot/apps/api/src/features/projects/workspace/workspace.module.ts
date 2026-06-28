import { Module } from '@nestjs/common';

import { OssDiskLayoutMigrationService } from './services/oss-disk-layout-migration/oss-disk-layout-migration.service';
import { OssWorkspaceRepairService } from './services/oss-workspace-repair/oss-workspace-repair.service';
import { WorkspaceService } from './services/workspace/workspace.service';

@Module({
  providers: [
    WorkspaceService,
    OssDiskLayoutMigrationService,
    OssWorkspaceRepairService,
  ],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
