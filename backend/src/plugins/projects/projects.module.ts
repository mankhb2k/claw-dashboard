import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectEnvController } from './project-env.controller';
import { ProjectProviderKeysController } from './project-provider-keys.controller';
import { ProjectProvidersCatalogController } from './project-providers-catalog.controller';
import { ProjectSkillsController } from './skills/project-skills.controller';
import { ProjectAgentsController } from './agents/project-agents.controller';
import { SkillAssistantController } from './skill-assistant/skill-assistant.controller';
import { ProjectsService } from './projects.service';
import { DockerService } from './docker/docker.service';
import { ProjectWorkspaceService } from './workspace/project-workspace.service';
import { ProjectProviderKeysService } from './providers/project-provider-keys.service';
import { ProjectSkillsService } from './skills/project-skills.service';
import { ProjectAgentsService } from './agents/project-agents.service';
import { SkillAssistantService } from './skill-assistant/skill-assistant.service';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    ProjectsController,
    ProjectEnvController,
    ProjectProviderKeysController,
    ProjectProvidersCatalogController,
    ProjectSkillsController,
    ProjectAgentsController,
    SkillAssistantController,
  ],
  providers: [
    ProjectsService,
    DockerService,
    ProjectWorkspaceService,
    ProjectProviderKeysService,
    ProjectSkillsService,
    ProjectAgentsService,
    SkillAssistantService,
  ],
  exports: [
    ProjectsService,
    ProjectWorkspaceService,
    ProjectProviderKeysService,
    ProjectSkillsService,
    ProjectAgentsService,
  ],
})
export class ProjectsModule {}
