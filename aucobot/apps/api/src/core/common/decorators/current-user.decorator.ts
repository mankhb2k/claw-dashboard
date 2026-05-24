import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtAccessPayload } from '@aucobot/control-plane-core';

export type JwtPayloadUser = JwtAccessPayload;

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayloadUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
