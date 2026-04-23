import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import type { Auth } from 'better-auth';
import { BETTER_AUTH } from '../auth.constants';
import { RequestUser } from '../../common/decorators/current-user.decorator';
import { toHeaders } from '../node-headers.util';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(BETTER_AUTH) private readonly auth: Auth) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: RequestUser }>();
    const session = await this.auth.api.getSession({
      headers: toHeaders(req.headers),
    });

    if (!session?.user) throw new UnauthorizedException('Not authenticated');

    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image ?? null,
      emailVerified: Boolean(session.user.emailVerified),
      createdAt: new Date(session.user.createdAt),
    };
    return true;
  }
}
