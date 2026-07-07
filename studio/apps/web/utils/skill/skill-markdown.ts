import {
  buildSkillMarkdown as buildSkillMarkdownCore,
  SKILL_NAME_REGEX,
} from '@claw-dashboard/workspace-sync/skill-markdown'
import { z } from 'zod'

export { SKILL_NAME_REGEX }

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

export function buildSkillMarkdown(d: SkillDraft, bodyMarkdown: string): string {
  return buildSkillMarkdownCore(d, bodyMarkdown)
}

/** Build _meta.json content for a skill package. */
export function buildSkillMetaJson(d: SkillDraft): string {
  return JSON.stringify({
    name: d.name,
    description: d.description,
    version: '1.0.0',
  })
}
