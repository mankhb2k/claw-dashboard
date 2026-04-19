import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ApiResponse } from '../types/api-response.type.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Something went wrong';

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
    };
    return map[status] ?? 'UNKNOWN_ERROR';
  }
}
