import { Injectable, NestMiddleware, ServiceUnavailableException } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DbHealthMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: FastifyRequest, _res: FastifyReply, next: () => void) {
    if (req.url?.startsWith('/api/health')) {
      return next();
    }
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }
    next();
  }
}
