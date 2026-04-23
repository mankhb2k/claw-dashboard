import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

@Injectable()
export class WorkerSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException(
        'Invalid Authorization header format. Expected: Bearer {secret}'
      );
    }

    const providedSecret = parts[1];
    const expectedSecret = process.env.VPS_WORKER_SECRET;

    if (!expectedSecret) {
      throw new Error('VPS_WORKER_SECRET environment variable not configured');
    }

    if (providedSecret !== expectedSecret) {
      throw new ForbiddenException('Invalid worker secret');
    }

    return true;
  }
}
