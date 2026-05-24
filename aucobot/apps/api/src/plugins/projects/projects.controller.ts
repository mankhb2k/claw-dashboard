import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayloadUser } from '../../core/common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get('mine')
  listMine(@CurrentUser() user: JwtPayloadUser) {
    return this.projects.listMine(user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtPayloadUser, @Body() dto: CreateProjectDto) {
    return this.projects.create(user.sub, dto);
  }

  @Post(':id/start')
  start(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.projects.start(user.sub, id);
  }

  /** Re-spawn container when the Docker container was removed (keeps project + volume). */
  @Post(':id/respawn')
  respawn(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.projects.respawn(user.sub, id);
  }

  @Post(':id/stop')
  stop(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.projects.stop(user.sub, id);
  }

  @Get(':id/gateway-token')
  gatewayToken(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.projects.getGatewayToken(user.sub, id);
  }

  @Get(':id/health')
  health(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.projects.health(user.sub, id);
  }
}
