import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { FastifyRequest } from 'fastify';
import { toPublicUser, type PublicUser } from '@aucobot/control-plane-core';
import type { AvatarStorage } from '@aucobot/runtime-contracts';
import { PrismaService } from '../database/prisma.service';
import { AVATAR_STORAGE } from './avatar/avatar-storage.provider';
import { readAvatarUpload } from './avatar/avatar-upload.util';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserNameDto } from './dto/update-user-name.dto';

const publicUserSelect = {
  id: true,
  username: true,
  name: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AVATAR_STORAGE) private readonly avatarStorage: AvatarStorage,
  ) {}

  private async toPublic(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const avatarDisplayUrl = await this.avatarStorage.resolveDisplayUrl(userId);
    return toPublicUser(user, avatarDisplayUrl);
  }

  async getPublicUser(userId: string): Promise<PublicUser> {
    return this.toPublic(userId);
  }

  async updateName(userId: string, dto: UpdateUserNameDto): Promise<PublicUser> {
    const name = dto.name.trim();
    await this.prisma.user.update({
      where: { id: userId },
      data: { name },
    });
    return this.toPublic(userId);
  }

  async uploadAvatar(userId: string, req: FastifyRequest): Promise<PublicUser> {
    const file = await readAvatarUpload(req);
    try {
      await this.avatarStorage.save(userId, file);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid avatar';
      throw new BadRequestException(message);
    }
    return this.toPublic(userId);
  }

  async readAvatar(userId: string) {
    const result = await this.avatarStorage.read(userId);
    if (!result) {
      throw new NotFoundException('Avatar not found');
    }
    return result;
  }

  async deleteAvatar(userId: string): Promise<PublicUser> {
    await this.avatarStorage.delete(userId);
    return this.toPublic(userId);
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
