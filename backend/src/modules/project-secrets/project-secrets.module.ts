import { Module } from '@nestjs/common';
import { ProjectSecretsController } from './project-secrets.controller';
import { ProjectSecretsService } from './project-secrets.service';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [ProjectSecretsController],
  providers: [ProjectSecretsService],
})
export class ProjectSecretsModule {}
