import { Module, forwardRef } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectSkillsController } from './skills/project-skills.controller';
import { ProjectAgentsController } from './agents/project-agents.controller';
import { SkillAssistantController } from './skill-assistant/skill-assistant.controller';
import { ProjectConnectorsCatalogController } from './connectors/project-connectors-catalog.controller';
import { ProjectConnectorsController } from './connectors/project-connectors.controller';
import { ConnectorOAuthController } from './connectors/connector-oauth.controller';
import { ProjectsService } from './projects.service';
import { ProjectSkillsService } from './skills/project-skills.service';
import { ProjectAgentsService } from './agents/project-agents.service';
import { SkillAssistantService } from './skill-assistant/skill-assistant.service';
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
    ProjectAgentsController,
    SkillAssistantController,
  ],
  providers: [
    ProjectsService,
    ProjectConnectorsService,
    ProjectSkillsService,
    ProjectAgentsService,
    SkillAssistantService,
  ],
  exports: [
    ProjectsService,
    WorkspaceModule,
    AiProvidersModule,
    ChannelsModule,
    ProjectConnectorsService,
    ProjectSkillsService,
    ProjectAgentsService,
  ],
})
export class ProjectsModule {}
