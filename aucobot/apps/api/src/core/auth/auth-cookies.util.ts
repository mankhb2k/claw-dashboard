/** Apply control-plane cookie specs on Fastify reply */
import type { FastifyReply } from 'fastify';
import {
  buildAuthCookieSpecs,
  buildClearAuthCookieSpecs,
} from '@aucobot/control-plane-core';

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
