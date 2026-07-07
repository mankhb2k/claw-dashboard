/** Opaque refresh: raw in cookie, SHA-256 hash in DB */
import { createHash, randomBytes } from 'node:crypto';

/** Persist / lookup refresh_tokens.token_hash */
export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** New random refresh (oc_refresh cookie) */
export function generateRefreshTokenRaw(): string {
  return randomBytes(48).toString('base64url');
}
