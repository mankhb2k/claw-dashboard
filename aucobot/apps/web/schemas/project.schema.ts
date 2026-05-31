import { z } from 'zod'

// Backend trả uppercase, normalize về lowercase cho frontend
export const projectStatusSchema = z
  .string()
  .transform((v) => v.toLowerCase())
  .pipe(z.enum(['creating', 'running', 'starting', 'stopping', 'stopped', 'error']))

export const projectSchema = z
  .object({
    id: z.string(),
    displayName: z.string(),
    subdomain: z.string(),
    publicUrl: z.string().optional(),
    status: projectStatusSchema,
    containerName: z.string().nullable().optional(),
    containerMissing: z.boolean().optional().default(false),
    errorMessage: z.string().nullable().optional(),
    lastActiveAt: z.coerce.string().nullable(),
    createdAt: z.coerce.string(),
  })
  .transform((p) => ({
    ...p,
    name: p.displayName,
    containerMissing: p.containerMissing ?? false,
  }))

export const createProjectSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Tên tối thiểu 1 ký tự')
    .max(200, 'Tên tối đa 200 ký tự'),
})

export const projectHealthSchema = z.object({
  status: projectStatusSchema,
  displayName: z.string().optional(),
  publicUrl: z.string().optional(),
  subdomain: z.string().optional(),
  lastActiveAt: z.coerce.string().nullable().optional(),
  containerMissing: z.boolean().optional(),
  errorMessage: z.string().nullable().optional(),
  storageUsedMb: z.number().optional(),
})

export type Project = z.infer<typeof projectSchema>
export type ProjectStatus = z.infer<typeof projectStatusSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type ProjectHealth = z.infer<typeof projectHealthSchema>
export const PROJECT_AGENT_ENV_KEYS = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'OPENROUTER_API_KEY',
  'GOOGLE_API_KEY',
] as const

export type ProjectAgentEnvKey = (typeof PROJECT_AGENT_ENV_KEYS)[number]

/** GET /api/projects/:id/gateway-token */
export const gatewayTokenResponseSchema = z.object({
  token: z.string().min(1),
})

export type GatewayTokenResponse = z.infer<typeof gatewayTokenResponseSchema>

/** GET /api/projects/:id/provider-keys — masked rows */
export const projectEnvMaskedRowSchema = z.object({
  key: z.string(),
  updatedAt: z.coerce.string(),
  masked: z.string(),
  providerId: z.string().optional(),
  label: z.string().optional(),
  enabled: z.boolean().optional(),
  defaultModel: z.string().nullable().optional(),
  lastTestedAt: z.string().nullable().optional(),
  lastTestOk: z.boolean().nullable().optional(),
  lastError: z.string().nullable().optional(),
})

export type ProjectEnvMaskedRow = z.infer<typeof projectEnvMaskedRowSchema>

export const providerKeyTestResultSchema = z.object({
  ok: z.boolean(),
  enabled: z.boolean().optional(),
  masked: z.string().optional(),
  error: z.string().optional(),
  model: z.string().optional(),
  message: z.string().optional(),
  providerId: z.string().optional(),
  envKey: z.string().optional(),
})

export type ProviderKeyTestResult = z.infer<typeof providerKeyTestResultSchema>

/** GET /api/projects/providers/definitions */
export const providerModelCatalogSchema = z.object({
  id: z.string(),
  name: z.string(),
  openclawId: z.string(),
  tier: z.enum(['stable', 'preview', 'deprecated']).optional(),
  description: z.string().optional(),
  recommended: z.boolean().optional(),
  isFree: z.boolean().optional(),
})

export const providerDefinitionSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  envKey: z.string(),
  openclawProviderId: z.string().optional(),
  defaultModel: z.string().optional(),
  models: z.array(providerModelCatalogSchema).optional(),
})

export type ProviderDefinition = z.infer<typeof providerDefinitionSchema>
export type ProviderModelCatalog = z.infer<typeof providerModelCatalogSchema>

export const connectorKindSchema = z.enum(['API', 'MCP', 'OAUTH'])
export const connectorStatusSchema = z
  .string()
  .transform((v) => v.toLowerCase())
  .pipe(z.enum(['disconnected', 'connected', 'error', 'needs_reauth']))

export const connectorDefinitionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  displayName: z.string(),
  description: z.string(),
  kind: connectorKindSchema,
  status: z.enum(['ACTIVE', 'DISABLED', 'DEPRECATED']),
  configSchema: z.unknown().optional().nullable(),
  createdAt: z.coerce.string().optional(),
  updatedAt: z.coerce.string().optional(),
})

export const projectConnectorSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  connectorDefinitionId: z.string(),
  connectorSlug: z.string(),
  connectorName: z.string(),
  connectorKind: connectorKindSchema,
  displayName: z.string(),
  enabled: z.boolean(),
  connectionStatus: connectorStatusSchema,
  config: z.unknown().optional().nullable(),
  lastTestedAt: z.coerce.string().nullable().optional(),
  lastError: z.string().nullable().optional(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
  secrets: z
    .array(
      z.object({
        key: z.string(),
        updatedAt: z.coerce.string(),
        masked: z.string(),
      }),
    )
    .default([]),
  definition: z
    .object({
      description: z.string(),
      status: z.enum(['ACTIVE', 'DISABLED', 'DEPRECATED']),
      configSchema: z.unknown().optional().nullable(),
    })
    .optional(),
})

/** Form draft: empty string means "do not send / leave unchanged in mock until user types" */
export const agentProviderKeysFormSchema = z.object({
  OPENAI_API_KEY: z.string().max(5000),
  ANTHROPIC_API_KEY: z.string().max(5000),
  GEMINI_API_KEY: z.string().max(5000),
  OPENROUTER_API_KEY: z.string().max(5000),
  GOOGLE_API_KEY: z.string().max(5000),
})

export type AgentProviderKeysFormInput = z.infer<typeof agentProviderKeysFormSchema>
export type ConnectorDefinition = z.infer<typeof connectorDefinitionSchema>
export type ProjectConnector = z.infer<typeof projectConnectorSchema>

export const channelKindSchema = z.enum(['BOT_TOKEN', 'OAUTH', 'WEBHOOK', 'QR_PAIRING'])
export const channelStatusSchema = z
  .string()
  .transform((v) => v.toLowerCase())
  .pipe(z.enum(['disconnected', 'configured', 'connected', 'needs_reauth', 'error']))

export const channelDefinitionSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  displayName: z.string(),
  description: z.string(),
  kind: channelKindSchema,
  status: z.enum(['ACTIVE', 'DISABLED']),
  secretKeys: z.array(z.string()).default([]),
  docsPath: z.string().nullable().optional(),
  createdAt: z.coerce.string().optional(),
  updatedAt: z.coerce.string().optional(),
})

export const projectChannelSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  channelId: z.string(),
  channelName: z.string(),
  channelKind: channelKindSchema,
  enabled: z.boolean(),
  connectionStatus: channelStatusSchema,
  config: z.unknown().optional().nullable(),
  lastTestedAt: z.coerce.string().nullable().optional(),
  lastError: z.string().nullable().optional(),
  lastSyncedAt: z.coerce.string().nullable().optional(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
  secrets: z
    .array(
      z.object({
        key: z.string(),
        updatedAt: z.coerce.string(),
        masked: z.string(),
      }),
    )
    .default([]),
  definition: z
    .object({
      description: z.string(),
      kind: channelKindSchema,
      docsPath: z.string().optional(),
    })
    .optional(),
})

export const channelTestResultSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
})

export type ChannelDefinition = z.infer<typeof channelDefinitionSchema>
export type ProjectChannel = z.infer<typeof projectChannelSchema>
export type ChannelTestResult = z.infer<typeof channelTestResultSchema>

/** GET /api/projects/:id/skills */
export const projectSkillListRowSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  heading: z.string().nullable(),
  enabled: z.boolean(),
  lastSyncedAt: z.string().nullable(),
  lastSyncError: z.string().nullable(),
  updatedAt: z.coerce.string(),
})

export const projectSkillDetailSchema = projectSkillListRowSchema.extend({
  bodyMarkdown: z.string(),
  createdAt: z.coerce.string(),
})

export const createProjectSkillSchema = z.object({
  slug: z.string().min(3).max(64),
  name: z.string().min(3).max(64),
  description: z.string().min(1).max(500),
  heading: z.string().max(120).optional(),
  bodyMarkdown: z.string().max(260_000).optional(),
  enabled: z.boolean().optional(),
})

export const updateProjectSkillSchema = z.object({
  name: z.string().min(3).max(64).optional(),
  description: z.string().min(1).max(500).optional(),
  heading: z.string().max(120).nullable().optional(),
  bodyMarkdown: z.string().max(260_000).optional(),
  enabled: z.boolean().optional(),
})

export type ProjectSkillListRow = z.infer<typeof projectSkillListRowSchema>
export type ProjectSkillDetail = z.infer<typeof projectSkillDetailSchema>
export type CreateProjectSkillInput = z.infer<typeof createProjectSkillSchema>
export type UpdateProjectSkillInput = z.infer<typeof updateProjectSkillSchema>

/** GET /api/projects/:id/skill-ai-editor/options */
export const skillAiEditorOptionModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  openclawId: z.string(),
})

export const skillAiEditorOptionProviderSchema = z.object({
  providerId: z.string(),
  displayName: z.string(),
  defaultModel: z.string().nullable(),
  models: z.array(skillAiEditorOptionModelSchema),
})

export const skillAiEditorOptionsResponseSchema = z.object({
  providers: z.array(skillAiEditorOptionProviderSchema),
})

export const skillAiEditorMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

export const skillAiEditorCompleteInputSchema = z.object({
  providerId: z.string(),
  model: z.string(),
  messages: z.array(skillAiEditorMessageSchema).min(1).max(20),
  skillContext: z.object({
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    heading: z.string().nullable().optional(),
    currentBodyMarkdown: z.string().optional(),
  }),
})

export const skillAiEditorCompleteResponseSchema = z.object({
  markdown: z.string(),
})

export type SkillAiEditorOptionsResponse = z.infer<
  typeof skillAiEditorOptionsResponseSchema
>
export type SkillAiEditorMessage = z.infer<typeof skillAiEditorMessageSchema>
export type SkillAiEditorCompleteInput = z.infer<
  typeof skillAiEditorCompleteInputSchema
>

/** GET /api/projects/:id/agents/templates */
export const agentTemplateRowSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  avatar: z.string(),
  vibe: z.enum(['professional', 'friendly', 'strict']),
  defaultModel: z.string(),
  toolsProfile: z.string(),
  sandboxEnabled: z.boolean(),
  bootstrapFiles: z.object({
    identity: z.string(),
    soul: z.string(),
    agents: z.string(),
  }),
})

/** GET /api/projects/:id/agents */
export const projectAgentListRowSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  avatar: z.string(),
  model: z.string(),
  enabled: z.boolean(),
  isDefault: z.boolean(),
  lastSyncedAt: z.string().nullable(),
  lastSyncError: z.string().nullable(),
  updatedAt: z.coerce.string(),
})

export const agentFormInputSchema = z.object({
  name: z.string(),
  description: z.string(),
  avatar: z.string(),
  tags: z.array(z.string()),
  vibe: z.enum(['professional', 'friendly', 'strict']),
  instructionsMode: z.enum(['simple', 'advanced']),
  instructionsRole: z.string(),
  instructionsRules: z.string(),
  instructionsConstraints: z.string(),
  instructionsOutputFormat: z.string(),
  instructionsAdvanced: z.string(),
  toolsNotes: z.string(),
  model: z.string(),
  sandboxEnabled: z.boolean(),
  askPolicy: z.enum(['always', 'on-miss', 'off']),
  safeBins: z.array(z.string()),
  timeoutSec: z.number(),
  teamEnabled: z.boolean(),
  allowedAgentSlugs: z.array(z.string()),
})

export const projectAgentDetailSchema = projectAgentListRowSchema.extend({
  formData: agentFormInputSchema,
  createdAt: z.coerce.string(),
})

export const createProjectAgentSchema = z.object({
  slug: z.string().min(2).max(64).optional(),
  formData: agentFormInputSchema,
  enabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
})

export const updateProjectAgentSchema = z.object({
  formData: agentFormInputSchema.optional(),
  enabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
})

export type AgentTemplateRow = z.infer<typeof agentTemplateRowSchema>
export type ProjectAgentListRow = z.infer<typeof projectAgentListRowSchema>
export type ProjectAgentDetail = z.infer<typeof projectAgentDetailSchema>
export type CreateProjectAgentInput = z.infer<typeof createProjectAgentSchema>
export type UpdateProjectAgentInput = z.infer<typeof updateProjectAgentSchema>
