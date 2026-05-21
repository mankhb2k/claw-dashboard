import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectEnvController } from './project-env.controller';
import { ProjectProvidersCatalogController } from './project-providers-catalog.controller';
import { ProjectsService } from './projects.service';
import { DockerService } from './docker/docker.service';
import { ProjectWorkspaceService } from './workspace/project-workspace.service';
import { ProjectProviderKeysService } from './providers/project-provider-keys.service';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProjectsController, ProjectEnvController, ProjectProvidersCatalogController],
  providers: [
    ProjectsService,
    DockerService,
    ProjectWorkspaceService,
    ProjectProviderKeysService,
  ],
  exports: [ProjectsService, ProjectWorkspaceService, ProjectProviderKeysService],
})
export class ProjectsModule {}
