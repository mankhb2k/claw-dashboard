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
  CreateProjectConnectorDto,
  UpdateProjectConnectorDto,
  UpsertConnectorSecretDto,
} from '../dto/project-connector.dto';
import { ProjectsService } from '../projects.service';
import { ProjectConnectorsService } from './project-connectors.service';

@ApiTags('projects-connectors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectConnectorsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly connectors: ProjectConnectorsService,
  ) {}

  @Get(':id/connectors')
  async list(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.connectors.list(id);
  }

  @Post(':id/connectors')
  async create(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: CreateProjectConnectorDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.connectors.create(id, dto);
  }

  @Patch(':id/connectors/:connectorId')
  async update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('connectorId') connectorId: string,
    @Body() dto: UpdateProjectConnectorDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.connectors.update(id, connectorId, dto);
  }

  @Delete(':id/connectors/:connectorId')
  async delete(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('connectorId') connectorId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    await this.connectors.delete(id, connectorId);
    return { ok: true };
  }

  @Put(':id/connectors/:connectorId/secrets/:secretKey')
  async upsertSecret(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('connectorId') connectorId: string,
    @Param('secretKey') secretKey: string,
    @Body() dto: UpsertConnectorSecretDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    await this.connectors.upsertSecret(id, connectorId, secretKey, dto.value);
    return { ok: true };
  }

  @Delete(':id/connectors/:connectorId/secrets/:secretKey')
  async deleteSecret(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('connectorId') connectorId: string,
    @Param('secretKey') secretKey: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    await this.connectors.deleteSecret(id, connectorId, secretKey);
    return { ok: true };
  }

  @Post(':id/connectors/:connectorId/test')
  async test(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('connectorId') connectorId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.connectors.test(id, connectorId);
  }

  @Get(':id/connectors/:slug/oauth/start')
  async startOAuth(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('slug') slug: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.connectors.startOAuth(user.sub, id, slug);
  }
}
