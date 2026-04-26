import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../../core/common/decorators/current-user.decorator';
import { SessionGuard } from '../../core/auth/guards/session.guard';
import { ProjectsService } from './projects.service';
import { ok } from '../../core/common/types/api-response.type';
import { StartProjectDto } from './dto/start-project.dto';
import { StopProjectDto } from './dto/stop-project.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('Projects')
@ApiCookieAuth('better-auth.session_token')
@Controller('api/projects')
@UseGuards(SessionGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // GET /api/projects/mine
  @Get('mine')
  @ApiOperation({ summary: 'List all projects owned by the current user' })
  @ApiResponse({ status: 200, description: 'Array of projects with plan info' })
  async mine(@CurrentUser() user: RequestUser) {
    const projects = await this.projectsService.findByUser(user.id);
    return ok(projects);
  }

  // POST /api/projects
  @Post()
  @ApiOperation({ summary: 'Create a new project (free plan: max 1)' })
  @ApiResponse({ status: 201, description: 'Project created with status CREATING' })
  @ApiResponse({ status: 403, description: 'Plan limit reached' })
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateProjectDto) {
    const project = await this.projectsService.create(user.id, dto.displayName);
    return ok(project);
  }

  // PATCH /api/projects/:id
  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update project displayName (subdomain is immutable)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: RequestUser,
  ) {
    const project = await this.projectsService.updateDisplayName(id, user.id, dto.displayName);
    return ok(project);
  }

  // POST /api/projects/:id/start
  @Post(':id/start')
  @HttpCode(200)
  @ApiOperation({ summary: 'Wake/start a stopped project container' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Status set to STARTING, ContainerInstance created' })
  @ApiResponse({ status: 400, description: 'Project not in stoppable state' })
  async start(@Param('id') id: string, @Body() _dto: StartProjectDto, @CurrentUser() user: RequestUser) {
    const result = await this.projectsService.start(id, user.id);
    return ok(result);
  }

  // POST /api/projects/:id/stop
  @Post(':id/stop')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stop a running project container' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Status set to STOPPED' })
  async stop(@Param('id') id: string, @Body() _dto: StopProjectDto, @CurrentUser() user: RequestUser) {
    const result = await this.projectsService.stop(id, user.id);
    return ok(result);
  }

  // GET /api/projects/:id/health
  @Get(':id/health')
  @ApiOperation({ summary: 'Get project status, subdomain, storage info' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'status, subdomain, lastActiveAt, storageUsedMb' })
  async health(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const result = await this.projectsService.getHealth(id, user.id);
    return ok(result);
  }

  // GET /api/projects/:id/instances
  @Get(':id/instances')
  @ApiOperation({ summary: 'Get last 20 ContainerInstance records for a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Array of ContainerInstance (newest first)' })
  async instances(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const instances = await this.projectsService.getInstances(id, user.id);
    return ok(instances);
  }

  // DELETE /api/projects/:id
  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a project (must be STOPPED first)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete while RUNNING' })
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const result = await this.projectsService.remove(id, user.id);
    return ok(result);
  }
}
