import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type JwtPayloadUser = { sub: string; login: string };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayloadUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
