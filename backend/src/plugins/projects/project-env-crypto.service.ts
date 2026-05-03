import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

interface EncryptedValue {
  ciphertext: string;
  iv: string;
  authTag: string;
  algo: 'aes-256-gcm';
  keyVersion: number;
}

@Injectable()
export class ProjectEnvCryptoService {
  private readonly key: Buffer;

  constructor() {
    const raw = process.env.PROJECT_ENV_MASTER_KEY?.trim();
    if (!raw) {
      throw new InternalServerErrorException('PROJECT_ENV_MASTER_KEY is not configured');
    }

    const parsed = this.parseKey(raw);
    if (parsed.length !== 32) {
      throw new InternalServerErrorException('PROJECT_ENV_MASTER_KEY must be 32 bytes');
    }
    this.key = parsed;
  }

  encrypt(value: string, aad: string): EncryptedValue {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from(aad, 'utf8'));
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algo: 'aes-256-gcm',
      keyVersion: 1,
    };
  }

  decrypt(input: { ciphertext: string; iv: string; authTag: string }, aad: string): string {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(input.iv, 'base64'),
    );
    decipher.setAAD(Buffer.from(aad, 'utf8'));
    decipher.setAuthTag(Buffer.from(input.authTag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(input.ciphertext, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }

  private parseKey(raw: string): Buffer {
    try {
      const maybeBase64 = Buffer.from(raw, 'base64');
      if (maybeBase64.length === 32) return maybeBase64;
    } catch {
      // no-op
    }

    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      return Buffer.from(raw, 'hex');
    }

    return Buffer.from(raw, 'utf8');
  }
}
