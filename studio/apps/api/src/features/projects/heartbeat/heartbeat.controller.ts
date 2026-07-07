import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  UpdateAgentHeartbeatDto,
  UpdateProjectHeartbeatDto,
} from './dto/heartbeat.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../../core/common/decorators/current-user.decorator';
import { ProjectsService } from '../services/projects/projects.service';
import { HeartbeatService } from './services/heartbeat/heartbeat.service';

@ApiTags('heartbeat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class HeartbeatController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly heartbeat: HeartbeatService,
  ) {}

  @Get(':id/heartbeat')
  async getProject(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.heartbeat.getProjectHeartbeat(id);
  }

  @Patch(':id/heartbeat')
  async updateProject(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectHeartbeatDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.heartbeat.updateProjectHeartbeat(id, dto);
  }

  @Get(':id/agents/:slug/heartbeat')
  async getAgent(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.heartbeat.getAgentHeartbeat(id, slug);
  }

  @Patch(':id/agents/:slug/heartbeat')
  async updateAgent(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
    @Body() dto: UpdateAgentHeartbeatDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.heartbeat.updateAgentHeartbeat(id, slug, dto);
  }
}
