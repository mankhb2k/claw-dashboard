/** /api/auth — cookies hold tokens; body returns { user } only */
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';
import { setAuthCookies, clearAuthCookies } from './auth-cookies.util';
import { extractRefreshTokenFromRequest } from '@aucobot/control-plane-core';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Create user + set cookies */
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const tokens = await this.auth.register(dto);
    setAuthCookies(reply, tokens);
    return { user: tokens.user };
  }

  /** bcrypt check + set cookies */
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) reply: FastifyReply) {
    const tokens = await this.auth.login(dto);
    setAuthCookies(reply, tokens);
    return { user: tokens.user };
  }

  /** Body or oc_refresh cookie → rotate refresh + set cookies */
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const raw =
      dto.refreshToken?.trim() || extractRefreshTokenFromRequest(req);
    const tokens = await this.auth.refresh(raw);
    setAuthCookies(reply, tokens);
    return { user: tokens.user };
  }

  /** Revoke refresh in DB + clear cookies */
  @Post('logout')
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const raw = extractRefreshTokenFromRequest(req);
    await this.auth.logout(raw);
    clearAuthCookies(reply);
    return { ok: true };
  }

  /** JwtAuthGuard + load user from DB */
  @Get('session')
  @UseGuards(JwtAuthGuard)
  async session(@CurrentUser() user: JwtPayloadUser) {
    const u = await this.auth.me(user.sub);
    return { user: u };
  }
}
