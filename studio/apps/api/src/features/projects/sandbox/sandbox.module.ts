import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../../../core/auth/auth.module';
import { ProjectsModule } from '../projects.module';
import { SandboxController } from './sandbox.controller';
import { WorkspaceModule } from '../workspace/workspace.module';
import { SandboxService } from './services/sandbox/sandbox.service';

@Module({
  imports: [AuthModule, WorkspaceModule, forwardRef(() => ProjectsModule)],
  controllers: [SandboxController],
  providers: [SandboxService],
  exports: [SandboxService],
})
export class SandboxModule {}
