import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../../core/auth/auth.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ProjectsModule } from '../projects.module';
import { GatewayModule } from '../gateway/gateway.module';
import { UsageModule } from '../usage/usage.module';
import { CronController } from './cron.controller';
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
