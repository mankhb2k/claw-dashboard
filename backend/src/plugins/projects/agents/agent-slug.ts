import { BadRequestException } from '@nestjs/common';

const AGENT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;
const RESERVED_SLUGS = new Set(['main']);

export function validateAgentSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  if (!AGENT_SLUG_PATTERN.test(normalized)) {
    throw new BadRequestException(
      'slug must be lowercase hyphen-case (a-z, 0-9, hyphen), 2–64 chars',
    );
  }
  if (RESERVED_SLUGS.has(normalized)) {
    throw new BadRequestException('slug "main" is reserved for the system default agent');
  }
  return normalized;
}

export function slugifyAgentName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const seed = base.length >= 2 ? base : 'agent';
  const suffix = Date.now().toString(36).slice(-4);
  return validateAgentSlug(`${seed}-${suffix}`);
}
