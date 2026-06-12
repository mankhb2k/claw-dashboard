import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayloadUser } from '../../../core/common/decorators/current-user.decorator';
import { ProjectsService } from '../services/projects/projects.service';
import { AgentApiKeysService } from './services/agent-api-keys/agent-api-keys.service';
import { CreateAgentApiKeyDto } from './dto/agent-api-key.dto';

@ApiTags('agent-api-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class AgentApiKeysController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly agentApiKeys: AgentApiKeysService,
  ) {}

  @Get(':id/agents/:slug/api-keys')
  async list(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.agentApiKeys.list(id, slug);
  }

  @Post(':id/agents/:slug/api-keys')
  async create(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
    @Body() dto: CreateAgentApiKeyDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.agentApiKeys.create(id, slug, dto.label);
  }

  @Delete(':id/agents/:slug/api-keys/:keyId')
  async revoke(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
    @Param('keyId') keyId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    await this.agentApiKeys.revoke(id, slug, keyId);
    return { ok: true };
  }
}
