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
  CreateChannelDto,
  UpdateChannelDto,
  UpsertChannelSecretDto,
} from './dto/channel.dto';
import { ProjectsService } from '../projects.service';
import { ChannelsService } from './channels.service';

@ApiTags('channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ChannelsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly channels: ChannelsService,
  ) {}

  @Get(':id/channels')
  async list(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.channels.list(id);
  }

  @Post(':id/channels')
  async create(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: CreateChannelDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.channels.create(id, dto);
  }

  @Patch(':id/channels/:channelRowId')
  async update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('channelRowId') channelRowId: string,
    @Body() dto: UpdateChannelDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.channels.update(id, channelRowId, dto);
  }

  @Delete(':id/channels/:channelRowId')
  async delete(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('channelRowId') channelRowId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    await this.channels.delete(id, channelRowId);
    return { ok: true };
  }

  @Put(':id/channels/:channelRowId/secrets/:secretKey')
  async upsertSecret(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('channelRowId') channelRowId: string,
    @Param('secretKey') secretKey: string,
    @Body() dto: UpsertChannelSecretDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    await this.channels.upsertSecret(id, channelRowId, secretKey, dto.value);
    return { ok: true };
  }

  @Delete(':id/channels/:channelRowId/secrets/:secretKey')
  async deleteSecret(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('channelRowId') channelRowId: string,
    @Param('secretKey') secretKey: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    await this.channels.deleteSecret(id, channelRowId, secretKey);
    return { ok: true };
  }

  @Post(':id/channels/:channelRowId/test')
  async test(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('channelRowId') channelRowId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.channels.test(id, channelRowId);
  }
}
