import { Module, forwardRef } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectSkillsController } from './skills/project-skills.controller';
import { AgentController } from './agents/agent.controller';
import { AgentApiKeysController } from './agents/agent-api-keys.controller';
import { AgentApiKeysService } from './agents/agent-api-keys.service';
import { CollaborationController } from './agents/collaboration.controller';
import { CollaborationService } from './agents/collaboration.service';
import { SkillAiEditorController } from './skill-ai-editor/skill-ai-editor.controller';
import { AgentAiEditorController } from './agent-ai-editor/agent-ai-editor.controller';
import { ProjectConnectorsCatalogController } from './connectors/project-connectors-catalog.controller';
import { ProjectConnectorsController } from './connectors/project-connectors.controller';
import { ConnectorOAuthController } from './connectors/connector-oauth.controller';
import { ProjectsService } from './projects.service';
import { ProjectSkillsService } from './skills/project-skills.service';
import { SkillStoreService } from './skills/skill-store.service';
import { AgentService } from './agents/agent.service';
import { SkillAiEditorService } from './skill-ai-editor/skill-ai-editor.service';
import { AgentAiEditorService } from './agent-ai-editor/agent-ai-editor.service';
import { ProjectConnectorsService } from './connectors/project-connectors.service';
import { AuthModule } from '../../core/auth/auth.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { AiProvidersModule } from './ai-providers/ai-providers.module';
import { ChannelsModule } from './channels/channels.module';

@Module({
  imports: [
    AuthModule,
    WorkspaceModule,
    forwardRef(() => AiProvidersModule),
    forwardRef(() => ChannelsModule),
  ],
  controllers: [
    ProjectsController,
    ProjectConnectorsCatalogController,
    ProjectConnectorsController,
    ConnectorOAuthController,
    ProjectSkillsController,
    AgentController,
    AgentApiKeysController,
    CollaborationController,
    SkillAiEditorController,
    AgentAiEditorController,
  ],
  providers: [
    ProjectsService,
    ProjectConnectorsService,
    ProjectSkillsService,
    SkillStoreService,
    AgentService,
    AgentApiKeysService,
    CollaborationService,
    SkillAiEditorService,
    AgentAiEditorService,
  ],
  exports: [
    ProjectsService,
    WorkspaceModule,
    AiProvidersModule,
    ChannelsModule,
    ProjectConnectorsService,
    ProjectSkillsService,
    AgentService,
    CollaborationService,
  ],
})
export class ProjectsModule {}
