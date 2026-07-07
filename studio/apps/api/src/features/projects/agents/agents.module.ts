import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../../../core/auth/auth.module';
import { ProjectsModule } from '../projects.module';
import { AgentApiKeysController } from './agent-api-keys.controller';
import { AgentController } from './agent.controller';
import { CollaborationController } from './collaboration.controller';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AgentService } from './services/agent/agent.service';
import { AgentApiKeysService } from './services/agent-api-keys/agent-api-keys.service';
import { CollaborationService } from './services/collaboration/collaboration.service';

@Module({
  imports: [AuthModule, WorkspaceModule, forwardRef(() => ProjectsModule)],
  controllers: [
    AgentController,
    AgentApiKeysController,
    CollaborationController,
  ],
  providers: [AgentService, AgentApiKeysService, CollaborationService],
  exports: [AgentService, CollaborationService],
})
export class AgentsModule {}
