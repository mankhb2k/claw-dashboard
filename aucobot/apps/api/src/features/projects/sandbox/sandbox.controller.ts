import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UpdateProjectSandboxDto } from './dto/sandbox.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../../core/common/decorators/current-user.decorator';
import { ProjectsService } from '../services/projects/projects.service';
import { SandboxService } from './services/sandbox/sandbox.service';

@ApiTags('sandbox')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class SandboxController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly sandbox: SandboxService,
  ) {}

  @Get(':id/sandbox')
  async getProject(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.sandbox.getProjectSandbox(id);
  }

  @Patch(':id/sandbox')
  async updateProject(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectSandboxDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.sandbox.updateProjectSandbox(id, dto);
  }
}
