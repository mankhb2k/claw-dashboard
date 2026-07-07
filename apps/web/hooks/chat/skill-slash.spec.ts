import { describe, expect, it } from 'vitest'

import {
  buildSkillSlashCommand,
  filterSkillsBySlashQuery,
  parseLeadingSelectedSkill,
  parseSkillSlashState,
  resolveInvokableSkills,
} from '@/utils/chat/skill-slash'

import type { ProjectSkillListRow } from '@/schemas/project.schema'

const baseSkill = (
  overrides: Partial<ProjectSkillListRow>,
): ProjectSkillListRow => ({
  slug: 'web-search',
  name: 'web-search',
  description: 'Search the web',
  heading: null,
  enabled: true,
  lastSyncedAt: null,
  lastSyncError: null,
  updatedAt: '2026-01-01',
  ...overrides,
})

describe('parseSkillSlashState', () => {
  it('detects bare slash and partial query', () => {
    expect(parseSkillSlashState('/')).toEqual({ query: '' })
    expect(parseSkillSlashState('/web')).toEqual({ query: 'web' })
  })

  it('ignores text with spaces or without leading slash', () => {
    expect(parseSkillSlashState('/web search')).toBeNull()
    expect(parseSkillSlashState('hello /web')).toBeNull()
    expect(parseSkillSlashState('web')).toBeNull()
  })
})

describe('parseLeadingSelectedSkill', () => {
  it('detects completed skill command at start', () => {
    expect(parseLeadingSelectedSkill('/skill-1 ')).toEqual({
      command: '/skill-1',
      rest: '',
    })
    expect(parseLeadingSelectedSkill('/web-search hello')).toEqual({
      command: '/web-search',
      rest: 'hello',
    })
  })

  it('matches known slug without trailing space', () => {
    expect(parseLeadingSelectedSkill('/skill-1', ['skill-1'])).toEqual({
      command: '/skill-1',
      rest: '',
    })
    expect(
      parseLeadingSelectedSkill('/skill-1 hello', ['skill-1']),
    ).toEqual({
      command: '/skill-1',
      rest: 'hello',
    })
  })

  it('ignores partial slash input without trailing space', () => {
    expect(parseLeadingSelectedSkill('/skill-1')).toBeNull()
    expect(parseLeadingSelectedSkill('hello /skill-1 ')).toBeNull()
  })
})

describe('resolveInvokableSkills', () => {
  it('returns all enabled skills for main', () => {
    const skills = [
      baseSkill({ slug: 'a', name: 'a', enabled: true }),
      baseSkill({ slug: 'b', name: 'b', enabled: false }),
    ]
    expect(resolveInvokableSkills(skills, 'main', null)).toEqual([
      { slug: 'a', name: 'a', description: 'Search the web' },
    ])
  })

  it('filters by agent allowlist for non-main agents', () => {
    const skills = [
      baseSkill({ slug: 'a', name: 'alpha', enabled: true }),
      baseSkill({ slug: 'b', name: 'beta', enabled: true }),
    ]
    expect(resolveInvokableSkills(skills, 'helper', ['beta'])).toEqual([
      { slug: 'b', name: 'beta', description: 'Search the web' },
    ])
  })
})

describe('filterSkillsBySlashQuery', () => {
  it('filters by slug, name, or description', () => {
    const skills = resolveInvokableSkills(
      [
        baseSkill({ slug: 'alpha', name: 'alpha', description: 'First' }),
        baseSkill({ slug: 'beta', name: 'beta', description: 'Second' }),
      ],
      'main',
      null,
    )
    expect(filterSkillsBySlashQuery(skills, 'bet')).toHaveLength(1)
    expect(filterSkillsBySlashQuery(skills, '')[0]?.slug).toBe('alpha')
  })
})

describe('buildSkillSlashCommand', () => {
  it('builds command with trailing space', () => {
    expect(buildSkillSlashCommand('web-search')).toBe('/web-search ')
  })
})
