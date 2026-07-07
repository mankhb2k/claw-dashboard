import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UpdateProjectExecPolicyDto } from './dto/exec-policy.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../../core/common/decorators/current-user.decorator';
import { ProjectsService } from '../services/projects/projects.service';
import { ExecPolicyService } from './services/exec-policy/exec-policy.service';

@ApiTags('exec-policy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ExecPolicyController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly execPolicy: ExecPolicyService,
  ) {}

  @Get(':id/exec-policy')
  async getProject(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    await this.execPolicy.maybeMigrateExecPolicyFromLegacy(id);
    return this.execPolicy.getProjectExecPolicy(id);
  }

  @Patch(':id/exec-policy')
  async updateProject(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectExecPolicyDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.execPolicy.updateProjectExecPolicy(id, dto);
  }
}
