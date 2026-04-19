import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const SALT_LEN = 16;
const KEY_LEN = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LEN).toString('hex');
  const key = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  const key = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
  const storedBuf = Buffer.from(hash, 'hex');
  return timingSafeEqual(key, storedBuf);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function sessionExpiresAt(days = 30): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
