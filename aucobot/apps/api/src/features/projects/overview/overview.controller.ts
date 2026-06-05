import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../../core/common/decorators/current-user.decorator';
import { ProjectsService } from '../projects.service';
import { OverviewQueryDto } from './dto/overview.dto';
import { OverviewService } from './overview.service';

@ApiTags('overview')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class OverviewController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly overview: OverviewService,
  ) {}

  @Get(':id/overview')
  async getOverview(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Query() query: OverviewQueryDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.overview.getOverview({
      userId: user.sub,
      projectId: id,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      chartPeriod: query.chartPeriod ?? 'week',
    });
  }
}
