import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../../core/auth/auth.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ProjectsModule } from '../projects.module';
import { GatewayRpcService } from '../gateway/gateway-rpc.service';
import { CronController } from './cron.controller';
import { CronService } from './cron.service';

@Module({
  imports: [AuthModule, WorkspaceModule, forwardRef(() => ProjectsModule)],
  controllers: [CronController],
  providers: [GatewayRpcService, CronService],
  exports: [CronService, GatewayRpcService],
})
export class CronModule {}
