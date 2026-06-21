import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { SetModelDto } from './dto/set-model.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../../core/common/decorators/current-user.decorator';
import { ProjectsService } from '../services/projects/projects.service';
import { ChatAgentsService } from './services/chat-agents/chat-agents.service';
import { ChatModelService } from './services/chat-model/chat-model.service';
import { sessionKeyForAgent } from '@aucobot/control-plane-core';

@ApiTags('projects-chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ChatController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly agents: ChatAgentsService,
    private readonly chatModels: ChatModelService,
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

  @Get(':id/chat/models')
  async listModels(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Query('agentId') agentId?: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.chatModels.listModels(id, agentId?.trim() || undefined);
  }

  /** @deprecated Dashboard Chat uses gateway sessions.patch for session-only overrides. */
  @Put(':id/chat/model')
  async setModel(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: SetModelDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.chatModels.setModel({
      projectId: id,
      agentId: dto.agentId.trim(),
      model: dto.model.trim(),
    });
  }
}
