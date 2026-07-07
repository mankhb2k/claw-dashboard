import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

import { type ApiResponse } from '@claw-dashboard/shared';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _ctx: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse> {
    return next.handle().pipe(
      map((data: unknown): ApiResponse => {
        if (
          data !== null &&
          typeof data === 'object' &&
          'success' in data &&
          typeof (data as ApiResponse).success === 'boolean'
        ) {
          return data as ApiResponse;
        }
        return { success: true, data: data ?? null, error: null };
      }),
    );
  }
}
