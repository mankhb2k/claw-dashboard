import { z } from 'zod'

import { translate } from '@/lib/i18n/translate'

export const agentVibeSchema = z.enum(['professional', 'friendly', 'strict'])

export const agentInstructionsModeSchema = z.enum(['simple', 'advanced'])

const instructionsFieldMax = 12_000

const INTERPRETER_SAFE_BINS = new Set(['python', 'python3', 'node', 'nodejs', 'ruby', 'bash', 'sh', 'zsh'])

export type AgentFormTranslate = (path: string) => string

/** Agent form schema — UI view model; compiled to OpenClaw bootstrap on save */
export function createAgentFormSchema(t: AgentFormTranslate) {
  return z
    .object({
      name: z
        .string()
        .min(1, t('agent.validation.name.required'))
        .max(120, t('agent.validation.name.max')),
      description: z.string().max(500, t('agent.validation.description.max')),
      avatar: z.string().min(1, t('agent.validation.avatar.required')),
      tags: z.array(z.string().min(1)).max(20, t('agent.validation.tags.max')),
      vibe: agentVibeSchema,

      instructionsMode: agentInstructionsModeSchema,
      instructionsRole: z.string().max(instructionsFieldMax),
      instructionsRules: z.string().max(instructionsFieldMax),
      instructionsConstraints: z.string().max(instructionsFieldMax),
      instructionsOutputFormat: z.string().max(instructionsFieldMax),
      instructionsAdvanced: z.string().max(instructionsFieldMax),

      toolsNotes: z.string().max(instructionsFieldMax),

      model: z.string(),
      shellExecEnabled: z.boolean(),
      skillNames: z
        .array(z.string().min(1))
        .max(100, t('agent.validation.skillNames.max')),
    })
    .superRefine((data, ctx) => {
      if (data.instructionsMode === 'simple' && !data.instructionsRole.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['instructionsRole'],
          message: t('agent.validation.instructions.roleRequired'),
        })
      }
      if (data.instructionsMode === 'advanced' && !data.instructionsAdvanced.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['instructionsAdvanced'],
          message: t('agent.validation.instructions.agentsMdRequired'),
        })
      }
    })
}

export type AgentFormInput = z.infer<ReturnType<typeof createAgentFormSchema>>
export type AgentVibe = z.infer<typeof agentVibeSchema>
export type AgentInstructionsMode = z.infer<typeof agentInstructionsModeSchema>

export interface AgentTemplateDefaults {
  id?: string
  name?: string
  description?: string
  avatar?: string
  vibe?: AgentVibe
  bootstrapFiles?: {
    identity?: string
    soul?: string
    agents?: string
  }
  model?: string
  sandboxEnabled?: boolean
}

const DEFAULT_SIMPLE = {
  instructionsRole: 'You are a helpful AI assistant in this project.',
  instructionsRules: 'Help users complete tasks in a friendly and accurate way.',
  instructionsConstraints: 'Do not disclose sensitive data. Do not perform destructive actions.',
  instructionsOutputFormat: 'Keep answers concise and structured when needed.',
}

export function buildAgentFormDefaults(
  template?: AgentTemplateDefaults | null,
  existing?: AgentFormInput | null,
): AgentFormInput {
  if (existing) {
    return existing
  }

  const modelFromTemplate = template?.model?.trim() ?? ''

  const agentsBootstrap = template?.bootstrapFiles?.agents?.trim() ?? ''
  const useAdvancedFromTemplate =
    Boolean(agentsBootstrap) && template?.id !== 'empty'
  const templateSlug = template?.id

  return {
    name: template?.name ?? translate('agent.defaults.newAgentName'),
    description: template?.description ?? '',
    avatar: template?.avatar ?? '🤖',
    tags: templateSlug ? [templateSlug] : [],
    vibe: template?.vibe ?? 'professional',

    instructionsMode: useAdvancedFromTemplate ? 'advanced' : 'simple',
    instructionsRole: DEFAULT_SIMPLE.instructionsRole,
    instructionsRules: DEFAULT_SIMPLE.instructionsRules,
    instructionsConstraints: DEFAULT_SIMPLE.instructionsConstraints,
    instructionsOutputFormat: DEFAULT_SIMPLE.instructionsOutputFormat,
    instructionsAdvanced:
      template?.id === 'empty' ? '' : agentsBootstrap,

    toolsNotes: '',

    model: modelFromTemplate,
    shellExecEnabled: true,
    skillNames: [],
  }
}

export function agentTemplateToDefaults(template: {
  slug: string
  name: string
  description: string
  avatar: string
  vibe: AgentVibe
  defaultModel: string
  sandboxEnabled: boolean
  bootstrapFiles: { identity: string; soul: string; agents: string }
}): AgentTemplateDefaults {
  return {
    id: template.slug,
    name: template.name,
    description: template.description,
    avatar: template.avatar,
    vibe: template.vibe,
    model: template.defaultModel,
    sandboxEnabled: template.sandboxEnabled,
    bootstrapFiles: template.bootstrapFiles,
  }
}

export { INTERPRETER_SAFE_BINS }
