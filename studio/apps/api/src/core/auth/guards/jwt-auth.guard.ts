/** Protected routes: extract token → verify → req.user */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  extractAccessTokenFromRequest,
  verifyAccessToken,
} from '@claw-dashboard/control-plane-core';

import type { AuthRequest } from '../../common/types/auth-request';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const token = extractAccessTokenFromRequest(req);
    const payload = verifyAccessToken(token);
    if (!payload) {
      throw new UnauthorizedException(
        token ? 'Invalid or expired token' : 'Missing access token',
      );
    }
    req.user = payload;
    return true;
  }
}
