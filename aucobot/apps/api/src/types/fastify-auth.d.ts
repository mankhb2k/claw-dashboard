import type { JwtAccessPayload } from '@aucobot/control-plane-core';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtAccessPayload;
  }
}
