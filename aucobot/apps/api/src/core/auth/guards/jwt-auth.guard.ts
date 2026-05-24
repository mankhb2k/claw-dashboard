import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  extractAccessTokenFromRequest,
  verifyAccessToken,
} from '@aucobot/control-plane-core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
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
