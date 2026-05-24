import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  generateRefreshTokenRaw,
  hashRefreshToken,
  normalizeLogin,
  refreshExpiresAt,
  signAccessToken,
  toPublicUser,
  type PublicUser,
} from '@aucobot/control-plane-core';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export type AuthTokensResult = {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto): Promise<AuthTokensResult> {
    const login = normalizeLogin(dto.login);
    const exists = await this.prisma.user.findUnique({ where: { login } });
    if (exists) throw new ConflictException('Login already taken');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        login,
        passwordHash,
        name: dto.name?.trim() || null,
      },
    });
    return this.issueTokens(user.id, user.login);
  }

  async login(dto: LoginDto): Promise<AuthTokensResult> {
    const login = normalizeLogin(dto.login);
    const user = await this.prisma.user.findUnique({ where: { login } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user.id, user.login);
  }

  async refresh(refreshTokenRaw: string | undefined): Promise<AuthTokensResult> {
    if (!refreshTokenRaw?.trim()) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const tokenHash = hashRefreshToken(refreshTokenRaw);
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!row || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({ where: { id: row.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    await this.prisma.refreshToken.delete({ where: { id: row.id } });
    return this.issueTokens(user.id, user.login);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, login: true, name: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException();
    return toPublicUser(user);
  }

  async logout(refreshTokenRaw: string | undefined): Promise<void> {
    if (!refreshTokenRaw?.trim()) return;
    const tokenHash = hashRefreshToken(refreshTokenRaw);
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  private async issueTokens(userId: string, login: string): Promise<AuthTokensResult> {
    const accessToken = signAccessToken(userId, login);
    const rawRefresh = generateRefreshTokenRaw();
    const tokenHash = hashRefreshToken(rawRefresh);
    const expiresAt = refreshExpiresAt();

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, login: true, name: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException('User not found');

    return {
      accessToken,
      refreshToken: rawRefresh,
      user: toPublicUser(user),
    };
  }
}
