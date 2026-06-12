import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayloadUser } from '../../../core/common/decorators/current-user.decorator';
import { ProjectsService } from '../services/projects/projects.service';
import { CollaborationService } from './services/collaboration/collaboration.service';
import { UpdateCollaborationDto } from './dto/collaboration.dto';

@ApiTags('agent-collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class CollaborationController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly collaboration: CollaborationService,
  ) {}

  @Get(':id/collaboration')
  async get(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.collaboration.get(id);
  }

  @Put(':id/collaboration')
  async update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: UpdateCollaborationDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.collaboration.update(id, {
      enabled: dto.enabled,
      memberSlugs: dto.memberSlugs,
    });
  }
}
