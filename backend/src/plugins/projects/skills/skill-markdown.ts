/** Build SKILL.md for OpenClaw — mirrors frontend/lib/skill-markdown.ts */

export const SKILL_NAME_REGEX = /^[a-z0-9][a-z0-9-]{1,63}$/;

export const MAX_SKILL_BODY_BYTES = 256_000;

export type SkillDraftInput = {
  name: string;
  description: string;
  heading?: string | null;
  bodyMarkdown?: string;
};

export function validateSkillSlug(slug: string): string {
  const trimmed = slug.trim();
  if (!SKILL_NAME_REGEX.test(trimmed) || trimmed.includes('/') || trimmed.includes('..')) {
    throw new Error(`Invalid skill slug: ${slug}`);
  }
  return trimmed;
}

export function validateSkillName(name: string): string {
  const trimmed = name.trim();
  if (!SKILL_NAME_REGEX.test(trimmed)) {
    throw new Error(`Invalid skill name: ${name}`);
  }
  return trimmed;
}

function escapeYamlDoubleQuoted(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ');
}

function yamlScalarLine(key: string, value: string): string {
  const needsQuote =
    value.includes(':') ||
    value.includes('#') ||
    value.includes("'") ||
    value.includes('"') ||
    /^\s|\s$/.test(value) ||
    value.includes('\n') ||
    value.includes('\r');
  if (!needsQuote && !value.includes('"')) {
    return `${key}: ${value}`;
  }
  return `${key}: "${escapeYamlDoubleQuoted(value.trim())}"`;
}

function humanizeSkillName(name: string): string {
  const parts = name.split('-').filter(Boolean);
  if (parts.length === 0) return name;
  return parts
    .map((p, i) => (i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(' ');
}

export function buildSkillMarkdown(d: SkillDraftInput, bodyMarkdown: string): string {
  const lines: string[] = [];
  lines.push('---');
  lines.push(yamlScalarLine('name', d.name));
  lines.push(yamlScalarLine('description', d.description));
  lines.push('---');
  lines.push('');

  const h1 = (d.heading?.trim() || humanizeSkillName(d.name)).trim();
  lines.push(`# ${h1}`);
  lines.push('');

  if (bodyMarkdown.trim()) {
    lines.push(bodyMarkdown.trim());
    lines.push('');
  }

  return lines.join('\n').replace(/\n+$/, '\n');
}
