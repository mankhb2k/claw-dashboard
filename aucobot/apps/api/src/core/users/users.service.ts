import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { toPublicUser, type PublicUser } from '@aucobot/control-plane-core';
import { PrismaService } from '../database/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserAvatarDto } from './dto/update-user-avatar.dto';
import { UpdateUserNameDto } from './dto/update-user-name.dto';

const publicUserSelect = {
  id: true,
  login: true,
  name: true,
  avatarUrl: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicUser(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return toPublicUser(user);
  }

  async updateName(userId: string, dto: UpdateUserNameDto): Promise<PublicUser> {
    const name = dto.name.trim();
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name },
      select: publicUserSelect,
    });
    return toPublicUser(user);
  }

  async updateAvatar(userId: string, dto: UpdateUserAvatarDto): Promise<PublicUser> {
    const avatarUrl = dto.avatarUrl === null ? null : dto.avatarUrl.trim() || null;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: publicUserSelect,
    });
    return toPublicUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must differ from current password');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
