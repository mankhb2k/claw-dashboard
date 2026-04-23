import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HeavyJobsService } from './heavy-jobs.service';
import { SubmitHeavyJobDto } from './dto/submit-heavy-job.dto';
import { SessionGuard } from '../../core/auth/guards/session.guard';
import { CurrentUser } from '../../core/common/decorators/current-user.decorator';

@Controller('api/heavy')
@UseGuards(SessionGuard)
export class HeavyJobsController {
  constructor(private readonly heavyJobsService: HeavyJobsService) {}

  @Post('submit')
  @HttpCode(201)
  async submit(
    @CurrentUser() user: any,
    @Body() dto: SubmitHeavyJobDto,
  ) {
    const { projectId, tool, params } = dto;

    const result = await this.heavyJobsService.submitJob(
      user.id,
      projectId,
      tool as any,
      params,
    );

    return result;
  }

  @Get('status/:jobId')
  @HttpCode(200)
  async getStatus(
    @CurrentUser() user: any,
    @Param('jobId') jobId: string,
  ) {
    return this.heavyJobsService.getJobStatus(jobId, user.id);
  }

  @Get('results/:jobId')
  @HttpCode(200)
  async getResult(
    @CurrentUser() user: any,
    @Param('jobId') jobId: string,
  ) {
    return this.heavyJobsService.getJobResult(jobId, user.id);
  }

  @Post('cancel/:jobId')
  @HttpCode(200)
  async cancel(
    @CurrentUser() user: any,
    @Param('jobId') jobId: string,
  ) {
    return this.heavyJobsService.cancelJob(jobId, user.id);
  }

  @Get('history')
  @HttpCode(200)
  async listJobs(
    @CurrentUser() user: any,
    @Query('projectId') projectId?: string,
  ) {
    return this.heavyJobsService.listJobs(user.id, projectId);
  }
}
