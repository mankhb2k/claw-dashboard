import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../../../core/auth/auth.module';
import { ProjectsModule } from '../projects.module';
import { AgentAiEditorController } from './agent-ai-editor.controller';
import { UsageModule } from '../usage/usage.module';
import { AgentAiEditorService } from './services/agent-ai-editor/agent-ai-editor.service';

@Module({
  imports: [AuthModule, UsageModule, forwardRef(() => ProjectsModule)],
  controllers: [AgentAiEditorController],
  providers: [AgentAiEditorService],
  exports: [AgentAiEditorService],
})
export class AgentAiEditorModule {}
