import { createParamDecorator, UnauthorizedException } from '@nestjs/common';

import type { AuthRequest } from '../types/auth-request';
import type { JwtAccessPayload } from '@claw-dashboard/control-plane-core';
import type { ExecutionContext } from '@nestjs/common';

export type JwtPayloadUser = JwtAccessPayload;

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayloadUser => {
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Missing authenticated user');
    }
    return user;
  },
);
