import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AUTH_COOKIES } from '../auth.constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('Missing access token');
    try {
      req.user = this.jwt.verify<{ sub: string; email: string }>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(req: {
    headers?: { authorization?: string };
    cookies?: Record<string, string | undefined>;
  }): string | undefined {
    const header = req.headers?.authorization;
    if (header?.startsWith('Bearer ')) {
      return header.slice(7);
    }
    const cookies = req.cookies;
    if (cookies && typeof cookies === 'object') {
      return cookies[AUTH_COOKIES.ACCESS];
    }
    return undefined;
  }
}
