import type { FastifyReply } from 'fastify';
import {
  buildAuthCookieSpecs,
  buildClearAuthCookieSpecs,
} from '@aucobot/control-plane-core';

export function setAuthCookies(
  reply: FastifyReply,
  tokens: { accessToken: string; refreshToken: string },
): void {
  for (const spec of buildAuthCookieSpecs(tokens)) {
    reply.setCookie(spec.name, spec.value, spec.options);
  }
}

export function clearAuthCookies(reply: FastifyReply): void {
  for (const spec of buildClearAuthCookieSpecs()) {
    reply.clearCookie(spec.name, spec.options);
  }
}
