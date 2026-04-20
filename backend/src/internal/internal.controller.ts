import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';
import { WorkerSecretGuard } from './guards/worker-secret.guard';
import { UpdateStatusDto } from './dtos/update-status.dto';
import { UpdateHeartbeatDto } from './dtos/update-heartbeat.dto';

@Controller('api/internal')
@UseGuards(WorkerSecretGuard)
export class InternalController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('status')
  @HttpCode(200)
  async updateStatus(@Body() dto: UpdateStatusDto) {
    const project = await this.projectsService.updateProjectStatus(
      dto.projectId,
      dto.status,
      dto.containerId,
    );
    return {
      projectId: project.id,
      status: project.status,
    };
  }

  @Post('heartbeat')
  @HttpCode(200)
  async updateHeartbeat(@Body() dto: UpdateHeartbeatDto) {
    const project = await this.projectsService.updateLastActiveAt(
      dto.projectId,
      new Date(dto.lastActiveAt),
    );
    return {
      projectId: project.id,
      lastActiveAt: project.lastActiveAt,
    };
  }
}
