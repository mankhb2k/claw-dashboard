import { createHash, randomBytes } from 'node:crypto';

export const AGENT_API_TOKEN_PREFIX = 'sk-claw-';
/** Visible prefix in UI (matches list masking). */
export const AGENT_API_TOKEN_PREFIX_LENGTH = 18;

export function hashAgentApiToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function generateAgentApiToken(): {
  token: string;
  tokenHash: string;
  tokenPrefix: string;
} {
  const secret = randomBytes(24).toString('hex');
  const token = `${AGENT_API_TOKEN_PREFIX}${secret}`;
  return {
    token,
    tokenHash: hashAgentApiToken(token),
    tokenPrefix: token.slice(0, AGENT_API_TOKEN_PREFIX_LENGTH),
  };
}
