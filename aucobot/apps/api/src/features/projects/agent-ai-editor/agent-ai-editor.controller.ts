import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../../core/common/decorators/current-user.decorator';
import { ProjectsService } from '../services/projects/projects.service';
import { AgentAiEditorService } from './services/agent-ai-editor/agent-ai-editor.service';
import { AgentAiCompleteDto } from './dto/agent-ai-complete.dto';

@ApiTags('agent-ai-editor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class AgentAiEditorController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly editor: AgentAiEditorService,
  ) {}

  @Post(':id/agent-ai-editor/complete')
  async complete(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: AgentAiCompleteDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.editor.complete({
      userId: user.sub,
      projectId: id,
      providerId: dto.providerId,
      model: dto.model,
      intent: dto.intent,
      messages: dto.messages,
      agentContext: dto.agentContext,
    });
  }
}
