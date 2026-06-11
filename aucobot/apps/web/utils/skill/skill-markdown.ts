import { z } from 'zod'

/** Chuẩn OpenClaw: name chỉ chữ thường, số, gạch ngang (hyphen-case). */
export const SKILL_NAME_REGEX = /^[a-z0-9][a-z0-9-]{1,63}$/

export const skillDraftSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(SKILL_NAME_REGEX, {
      message:
        'name_invalid_format',
    }),
  description: z.string().trim().min(1).max(500),
  heading: z.string().trim().max(120).optional(),
})

export type SkillDraft = z.infer<typeof skillDraftSchema>

/** Escape scalar YAML khi cần bọc trong ngoặc kép. */
export function escapeYamlDoubleQuoted(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ')
}

/** Quyết định format một dòng YAML scalar cho name hoặc description. */
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
 * Sinh nội dung SKILL.md đầy đủ (YAML frontmatter + body) theo docs OpenClaw.
 * Gọi sau khi `skillDraftSchema.safeParse` thành công.
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

/**
 * Sinh nội dung _meta.json cho Skill package.
 */
export function buildSkillMetaJson(d: SkillDraft): string {
  return JSON.stringify({
    name: d.name,
    description: d.description,
    version: '1.0.0'
  }, null, 2)
}
