import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectEnvController } from './project-env.controller';
import { ProjectProviderKeysController } from './project-provider-keys.controller';
import { ProjectProvidersCatalogController } from './project-providers-catalog.controller';
import { ProjectSkillsController } from './skills/project-skills.controller';
import { ProjectAgentsController } from './agents/project-agents.controller';
import { SkillAssistantController } from './skill-assistant/skill-assistant.controller';
import { ProjectConnectorsCatalogController } from './connectors/project-connectors-catalog.controller';
import { ProjectConnectorsController } from './connectors/project-connectors.controller';
import { ConnectorOAuthController } from './connectors/connector-oauth.controller';
import { ProjectChannelsCatalogController } from './channels/project-channels-catalog.controller';
import { ProjectChannelsController } from './channels/project-channels.controller';
import { ProjectsService } from './projects.service';
import { ProjectWorkspaceService } from './workspace/project-workspace.service';
import { ProjectProviderKeysService } from './providers/project-provider-keys.service';
import { ProjectSkillsService } from './skills/project-skills.service';
import { ProjectAgentsService } from './agents/project-agents.service';
import { SkillAssistantService } from './skill-assistant/skill-assistant.service';
import { ProjectConnectorsService } from './connectors/project-connectors.service';
import { ProjectChannelsService } from './channels/project-channels.service';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    ProjectsController,
    ProjectEnvController,
    ProjectProviderKeysController,
    ProjectProvidersCatalogController,
    ProjectConnectorsCatalogController,
    ProjectConnectorsController,
    ConnectorOAuthController,
    ProjectChannelsCatalogController,
    ProjectChannelsController,
    ProjectSkillsController,
    ProjectAgentsController,
    SkillAssistantController,
  ],
  providers: [
    ProjectsService,
    ProjectWorkspaceService,
    ProjectProviderKeysService,
    ProjectConnectorsService,
    ProjectChannelsService,
    ProjectSkillsService,
    ProjectAgentsService,
    SkillAssistantService,
  ],
  exports: [
    ProjectsService,
    ProjectWorkspaceService,
    ProjectProviderKeysService,
    ProjectConnectorsService,
    ProjectChannelsService,
    ProjectSkillsService,
    ProjectAgentsService,
  ],
})
export class ProjectsModule {}
