/** Envelope for REST JSON from AucoBot API (OSS + Cloud). */
export type ApiResponse<T = unknown> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
};
