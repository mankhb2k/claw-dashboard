import { forwardRef, Module } from '@nestjs/common';
import { ProjectsModule } from '../projects.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ProjectSkillsController } from './project-skills.controller';
import { SkillsStoreController } from './skills-store.controller';
import { ProjectSkillsService } from './services/project-skills/project-skills.service';
import { SkillStoreService } from './services/skill-store/skill-store.service';

@Module({
  imports: [WorkspaceModule, forwardRef(() => ProjectsModule)],
  controllers: [ProjectSkillsController, SkillsStoreController],
  providers: [ProjectSkillsService, SkillStoreService],
  exports: [ProjectSkillsService],
})
export class SkillsModule {}
