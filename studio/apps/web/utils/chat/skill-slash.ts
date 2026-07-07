import type { ProjectSkillListRow } from '@/schemas/project.schema'

export type InvokableSkill = Pick<
  ProjectSkillListRow,
  'slug' | 'name' | 'description'
>

export type SkillSlashState = {
  query: string
}

/** Message is in slash-command mode: `/` or `/partial-query` (no spaces yet). */
export function parseSkillSlashState(value: string): SkillSlashState | null {
  const match = value.match(/^\/([a-z0-9-]*)$/i)
  if (!match) return null
  return { query: match[1] ?? '' }
}

export type LeadingSelectedSkill = {
  command: string
  rest: string
}

/** Completed skill command at start: `/slug` or `/slug message`. */
export function parseLeadingSelectedSkill(
  value: string,
  knownSlugs: readonly string[] = [],
): LeadingSelectedSkill | null {
  if (!value.startsWith('/')) return null

  const sortedSlugs = [...knownSlugs].sort(
    (left, right) => right.length - left.length,
  )
  for (const slug of sortedSlugs) {
    const command = `/${slug}`
    if (value === command) {
      return { command, rest: '' }
    }
    if (value.startsWith(`${command} `)) {
      return { command, rest: value.slice(command.length + 1) }
    }
  }

  const match = value.match(/^(\/[a-z0-9-]+) ([\s\S]*)$/i)
  if (!match) return null
  return {
    command: match[1] ?? '',
    rest: match[2] ?? '',
  }
}

export function buildSkillSlashCommand(slug: string): string {
  return `/${slug.trim()} `
}

/** Main agent: all enabled skills. Other agents: enabled skills in allowlist (by name). */
export function resolveInvokableSkills(
  skills: ProjectSkillListRow[],
  agentId: string,
  agentSkillNames: string[] | null,
): InvokableSkill[] {
  const enabled = skills.filter((skill) => skill.enabled)
  if (agentId === 'main') {
    return enabled.map(({ slug, name, description }) => ({
      slug,
      name,
      description,
    }))
  }
  if (!agentSkillNames || agentSkillNames.length === 0) {
    return []
  }
  const allowed = new Set(agentSkillNames)
  return enabled
    .filter((skill) => allowed.has(skill.name))
    .map(({ slug, name, description }) => ({ slug, name, description }))
}

export function filterSkillsBySlashQuery(
  skills: InvokableSkill[],
  query: string,
): InvokableSkill[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return skills
  return skills.filter((skill) => {
    const slug = skill.slug.toLowerCase()
    const name = skill.name.toLowerCase()
    const description = skill.description.toLowerCase()
    return (
      slug.includes(trimmed) ||
      name.includes(trimmed) ||
      description.includes(trimmed)
    )
  })
}
