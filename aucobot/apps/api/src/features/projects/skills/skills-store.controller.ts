import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayloadUser } from '../../../core/common/decorators/current-user.decorator';
import { ProjectsService } from '../services/projects/projects.service';
import { InstallSkillFromStoreDto, SkillStoreSearchQueryDto } from './dto/skill-store.dto';
import { SkillStoreService } from './services/skill-store/skill-store.service';

@ApiTags('projects-skills-store')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class SkillsStoreController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly store: SkillStoreService,
  ) {}

  @Get(':id/skills/store/search')
  async searchStore(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Query() query: SkillStoreSearchQueryDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.store.search(id, {
      q: query.q,
      cursor: query.cursor,
      limit: query.limit,
      sort: query.sort,
    });
  }

  @Post(':id/skills/store/install')
  async installFromStore(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: InstallSkillFromStoreDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.store.install(id, dto.slug);
  }

  @Get(':id/skills/store/:slug')
  async getStoreDetail(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.store.getDetail(id, slug);
  }
}
