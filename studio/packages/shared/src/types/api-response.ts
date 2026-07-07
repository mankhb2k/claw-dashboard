/** Envelope for REST JSON from the Claw Dashboard API. */
export type ApiResponse<T = unknown> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
};
