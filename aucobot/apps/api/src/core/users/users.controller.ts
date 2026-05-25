import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserAvatarDto } from './dto/update-user-avatar.dto';
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

  @Patch('me/name')
  updateName(@CurrentUser() user: JwtPayloadUser, @Body() dto: UpdateUserNameDto) {
    return this.users.updateName(user.sub, dto);
  }

  @Patch('me/avatar')
  updateAvatar(@CurrentUser() user: JwtPayloadUser, @Body() dto: UpdateUserAvatarDto) {
    return this.users.updateAvatar(user.sub, dto);
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
