import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../../../core/auth/auth.module';
import { ProjectsModule } from '../projects.module';
import { HeartbeatController } from './heartbeat.controller';
import { WorkspaceModule } from '../workspace/workspace.module';
import { HeartbeatService } from './services/heartbeat/heartbeat.service';

@Module({
  imports: [AuthModule, WorkspaceModule, forwardRef(() => ProjectsModule)],
  controllers: [HeartbeatController],
  providers: [HeartbeatService],
  exports: [HeartbeatService],
})
export class HeartbeatModule {}
