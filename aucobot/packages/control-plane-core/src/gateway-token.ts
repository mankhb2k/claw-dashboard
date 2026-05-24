import { randomBytes } from 'node:crypto';

/** Env token if set; otherwise a new random token to persist on the project row. */
export function gatewayTokenForNewProject(): string {
  const fromEnv = process.env.OPENCLAW_GATEWAY_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  return randomBytes(32).toString('base64url');
}
