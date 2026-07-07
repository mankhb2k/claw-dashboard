import type { JwtAccessPayload } from '@claw-dashboard/control-plane-core';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtAccessPayload;
  }
}
