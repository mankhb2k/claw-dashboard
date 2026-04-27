import { Controller, Post, Body, UseGuards, HttpCode, Put, Param } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';
import { IdleDetectionService } from '../scheduler/idle-detection.service';
import { HeavyJobsService } from '../heavy-jobs/heavy-jobs.service';
import { WorkerSecretGuard } from './guards/worker-secret.guard';
import { UpdateStatusDto } from './dtos/update-status.dto';
import { UpdateHeartbeatDto } from './dtos/update-heartbeat.dto';

@Controller('api/internal')
@UseGuards(WorkerSecretGuard)
export class WorkerCallbacksController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly idleDetectionService: IdleDetectionService,
    private readonly heavyJobsService: HeavyJobsService,
  ) {}

  @Post('status')
  @HttpCode(200)
  async updateStatus(@Body() dto: UpdateStatusDto) {
    const project = await this.projectsService.updateProjectStatus(
      dto.projectId,
      dto.status,
      dto.containerId,
      dto.errorMessage,
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

  @Post('trigger-idle-detection')
  @HttpCode(200)
  async triggerIdleDetection() {
    await this.idleDetectionService.triggerManual();
    return { success: true, message: 'Idle detection triggered' };
  }

  @Put('job/:jobId/result')
  @HttpCode(200)
  async updateHeavyJobResult(
    @Param('jobId') jobId: string,
    @Body() body: {
      status: 'DONE' | 'FAILED';
      resultPath?: string;
      resultSizeMb?: number;
      errorMessage?: string;
    },
  ) {
    await this.heavyJobsService.updateJobResult(
      jobId,
      body.status,
      body.resultPath,
      body.resultSizeMb,
      body.errorMessage,
    );
    return { ok: true, jobId, status: body.status };
  }
}
