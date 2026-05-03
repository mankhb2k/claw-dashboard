import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../database/prisma.service';

const RESERVED = new Set([
  'api',
  'app',
  'www',
  'static',
  'cdn',
  'mail',
  'smtp',
  'ftp',
  'admin',
  'dashboard',
  'status',
  'health',
  'internal',
  'localhost',
]);

const MAX_BASE_LEN = 40;
const SUFFIX_LEN = 6;
const MAX_RETRIES = 8;

@Injectable()
export class SlugService {
  constructor(private readonly prisma: PrismaService) {}

  /** ASCII slug: [a-z0-9-], 1–63, valid as DNS label and Docker name suffix. */
  slugifyDisplayName(raw: string): string {
    const norm = raw
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');

    const words = norm
      .replace(/[^a-z0-9\-\s]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    let s = (words.length ? words.join('-') : 'project').replace(/--+/g, '-');
    s = s.replace(/^-+|-+$/g, '');
    if (!s) s = 'project';
    s = s.slice(0, MAX_BASE_LEN);
    s = s.replace(/^-+|-+$/g, '');
    if (!s) s = 'p';

    if (s.length < 1 || s.length > 63) {
      s = 'p';
    }

    return s;
  }

  async ensureUniqueSubdomainFromDisplayName(displayName: string): Promise<string> {
    const base = this.slugifyDisplayName(displayName);
    for (let i = 0; i < MAX_RETRIES; i++) {
      const candidate = i === 0 ? base : `${base}-${nanoid(SUFFIX_LEN).toLowerCase()}`;
      if (RESERVED.has(candidate)) {
        continue;
      }
      const exists = await this.prisma.project.findUnique({ where: { subdomain: candidate } });
      if (!exists) {
        return candidate;
      }
    }
    // Last resort: fully random
    for (let j = 0; j < MAX_RETRIES; j++) {
      const fallback = `p-${nanoid(8).toLowerCase()}`;
      const exists = await this.prisma.project.findUnique({ where: { subdomain: fallback } });
      if (!exists) {
        return fallback;
      }
    }
    return `p-${Date.now().toString(36)}`;
  }
}
