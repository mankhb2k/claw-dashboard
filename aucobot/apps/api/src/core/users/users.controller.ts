import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserNameDto } from './dto/update-user-name.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayloadUser) {
    return this.users.getPublicUser(user.sub);
  }

  @Get('me/avatar')
  async getAvatar(
    @CurrentUser() user: JwtPayloadUser,
    @Res({ passthrough: false }) reply: FastifyReply,
  ) {
    const { data, mimeType } = await this.users.readAvatar(user.sub);
    return reply
      .header('Content-Type', mimeType)
      .header('Cache-Control', 'private, max-age=3600')
      .send(data);
  }

  @Put('me/avatar')
  @ApiConsumes('multipart/form-data')
  uploadAvatar(@CurrentUser() user: JwtPayloadUser, @Req() req: FastifyRequest) {
    return this.users.uploadAvatar(user.sub, req);
  }

  @Delete('me/avatar')
  deleteAvatar(@CurrentUser() user: JwtPayloadUser) {
    return this.users.deleteAvatar(user.sub);
  }

  @Patch('me/name')
  updateName(@CurrentUser() user: JwtPayloadUser, @Body() dto: UpdateUserNameDto) {
    return this.users.updateName(user.sub, dto);
  }

  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.users.changePassword(user.sub, dto);
    return { ok: true };
  }
}
