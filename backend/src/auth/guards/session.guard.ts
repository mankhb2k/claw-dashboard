import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthService } from '../auth.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<FastifyRequest & { user?: unknown }>();
    const token = req.cookies?.[AuthService.cookieName()];

    if (!token) throw new UnauthorizedException('Not authenticated');

    const data = await this.authService.getSession(token);
    if (!data) throw new UnauthorizedException('Session expired');

    req.user = data.user;
    return true;
  }
}
