import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  CreateAgentDto,
  DuplicateAgentDto,
  SetAgentEnabledDto,
  UpdateAgentDto,
} from './dto/agent.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../../core/common/decorators/current-user.decorator';
import { ProjectsService } from '../services/projects/projects.service';
import { AgentService } from './services/agent/agent.service';

@ApiTags('agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class AgentController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly agents: AgentService,
  ) {}

  @Get(':id/agents/templates')
  async listTemplates(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.agents.listTemplates();
  }

  @Get(':id/agents/templates/:slug')
  async getTemplate(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.agents.getTemplate(slug);
  }

  @Get(':id/agents')
  async list(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.agents.list(id);
  }

  @Post(':id/agents')
  async create(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: CreateAgentDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.agents.create({
      projectId: id,
      slug: dto.slug,
      formData: dto.formData,
      enabled: dto.enabled,
      isDefault: dto.isDefault,
    });
  }

  @Post(':id/agents/sync-all')
  async syncAll(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.agents.syncAllEnabled(id);
  }

  @Get(':id/agents/:slug')
  async get(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.agents.get(id, slug);
  }

  @Put(':id/agents/:slug')
  async update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
    @Body() dto: UpdateAgentDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.agents.update(id, slug, {
      formData: dto.formData,
      enabled: dto.enabled,
      isDefault: dto.isDefault,
    });
  }

  @Patch(':id/agents/:slug/enabled')
  async setEnabled(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
    @Body() dto: SetAgentEnabledDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.agents.setEnabled(id, slug, dto.enabled);
  }

  @Patch(':id/agents/:slug/default')
  async setDefault(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.agents.setDefault(id, slug);
  }

  @Post(':id/agents/:slug/duplicate')
  async duplicate(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
    @Body() dto: DuplicateAgentDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.agents.duplicate(id, slug, dto);
  }

  @Delete(':id/agents/:slug')
  async remove(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    await this.agents.remove(id, slug);
    return { ok: true };
  }
}
