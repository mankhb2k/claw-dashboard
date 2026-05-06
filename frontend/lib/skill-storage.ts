import { type SkillDraft } from './skill-markdown'

export interface SkillLocal extends SkillDraft {
  slug: string
  createdAt: number
  updatedAt: number
  bodyMarkdown: string
}

const STORAGE_KEY = 'openclaw_local_skills'

export const MOCK_SKILL: SkillLocal = {
  slug: 'trello',
  name: 'trello',
  description: 'Create and manage tasks in Trello directly from OpenClaw.',
  heading: 'Trello API Integration',
  createdAt: Date.now() - 100000,
  updatedAt: Date.now() - 100000,
  bodyMarkdown: `
This is a mock Trello integration skill.

## 🚀 How to Use
1. Set the \`TRELLO_API_KEY\` and \`TRELLO_API_TOKEN\` environment variables.
2. The agent will automatically select this skill when tasks relate to Trello.

## 🎯 Supported Operations
- List Boards
- Create Card
- Move Card
`
}

export function getLocalSkills(): SkillLocal[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // Seed with mock data
      localStorage.setItem(STORAGE_KEY, JSON.stringify([MOCK_SKILL]))
      return [MOCK_SKILL]
    }
    return JSON.parse(raw) as SkillLocal[]
  } catch (e) {
    console.error('Failed to parse local skills', e)
    return []
  }
}

export function getLocalSkill(slug: string): SkillLocal | undefined {
  const skills = getLocalSkills()
  return skills.find(s => s.slug === slug)
}

export function saveLocalSkill(skill: SkillLocal): void {
  if (typeof window === 'undefined') return
  const skills = getLocalSkills()
  const existingIndex = skills.findIndex(s => s.slug === skill.slug)
  
  if (existingIndex >= 0) {
    skills[existingIndex] = skill
  } else {
    skills.push(skill)
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(skills))
}

export function deleteLocalSkill(slug: string): void {
  if (typeof window === 'undefined') return
  const skills = getLocalSkills()
  const newSkills = skills.filter(s => s.slug !== slug)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newSkills))
}
