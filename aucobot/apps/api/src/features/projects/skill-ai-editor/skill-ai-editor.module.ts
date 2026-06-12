import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../../../core/auth/auth.module';
import { ProjectsModule } from '../projects.module';
import { UsageModule } from '../usage/usage.module';
import { SkillAiEditorController } from './skill-ai-editor.controller';
import { SkillAiEditorService } from './services/skill-ai-editor/skill-ai-editor.service';

@Module({
  imports: [AuthModule, UsageModule, forwardRef(() => ProjectsModule)],
  controllers: [SkillAiEditorController],
  providers: [SkillAiEditorService],
  exports: [SkillAiEditorService],
})
export class SkillAiEditorModule {}
