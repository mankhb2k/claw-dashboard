/** Apply control-plane cookie specs on Fastify reply */
import {
  buildAuthCookieSpecs,
  buildClearAuthCookieSpecs,
} from '@claw-dashboard/control-plane-core';

import type { FastifyReply } from 'fastify';

/** Clear stale cookies then set oc_access + oc_refresh */
export function setAuthCookies(
  reply: FastifyReply,
  tokens: { accessToken: string; refreshToken: string },
): void {
  clearAuthCookies(reply);
  for (const spec of buildAuthCookieSpecs(tokens)) {
    reply.setCookie(spec.name, spec.value, spec.options);
  }
}

export function clearAuthCookies(reply: FastifyReply): void {
  for (const spec of buildClearAuthCookieSpecs()) {
    reply.clearCookie(spec.name, spec.options);
  }
}
