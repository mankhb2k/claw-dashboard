import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  generateSessionToken,
  hashPassword,
  sessionExpiresAt,
  verifyPassword,
} from './auth.utils';
import {
  buildGoogleAuthUrl,
  exchangeCodeForTokens,
  getGoogleUserInfo,
} from './google.oauth';

const SESSION_COOKIE = 'session_token';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Email register ────────────────────────────────────────────────────────

  async register(email: string, password: string, name: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        emailVerified: false,
        accounts: {
          create: {
            accountId: email,
            providerId: 'email',
            password: hashed,
          },
        },
      },
    });

    return this.createSession(user.id);
  }

  // ── Email login ───────────────────────────────────────────────────────────

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { accounts: { where: { providerId: 'email' } } },
    });

    const account = user?.accounts[0];
    if (!user || !account?.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await verifyPassword(password, account.password);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    return this.createSession(user.id);
  }

  // ── Session ───────────────────────────────────────────────────────────────

  async logout(token: string) {
    await this.prisma.session.deleteMany({ where: { token } });
  }

  async getSession(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) await this.prisma.session.delete({ where: { token } });
      return null;
    }

    return { user: session.user, session };
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  getGoogleRedirectUrl(state: string): string {
    const redirectUri = this.googleRedirectUri();
    return buildGoogleAuthUrl(redirectUri, state);
  }

  async handleGoogleCallback(code: string) {
    const redirectUri = this.googleRedirectUri();
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    // Find existing Google account
    let user = await this.prisma.user.findFirst({
      where: {
        accounts: { some: { providerId: 'google', accountId: googleUser.sub } },
      },
    });

    if (!user) {
      // Check if email already exists (merge accounts)
      user = await this.prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (user) {
        // Link Google account to existing user
        await this.prisma.account.create({
          data: {
            userId: user.id,
            accountId: googleUser.sub,
            providerId: 'google',
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
          },
        });
      } else {
        // Create brand new user
        user = await this.prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            image: googleUser.picture,
            emailVerified: googleUser.email_verified,
            accounts: {
              create: {
                accountId: googleUser.sub,
                providerId: 'google',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
              },
            },
          },
        });
      }
    }

    return this.createSession(user.id);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async createSession(userId: string) {
    const token = generateSessionToken();
    const expiresAt = sessionExpiresAt(30);

    const session = await this.prisma.session.create({
      data: { userId, token, expiresAt },
      include: { user: true },
    });

    return { user: session.user, token, expiresAt };
  }

  private googleRedirectUri(): string {
    const base = process.env.API_URL ?? `http://localhost:3001`;
    return `${base}/api/auth/callback/google`;
  }

  static cookieName(): string {
    return SESSION_COOKIE;
  }
}
