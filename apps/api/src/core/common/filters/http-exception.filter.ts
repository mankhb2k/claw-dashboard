import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // WebSocket upgrade routes (e.g. chat proxy) — no Fastify reply.status()
    if (host.getType() !== 'http') {
      this.logger.warn(
        exception instanceof Error ? exception.message : 'Non-HTTP exception',
      );
      return;
    }

    const ctx = host.switchToHttp();
    const res = ctx.getResponse<FastifyReply>();
    if (typeof res.status !== 'function') {
      this.logger.error(exception);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'object' && body !== null && 'message' in body
          ? String((body as { message: string | string[] }).message)
          : exception.message;

      res.status(status).send({
        success: false,
        data: null,
        error: {
          code: `http_${status}`,
          message: Array.isArray(message) ? message.join(', ') : message,
        },
      });
      return;
    }

    this.logger.error(exception);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      success: false,
      data: null,
      error: {
        code: 'internal_error',
        message: 'Internal server error',
      },
    });
  }
}
