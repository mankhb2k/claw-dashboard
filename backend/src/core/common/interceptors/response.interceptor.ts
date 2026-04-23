import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../types/api-response.type';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<ApiResponse> {
    return next.handle().pipe(
      map((data) => {
        // Nếu controller đã trả về đúng format {success, data, error} thì giữ nguyên
        if (data && typeof data === 'object' && 'success' in data) return data;
        return { success: true, data: data ?? null, error: null };
      }),
    );
  }
}
