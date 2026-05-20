import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { toPublicUser, normalizeLogin, type PublicUser } from './auth-user.util';

const REFRESH_DAYS = () => Number(process.env.JWT_REFRESH_DAYS ?? 7);

export type AuthTokensResult = {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

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
    const tokenHash = createHash('sha256').update(refreshTokenRaw).digest('hex');
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
    const tokenHash = createHash('sha256').update(refreshTokenRaw).digest('hex');
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  private async issueTokens(userId: string, login: string): Promise<AuthTokensResult> {
    const accessToken = this.jwt.sign({ sub: userId, login });
    const rawRefresh = randomBytes(48).toString('base64url');
    const tokenHash = createHash('sha256').update(rawRefresh).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_DAYS() * 864e5);

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
