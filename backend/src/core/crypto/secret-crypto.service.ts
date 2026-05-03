import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'node:crypto';

const CIPHER_VERSION = 1;
const NONCE_LENGTH = 12;
const KEY_LENGTH = 32;
const TAG_LENGTH = 16;

@Injectable()
export class SecretCryptoService implements OnModuleInit {
  private readonly logger = new Logger(SecretCryptoService.name);
  private key!: Buffer;

  onModuleInit() {
    const raw = process.env.PROJECT_SECRETS_MASTER_KEY?.trim();
    if (!raw) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('PROJECT_SECRETS_MASTER_KEY is required in production');
      }
      this.key = crypto.createHash('sha256').update('openclaw-dev-project-secrets').digest();
      this.logger.warn(
        'PROJECT_SECRETS_MASTER_KEY not set; using deterministic dev derivation (do not use in production)',
      );
      return;
    }
    this.key = this.parseKey(raw);
    if (this.key.length !== KEY_LENGTH) {
      throw new Error('Derived key must be 32 bytes for AES-256-GCM');
    }
  }

  private parseKey(raw: string): Buffer {
    if (/^[a-fA-F0-9]{64}$/.test(raw)) {
      return Buffer.from(raw, 'hex');
    }
    const decoded = Buffer.from(raw, 'base64');
    if (decoded.length === KEY_LENGTH) return decoded;
    throw new Error('PROJECT_SECRETS_MASTER_KEY must be 64 hex chars or base64-encoded 32 bytes');
  }

  encryptUtf8(plaintext: string): string {
    const nonce = crypto.randomBytes(NONCE_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, nonce, { authTagLength: TAG_LENGTH });
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const packed = Buffer.concat([Buffer.from([CIPHER_VERSION]), nonce, encrypted, tag]);
    return packed.toString('base64');
  }

  decryptUtf8(payloadEnc: string): string {
    let buf: Buffer;
    try {
      buf = Buffer.from(payloadEnc, 'base64');
    } catch {
      throw new Error('Invalid ciphertext encoding');
    }
    const minLen = 1 + NONCE_LENGTH + TAG_LENGTH + 1;
    if (buf.length < minLen) throw new Error('Invalid ciphertext');

    let offset = 0;
    const version = buf[offset++];
    if (version !== CIPHER_VERSION) {
      throw new Error(`Unsupported ciphertext version: ${version}`);
    }
    const nonce = buf.subarray(offset, offset + NONCE_LENGTH);
    offset += NONCE_LENGTH;
    const tag = buf.subarray(buf.length - TAG_LENGTH);
    const ciphertext = buf.subarray(offset, buf.length - TAG_LENGTH);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, nonce, {
      authTagLength: TAG_LENGTH,
    });
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }
}
