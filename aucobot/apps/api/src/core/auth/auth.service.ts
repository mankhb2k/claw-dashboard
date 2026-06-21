/** Login/register/refresh/logout + DB (users, refresh_tokens) */
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  accessMaxAgeSec,
  extractAccessTokenFromRequest,
  extractRefreshTokenFromRequest,
  generateRefreshTokenRaw,
  hashRefreshToken,
  normalizeUsername,
  refreshExpiresAt,
  signAccessToken,
  verifyAccessToken,
  type PublicUser,
} from '@aucobot/control-plane-core';

export type AuthTokensResult = {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
};

export type SessionResolveResult = {
  user: PublicUser;
  accessExpiresIn: number;
  refreshed: boolean;
  tokens?: AuthTokensResult;
};

type SessionRequest = Parameters<typeof extractAccessTokenFromRequest>[0];

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokensResult> {
    const username = normalizeUsername(dto.username);
    const exists = await this.prisma.user.findUnique({ where: { username } });
    if (exists) throw new ConflictException('Username already taken');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        username,
        passwordHash,
        name: dto.name?.trim() || null,
      },
    });
    return this.issueTokens(user.id, user.username);
  }

  async login(dto: LoginDto): Promise<AuthTokensResult> {
    const username = normalizeUsername(dto.username);
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user.id, user.username);
  }

  /** Validate refresh hash, delete old row, issue new pair (rotation) */
  async refresh(
    refreshTokenRaw: string | undefined,
  ): Promise<AuthTokensResult> {
    if (!refreshTokenRaw?.trim()) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const tokenHash = hashRefreshToken(refreshTokenRaw);
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!row || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: row.userId },
    });
    if (!user) throw new UnauthorizedException('User not found');

    await this.prisma.refreshToken.delete({ where: { id: row.id } });
    return this.issueTokens(user.id, user.username);
  }

  async me(userId: string): Promise<PublicUser> {
    return this.users.getPublicUser(userId);
  }

  /**
   * Resolve session from cookies: valid access → user; expired access + valid refresh → rotate silently.
   */
  async resolveSession(req: SessionRequest): Promise<SessionResolveResult> {
    const accessExpiresIn = accessMaxAgeSec();
    const accessPayload = verifyAccessToken(extractAccessTokenFromRequest(req));

    if (accessPayload) {
      const user = await this.me(accessPayload.sub);
      return { user, accessExpiresIn, refreshed: false };
    }

    const raw = extractRefreshTokenFromRequest(req);
    const tokens = await this.refresh(raw);
    return {
      user: tokens.user,
      accessExpiresIn,
      refreshed: true,
      tokens,
    };
  }

  async logout(refreshTokenRaw: string | undefined): Promise<void> {
    if (!refreshTokenRaw?.trim()) return;
    const tokenHash = hashRefreshToken(refreshTokenRaw);
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  /** signAccessToken + new refresh row + PublicUser */
  private async issueTokens(
    userId: string,
    username: string,
  ): Promise<AuthTokensResult> {
    const accessToken = signAccessToken(userId, username);
    const rawRefresh = generateRefreshTokenRaw();
    const tokenHash = hashRefreshToken(rawRefresh);
    const expiresAt = refreshExpiresAt();

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    const user = await this.users.getPublicUser(userId);

    return {
      accessToken,
      refreshToken: rawRefresh,
      user,
    };
  }
}
