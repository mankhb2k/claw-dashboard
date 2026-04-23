export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T = null> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data, error: null };
}

export function fail(code: string, message: string): ApiResponse<null> {
  return { success: false, data: null, error: { code, message } };
}
