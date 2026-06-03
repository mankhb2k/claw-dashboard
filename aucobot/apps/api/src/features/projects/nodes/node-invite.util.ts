import { createHash, randomBytes } from 'node:crypto';

export const NODE_INVITE_PREFIX = 'nd-inv-';
export const NODE_INVITE_PREFIX_LENGTH = 14;

export function hashNodeInviteCode(raw: string): string {
  return createHash('sha256').update(raw.trim()).digest('hex');
}

export function generateNodeInviteCode(): {
  code: string;
  codeHash: string;
  codePrefix: string;
} {
  const secret = randomBytes(9).toString('base64url');
  const code = `${NODE_INVITE_PREFIX}${secret}`;
  return {
    code,
    codeHash: hashNodeInviteCode(code),
    codePrefix: code.slice(0, NODE_INVITE_PREFIX_LENGTH),
  };
}

export function normalizeNodeInviteCode(raw: string): string {
  return raw.trim();
}
