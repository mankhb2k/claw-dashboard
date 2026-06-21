import type { JwtAccessPayload } from '@aucobot/control-plane-core';

/** Shape accepted by control-plane-core token extractors (Fastify + Nest). */
export type AuthRequest = {
  headers?: { authorization?: string; cookie?: string };
  cookies?: Record<string, string | undefined>;
  user?: JwtAccessPayload;
};
