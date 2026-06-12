import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../../core/auth/auth.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ProjectsModule } from '../projects.module';
import { ExecPolicyController } from './exec-policy.controller';
import { ExecPolicyService } from './services/exec-policy/exec-policy.service';

@Module({
  imports: [AuthModule, WorkspaceModule, forwardRef(() => ProjectsModule)],
  controllers: [ExecPolicyController],
  providers: [ExecPolicyService],
  exports: [ExecPolicyService],
})
export class ExecPolicyModule {}
