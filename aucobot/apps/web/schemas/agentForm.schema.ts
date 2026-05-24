import { z } from 'zod'

export const agentVibeSchema = z.enum(['professional', 'friendly', 'strict'])

export const agentAskPolicySchema = z.enum(['always', 'on-miss', 'off'])

export const agentInstructionsModeSchema = z.enum(['simple', 'advanced'])

const instructionsFieldMax = 12_000

/** Schema form Agent — view model cho UI; compile ra bootstrap OpenClaw khi save */
export const agentFormSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Tên Agent không được để trống')
      .max(120, 'Tên Agent tối đa 120 ký tự'),
    description: z.string().max(500, 'Mô tả tối đa 500 ký tự'),
    avatar: z.string().min(1, 'Avatar không được để trống'),
    tags: z.array(z.string().min(1)).max(20, 'Tối đa 20 tag'),
    vibe: agentVibeSchema,

    instructionsMode: agentInstructionsModeSchema,
    instructionsRole: z.string().max(instructionsFieldMax),
    instructionsRules: z.string().max(instructionsFieldMax),
    instructionsConstraints: z.string().max(instructionsFieldMax),
    instructionsOutputFormat: z.string().max(instructionsFieldMax),
    instructionsAdvanced: z.string().max(instructionsFieldMax),

    toolsNotes: z.string().max(instructionsFieldMax),

    model: z.string(),
    sandboxEnabled: z.boolean(),
    askPolicy: agentAskPolicySchema,
    safeBins: z.array(z.string()),
    timeoutSec: z.number().min(5, 'Tối thiểu 5 giây').max(3600, 'Tối đa 3600 giây'),
  })
  .superRefine((data, ctx) => {
    if (data.instructionsMode === 'simple' && !data.instructionsRole.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['instructionsRole'],
        message: 'Mô tả vai trò không được để trống',
      })
    }
    if (data.instructionsMode === 'advanced' && !data.instructionsAdvanced.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['instructionsAdvanced'],
        message: 'Nội dung AGENTS.md không được để trống',
      })
    }
  })

export type AgentFormInput = z.infer<typeof agentFormSchema>
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
  instructionsRole: 'Bạn là một trợ lý AI hữu ích trong dự án này.',
  instructionsRules: 'Hỗ trợ người dùng hoàn thành công việc một cách thân thiện và chính xác.',
  instructionsConstraints: 'Không tiết lộ dữ liệu nhạy cảm. Không thực hiện hành động phá hoại.',
  instructionsOutputFormat: 'Trả lời ngắn gọn, có cấu trúc khi cần.',
}

export function buildAgentFormDefaults(
  template?: AgentTemplateDefaults | null,
  existing?: AgentFormInput | null,
): AgentFormInput {
  if (existing) {
    return existing
  }

  const modelFromTemplate =
    template?.model === 'gemini-1-5-pro'
      ? 'gemini-1-5-pro'
      : template?.model === 'gpt-4o'
        ? 'gpt-4o'
        : (template?.model ?? 'claude-3-5-sonnet')

  const useAdvancedFromTemplate = Boolean(template?.bootstrapFiles?.agents?.trim())
  const templateSlug = template?.id

  return {
    name: template?.name ?? 'Agent mới',
    description: template?.description ?? '',
    avatar: template?.avatar ?? '🤖',
    tags: templateSlug ? [templateSlug] : [],
    vibe: template?.vibe ?? 'professional',

    instructionsMode: useAdvancedFromTemplate ? 'advanced' : 'simple',
    instructionsRole: DEFAULT_SIMPLE.instructionsRole,
    instructionsRules: DEFAULT_SIMPLE.instructionsRules,
    instructionsConstraints: DEFAULT_SIMPLE.instructionsConstraints,
    instructionsOutputFormat: DEFAULT_SIMPLE.instructionsOutputFormat,
    instructionsAdvanced: template?.bootstrapFiles?.agents?.trim() ?? '',

    toolsNotes: '',

    model: modelFromTemplate,
    sandboxEnabled: template?.sandboxEnabled ?? false,
    askPolicy: 'on-miss',
    safeBins:
      templateSlug === 'coding-assistant'
        ? ['python', 'node', 'git', 'npm', 'gcc']
        : ['python', 'node', 'git'],
    timeoutSec: 60,
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
