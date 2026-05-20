import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../core/common/decorators/current-user.decorator';
import { WorkspaceService } from './workspace.service';
import { SaveWorkspaceDto } from './dto/save-workspace.dto';

@ApiTags('workspace')
@Controller('projects/:projectId/workspace')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspaceController {
  constructor(private readonly workspace: WorkspaceService) {}

  @Post()
  save(
    @CurrentUser() u: JwtPayloadUser,
    @Param('projectId') projectId: string,
    @Body() dto: SaveWorkspaceDto,
  ) {
    return this.workspace.saveRevision(u.sub, projectId, dto);
  }

  @Get('latest')
  latest(@CurrentUser() u: JwtPayloadUser, @Param('projectId') projectId: string) {
    return this.workspace.getLatest(u.sub, projectId);
  }

  @Get('revisions')
  revisions(
    @CurrentUser() u: JwtPayloadUser,
    @Param('projectId') projectId: string,
    @Query('take') take?: string,
  ) {
    return this.workspace.listRevisions(
      u.sub,
      projectId,
      take ? Math.min(100, Number(take) || 20) : 20,
    );
  }
}
