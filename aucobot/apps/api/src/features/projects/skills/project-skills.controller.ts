import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayloadUser } from '../../../core/common/decorators/current-user.decorator';
import {
  CreateSkillDto,
  SetSkillEnabledDto,
  UpdateSkillDto,
} from './dto/skill.dto';
import { InstallSkillFromStoreDto, SkillStoreSearchQueryDto } from './dto/skill-store.dto';
import { ProjectsService } from '../projects.service';
import { ProjectSkillsService } from './project-skills.service';
import { SkillStoreService } from './skill-store.service';

@ApiTags('projects-skills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectSkillsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly skills: ProjectSkillsService,
    private readonly store: SkillStoreService,
  ) {}

  @Get(':id/skills')
  async list(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.skills.list(id);
  }

  @Post(':id/skills')
  async create(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: CreateSkillDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.skills.create({
      projectId: id,
      slug: dto.slug,
      name: dto.name,
      description: dto.description,
      heading: dto.heading,
      bodyMarkdown: dto.bodyMarkdown,
      enabled: dto.enabled,
    });
  }

  @Post(':id/skills/sync-all')
  async syncAll(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.skills.syncAllEnabled(id);
  }

  @Get(':id/skills/store/search')
  async searchStore(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Query() query: SkillStoreSearchQueryDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return {
      items: await this.store.search(id, query.q),
    };
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

  @Get(':id/skills/:slug')
  async get(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.skills.get(id, slug);
  }

  @Put(':id/skills/:slug')
  async update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
    @Body() dto: UpdateSkillDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.skills.update(id, slug, {
      name: dto.name,
      description: dto.description,
      heading: dto.heading,
      bodyMarkdown: dto.bodyMarkdown,
      enabled: dto.enabled,
    });
  }

  @Patch(':id/skills/:slug/enabled')
  async setEnabled(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
    @Body() dto: SetSkillEnabledDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.skills.setEnabled(id, slug, dto.enabled);
  }

  @Delete(':id/skills/:slug')
  async remove(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    await this.skills.delete(id, slug);
    return { ok: true };
  }
}
