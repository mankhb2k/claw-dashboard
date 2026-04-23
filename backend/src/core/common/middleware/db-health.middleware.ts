import {
  Injectable,
  NestMiddleware,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DbHealthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DbHealthMiddleware.name);
  private lastHealthCheck = 0;
  private healthCheckInterval = 5000; // 5 seconds
  private isHealthy = true;

  constructor(private readonly prisma: PrismaService) {
    this.startPeriodicHealthCheck();
  }

  async use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    // Skip health check for health endpoints
    if (req.url === '/health' || req.url === '/') {
      return next();
    }

    // Check if database is healthy
    if (!this.isHealthy) {
      throw new ServiceUnavailableException(
        'Database service temporarily unavailable',
      );
    }

    return next();
  }

  private startPeriodicHealthCheck() {
    setInterval(async () => {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        this.isHealthy = true;
      } catch (error) {
        this.isHealthy = false;
        this.logger.error(
          `Database health check failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }, this.healthCheckInterval);
  }
}
