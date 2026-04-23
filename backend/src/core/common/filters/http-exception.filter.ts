import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ApiResponse } from '../types/api-response.type';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Something went wrong';

    // Handle database/service unavailability errors
    if (exception instanceof Error) {
      const errorMessage = exception.message || '';

      // Prisma connection errors
      if (
        errorMessage.includes('getaddrinfo ENOTFOUND') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('connect ETIMEDOUT') ||
        (exception as any).code === 'ENOTFOUND'
      ) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        code = 'DATABASE_UNAVAILABLE';
        message = 'Database service temporarily unavailable';
        this.logger.warn(`Database unavailable: ${errorMessage}`);
      }
      // Redis/Queue connection errors
      else if (
        errorMessage.includes('Redis') ||
        errorMessage.includes('REDIS') ||
        errorMessage.includes('Queue') ||
        errorMessage.toLowerCase().includes('redis')
      ) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        code = 'QUEUE_UNAVAILABLE';
        message = 'Queue service temporarily unavailable';
        this.logger.warn(`Queue unavailable: ${errorMessage}`);
      }
      // Timeout errors
      else if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('Timeout') ||
        errorMessage.includes('ETIMEDOUT')
      ) {
        status = HttpStatus.GATEWAY_TIMEOUT;
        code = 'REQUEST_TIMEOUT';
        message = 'Request timed out';
        this.logger.warn(`Request timeout: ${errorMessage}`);
      } else {
        this.logger.error(`Unhandled exception: ${errorMessage}`, exception);
      }
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        message = (r['message'] as string) ?? message;
        code = (r['code'] as string) ?? this.statusToCode(status);
      }

      code = this.statusToCode(status);
    }

    const body: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code, message },
    };

    reply.status(status).send(body);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'AUTH_UNAUTHENTICATED',
      403: 'AUTH_FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };
    return map[status] ?? 'UNKNOWN_ERROR';
  }
}
