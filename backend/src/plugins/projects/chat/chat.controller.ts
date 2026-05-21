import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayloadUser } from '../../../core/common/decorators/current-user.decorator';
import { ProjectsService } from '../projects.service';
import { ChatAgentsService } from './chat-agents.service';
import { sessionKeyForAgent } from './session-key.util';

@ApiTags('projects-chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ChatController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly agents: ChatAgentsService,
  ) {}

  @Get(':id/chat/status')
  async status(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    const runtime = await this.projects.getRuntimeForChat(user.sub, id);
    const agentRows = await this.agents.listAgentsForProject(id);
    const defaultAgent = agentRows.find((a) => a.isDefault) ?? agentRows[0];

    if (!runtime.ready) {
      return {
        ready: false,
        reason: runtime.reason,
        status: runtime.project.status,
        agents: agentRows,
        defaultAgentId: defaultAgent?.id ?? 'main',
        defaultSessionKey: sessionKeyForAgent(defaultAgent?.id ?? 'main'),
      };
    }

    return {
      ready: true,
      status: runtime.project.status,
      agents: agentRows,
      defaultAgentId: defaultAgent?.id ?? 'main',
      defaultSessionKey: sessionKeyForAgent(defaultAgent?.id ?? 'main'),
    };
  }
}
