import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { fail, ok } from '../common/types/api-response.type.js';
import { AuthService } from './auth.service.js';

interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

interface LoginDto {
  email: string;
  password: string;
}

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/register
  @Post('register')
  @ApiOperation({ summary: 'Register new account with email/password' })
  @ApiBody({ schema: { example: { email: 'user@example.com', password: 'secret123', name: 'Alice' } } })
  @ApiResponse({ status: 201, description: 'Registered — session cookie set' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) reply: FastifyReply) {
    if (!dto.email || !dto.password || !dto.name) {
      throw new BadRequestException('email, password and name are required');
    }

    const result = await this.authService.register(dto.email, dto.password, dto.name);
    this.setSessionCookie(reply, result.token, result.expiresAt);
    return ok({ user: this.sanitizeUser(result.user) });
  }

  // POST /api/auth/login
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email/password' })
  @ApiBody({ schema: { example: { email: 'user@example.com', password: 'secret123' } } })
  @ApiResponse({ status: 200, description: 'Logged in — session cookie set' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) reply: FastifyReply) {
    if (!dto.email || !dto.password) {
      throw new BadRequestException('email and password are required');
    }

    const result = await this.authService.login(dto.email, dto.password);
    this.setSessionCookie(reply, result.token, result.expiresAt);
    return ok({ user: this.sanitizeUser(result.user) });
  }

  // POST /api/auth/logout
  @Post('logout')
  @HttpCode(200)
  @ApiCookieAuth('session_token')
  @ApiOperation({ summary: 'Logout — clears session cookie' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const token = req.cookies?.[AuthService.cookieName()];
    if (token) await this.authService.logout(token);
    reply.clearCookie(AuthService.cookieName(), { path: '/' });
    return ok(null);
  }

  // GET /api/auth/session
  @Get('session')
  @ApiCookieAuth('session_token')
  @ApiOperation({ summary: 'Get current session user' })
  @ApiResponse({ status: 200, description: 'Authenticated user object' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async session(@Req() req: FastifyRequest) {
    const token = req.cookies?.[AuthService.cookieName()];
    if (!token) return fail('AUTH_UNAUTHENTICATED', 'Not authenticated');

    const data = await this.authService.getSession(token);
    if (!data) return fail('AUTH_UNAUTHENTICATED', 'Session expired');

    return ok({ user: this.sanitizeUser(data.user) });
  }

  // GET /api/auth/sign-in/google
  @Get('sign-in/google')
  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  @ApiResponse({ status: 302, description: 'Redirect to Google' })
  signInGoogle(@Res() reply: FastifyReply) {
    const state = Math.random().toString(36).slice(2);
    const url = this.authService.getGoogleRedirectUrl(state);
    reply.status(302).header('Location', url).send();
  }

  // GET /api/auth/callback/google
  @Get('callback/google')
  @ApiOperation({ summary: 'Google OAuth callback — handled automatically by Google redirect' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend dashboard or /login?error=...' })
  async googleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() reply: FastifyReply,
  ) {
    if (error || !code) {
      return reply.status(302).header('Location', `${process.env.FRONTEND_URL}/login?error=google_denied`).send();
    }

    const result = await this.authService.handleGoogleCallback(code);
    this.setSessionCookie(reply, result.token, result.expiresAt);
    reply.status(302).header('Location', `${process.env.FRONTEND_URL}/dashboard`).send();
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private setSessionCookie(reply: FastifyReply, token: string, expiresAt: Date) {
    reply.setCookie(AuthService.cookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
  }

  private sanitizeUser(user: { id: string; name: string; email: string; image?: string | null; emailVerified: boolean; createdAt: Date }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }
}
