import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { isOssRuntime } from '../../../runtime/runtime-mode';
import { migrateOssProjectDiskLayout } from '@claw-dashboard/workspace-sync';

@Injectable()
export class OssDiskLayoutMigrationService implements OnModuleInit {
  private readonly log = new Logger(OssDiskLayoutMigrationService.name);

  async onModuleInit(): Promise<void> {
    if (!isOssRuntime()) return;

    try {
      const result = await migrateOssProjectDiskLayout({
        dataRoot: process.env.OPENCLAW_DATA_ROOT?.trim(),
      });

      if (result.action === 'renamed' && result.sourceDir) {
        this.log.log(
          `[oss-disk] migrated legacy folder "${result.sourceDir}" → default/${
            result.archivedDirs?.length
              ? `; archived: ${result.archivedDirs.join(', ')}`
              : ''
          }`,
        );
        return;
      }

      if (result.archivedDirs?.length) {
        this.log.log(
          `[oss-disk] archived legacy folders: ${result.archivedDirs.join(', ')}`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.error(`[oss-disk] migration failed: ${message}`);
    }
  }
}
