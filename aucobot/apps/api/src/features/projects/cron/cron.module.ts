import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../../../core/auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';
import { ProjectsModule } from '../projects.module';
import { CronController } from './cron.controller';
import { UsageModule } from '../usage/usage.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { CronService } from './services/cron/cron.service';

@Module({
  imports: [
    AuthModule,
    WorkspaceModule,
    GatewayModule,
    UsageModule,
    forwardRef(() => ProjectsModule),
  ],
  controllers: [CronController],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
