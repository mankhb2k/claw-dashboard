import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../core/common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  create(@CurrentUser() u: JwtPayloadUser, @Body() dto: CreateProjectDto) {
    return this.projects.create(u.sub, dto);
  }

  @Get()
  list(@CurrentUser() u: JwtPayloadUser) {
    return this.projects.findAllForUser(u.sub);
  }

  @Get(':projectId')
  getOne(@CurrentUser() u: JwtPayloadUser, @Param('projectId') projectId: string) {
    return this.projects.findOne(projectId, u.sub);
  }

  @Patch(':projectId')
  patch(
    @CurrentUser() u: JwtPayloadUser,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(projectId, u.sub, dto);
  }

  @Delete(':projectId')
  remove(@CurrentUser() u: JwtPayloadUser, @Param('projectId') projectId: string) {
    return this.projects.remove(projectId, u.sub);
  }
}
