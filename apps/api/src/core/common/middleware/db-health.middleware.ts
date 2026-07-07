import {
  Injectable,
  Logger,
  NestMiddleware,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DbHealthMiddleware implements NestMiddleware {
  private readonly log = new Logger(DbHealthMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: FastifyRequest, _res: FastifyReply, next: () => void) {
    if (req.url?.startsWith('/api/health')) {
      return next();
    }
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.log.error(`Database unavailable: ${detail}`);
      throw new ServiceUnavailableException(
        process.env.NODE_ENV === 'production'
          ? 'Database unavailable'
          : `Database unavailable: ${detail}`,
      );
    }
    return next();
  }
}
