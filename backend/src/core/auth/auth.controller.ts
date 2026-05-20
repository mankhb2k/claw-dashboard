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
import { AUTH_COOKIES } from './auth.constants';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const tokens = await this.auth.register(dto);
    setAuthCookies(reply, tokens);
    return { user: tokens.user };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) reply: FastifyReply) {
    const tokens = await this.auth.login(dto);
    setAuthCookies(reply, tokens);
    return { user: tokens.user };
  }

  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const raw =
      dto.refreshToken?.trim() ||
      (req.cookies as Record<string, string | undefined> | undefined)?.[AUTH_COOKIES.REFRESH];
    const tokens = await this.auth.refresh(raw);
    setAuthCookies(reply, tokens);
    return { user: tokens.user };
  }

  @Post('logout')
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const raw = (req.cookies as Record<string, string | undefined> | undefined)?.[
      AUTH_COOKIES.REFRESH
    ];
    await this.auth.logout(raw);
    clearAuthCookies(reply);
    return { ok: true };
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  async session(@CurrentUser() user: JwtPayloadUser) {
    const u = await this.auth.me(user.sub);
    return { user: u };
  }
}
