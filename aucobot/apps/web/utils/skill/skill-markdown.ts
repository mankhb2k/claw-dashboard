import { z } from 'zod'

/** OpenClaw convention: name is lowercase letters, numbers, and hyphens (hyphen-case). */
export const SKILL_NAME_REGEX = /^[a-z0-9][a-z0-9-]{1,63}$/

export const skillDraftSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(SKILL_NAME_REGEX, {
      message: 'name_invalid_format',
    }),
  description: z.string().trim().min(1).max(500),
  heading: z.string().trim().max(120).optional(),
})

export type SkillDraft = z.infer<typeof skillDraftSchema>

/** Escape a YAML scalar when it must be wrapped in double quotes. */
export function escapeYamlDoubleQuoted(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ')
}

/** Format a single YAML scalar line for name or description. */
export function yamlScalarLine(key: string, value: string): string {
  const needsQuote =
    value.includes(':') ||
    value.includes('#') ||
    value.includes("'") ||
    value.includes('"') ||
    /^\s|\s$/.test(value) ||
    value.includes('\n') ||
    value.includes('\r')
  if (!needsQuote && !value.includes('"')) {
    return `${key}: ${value}`
  }
  return `${key}: "${escapeYamlDoubleQuoted(value.trim())}"`
}

export function humanizeSkillName(name: string): string {
  const parts = name.split('-').filter(Boolean)
  if (parts.length === 0) return name
  return parts
    .map((p, i) => {
      if (i === 0) return p.charAt(0).toUpperCase() + p.slice(1)
      return p
    })
    .join(' ')
}

/**
 * Build full SKILL.md content (YAML frontmatter + body) per OpenClaw docs.
 * Call after `skillDraftSchema.safeParse` succeeds.
 */
export function buildSkillMarkdown(
  d: SkillDraft,
  bodyMarkdown: string,
): string {
  const lines: string[] = []
  lines.push('---')
  lines.push(yamlScalarLine('name', d.name))
  lines.push(yamlScalarLine('description', d.description))
  lines.push('---')
  lines.push('')

  const h1 = (d.heading?.trim() || humanizeSkillName(d.name)).trim()
  lines.push(`# ${h1}`)
  lines.push('')

  if (bodyMarkdown.trim()) {
    lines.push(bodyMarkdown.trim())
    lines.push('')
  }

  return lines.join('\n').replace(/\n+$/, '\n')
}

/** Build _meta.json content for a skill package. */
export function buildSkillMetaJson(d: SkillDraft): string {
  return JSON.stringify({
    name: d.name,
    description: d.description,
    version: '1.0.0',
  })
}
