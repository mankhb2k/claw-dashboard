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

import { RenameNodeDto, CreateNodeInviteDto } from './dto/nodes.dto';
import { NodeInvitesService } from './services/node-invites/node-invites.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../../core/common/decorators/current-user.decorator';
import { ProjectsService } from '../services/projects/projects.service';
import { NodesService } from './services/nodes/nodes.service';

@ApiTags('nodes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class NodesController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly nodes: NodesService,
    private readonly invites: NodeInvitesService,
  ) {}

  @Get(':id/nodes/pairing')
  async pairing(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.nodes.getPairing(user.sub, id);
  }

  @Get(':id/nodes')
  async list(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.nodes.list(user.sub, id);
  }

  @Post(':id/nodes/devices/:requestId/approve')
  async approveDevice(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('requestId') requestId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.nodes.approveDevicePairing(user.sub, id, requestId);
  }

  @Post(':id/nodes/devices/:requestId/reject')
  async rejectDevice(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('requestId') requestId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.nodes.rejectDevicePairing(user.sub, id, requestId);
  }

  @Post(':id/nodes/pairing/:requestId/approve')
  async approveNode(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('requestId') requestId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.nodes.approveNodePairing(user.sub, id, requestId);
  }

  @Post(':id/nodes/pairing/:requestId/reject')
  async rejectNode(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('requestId') requestId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.nodes.rejectNodePairing(user.sub, id, requestId);
  }

  @Patch(':id/nodes/:nodeId')
  async rename(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('nodeId') nodeId: string,
    @Body() dto: RenameNodeDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.nodes.renameNode(user.sub, id, nodeId, dto.displayName);
  }

  @Delete(':id/nodes/:nodeId')
  async remove(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('nodeId') nodeId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.nodes.removeNode(user.sub, id, nodeId);
  }

  @Post(':id/nodes/invites')
  async createInvite(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: CreateNodeInviteDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.invites.createInvite(user.sub, id, dto);
  }

  @Get(':id/nodes/invites')
  async listInvites(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.invites.listInvites(user.sub, id);
  }

  @Delete(':id/nodes/invites/:inviteId')
  async revokeInvite(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('inviteId') inviteId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    await this.invites.revokeInvite(user.sub, id, inviteId);
    return { ok: true };
  }
}
