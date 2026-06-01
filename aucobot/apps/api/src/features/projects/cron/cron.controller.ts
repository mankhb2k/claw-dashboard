import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../../core/common/decorators/current-user.decorator';
import { ProjectsService } from '../projects.service';
import { CronService } from './cron.service';
import {
  CreateCronJobDto,
  ListCronQueryDto,
  UpdateCronJobDto,
} from './dto/cron.dto';

@ApiTags('cron')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class CronController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly cron: CronService,
  ) {}

  @Get(':id/cron/summary')
  async summary(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.cron.getSummary(user.sub, id);
  }

  @Get(':id/cron')
  async list(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Query() query: ListCronQueryDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.cron.list(user.sub, id, query.agentId);
  }

  @Get(':id/cron/:jobId')
  async get(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('jobId') jobId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.cron.get(user.sub, id, jobId);
  }

  @Post(':id/cron')
  async create(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: CreateCronJobDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.cron.create(user.sub, id, dto);
  }

  @Patch(':id/cron/:jobId')
  async update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('jobId') jobId: string,
    @Body() dto: UpdateCronJobDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.cron.update(user.sub, id, jobId, dto);
  }

  @Delete(':id/cron/:jobId')
  async remove(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('jobId') jobId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.cron.remove(user.sub, id, jobId);
  }

  @Post(':id/cron/:jobId/run')
  async run(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('jobId') jobId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.cron.run(user.sub, id, jobId);
  }
}
