import { Module, forwardRef } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { AgentsModule } from './agents/agents.module';
import { SkillAiEditorModule } from './skill-ai-editor/skill-ai-editor.module';
import { AgentAiEditorModule } from './agent-ai-editor/agent-ai-editor.module';
import { SkillsModule } from './skills/skills.module';
import { ProjectsService } from './services/projects/projects.service';
import { AuthModule } from '../../core/auth/auth.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { AiProvidersModule } from './ai-providers/ai-providers.module';
import { ChannelsModule } from './channels/channels.module';
import { ConnectorsModule } from './connectors/connectors.module';

@Module({
  imports: [
    AuthModule,
    WorkspaceModule,
    forwardRef(() => AiProvidersModule),
    forwardRef(() => ChannelsModule),
    forwardRef(() => ConnectorsModule),
    forwardRef(() => AgentAiEditorModule),
    forwardRef(() => SkillAiEditorModule),
    forwardRef(() => AgentsModule),
    forwardRef(() => SkillsModule),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [
    ProjectsService,
    WorkspaceModule,
    AiProvidersModule,
    ChannelsModule,
    ConnectorsModule,
    SkillsModule,
    AgentsModule,
  ],
})
export class ProjectsModule {}
