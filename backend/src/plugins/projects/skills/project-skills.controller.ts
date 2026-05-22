import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayloadUser } from '../../../core/common/decorators/current-user.decorator';
import {
  CreateProjectSkillDto,
  SetProjectSkillEnabledDto,
  UpdateProjectSkillDto,
} from '../dto/project-skill.dto';
import { ProjectsService } from '../projects.service';
import { ProjectSkillsService } from './project-skills.service';

@ApiTags('projects-skills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectSkillsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly skills: ProjectSkillsService,
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
    @Body() dto: CreateProjectSkillDto,
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
    @Body() dto: UpdateProjectSkillDto,
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
    @Body() dto: SetProjectSkillEnabledDto,
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
