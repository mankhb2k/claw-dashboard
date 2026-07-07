import { z } from 'zod'

// Backend returns uppercase; normalize to lowercase for the frontend
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

export type ProjectTranslate = (path: string) => string

export function createCreateProjectSchema(t: ProjectTranslate) {
  return z.object({
    displayName: z
      .string()
      .min(1, t('project.validation.displayName.min'))
      .max(200, t('project.validation.displayName.max'))
      .optional(),
  })
}

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
export type CreateProjectInput = z.infer<ReturnType<typeof createCreateProjectSchema>>
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

/** GET /api/projects/:id/provider-keys/:providerId/reveal */
export const providerKeyRevealResponseSchema = z.object({
  apiKey: z.string().min(1),
})

export type ProviderKeyRevealResponse = z.infer<
  typeof providerKeyRevealResponseSchema
>

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

export const heartbeatSummaryEntrySchema = z.object({
  agentId: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  every: z.string().nullable(),
  mode: z.enum(['off', 'inherit', 'custom']),
  source: z.enum(['main', 'inherit', 'custom', 'off']),
})

export const projectHeartbeatResponseSchema = z.object({
  enabled: z.boolean(),
  every: z.string(),
  heartbeatMd: z.string().nullable(),
  effectiveEvery: z.string().nullable(),
  agents: z.array(heartbeatSummaryEntrySchema),
})

export type ProjectHeartbeatResponse = z.infer<typeof projectHeartbeatResponseSchema>
export type HeartbeatSummaryEntry = z.infer<typeof heartbeatSummaryEntrySchema>

export const agentHeartbeatResponseSchema = z.object({
  agentId: z.string(),
  name: z.string(),
  mode: z.enum(['off', 'inherit', 'custom']),
  every: z.string().nullable(),
  heartbeatMd: z.string().nullable(),
  enabled: z.boolean(),
  effectiveEvery: z.string().nullable(),
  mainEnabled: z.boolean(),
  mainEvery: z.string(),
})

export type AgentHeartbeatResponse = z.infer<typeof agentHeartbeatResponseSchema>

export const updateProjectHeartbeatBodySchema = z.object({
  enabled: z.boolean(),
  every: z.string().min(1).max(32),
  heartbeatMd: z.string().max(12000).nullable().optional(),
})

export const updateAgentHeartbeatBodySchema = z.object({
  mode: z.enum(['off', 'inherit', 'custom']),
  every: z.string().max(32).nullable().optional(),
  heartbeatMd: z.string().max(12000).nullable().optional(),
})

export const projectSandboxAgentRowSchema = z.object({
  slug: z.string(),
  name: z.string(),
  avatar: z.string(),
  enabled: z.boolean(),
})

export const projectSandboxResponseSchema = z.object({
  enabled: z.boolean(),
  mode: z.enum(['all', 'selected']),
  exemptAgentSlugs: z.array(z.string()),
  appliedAgentSlugs: z.array(z.string()),
  agents: z.array(projectSandboxAgentRowSchema),
})

export type ProjectSandboxResponse = z.infer<typeof projectSandboxResponseSchema>

export const updateProjectSandboxBodySchema = z.object({
  enabled: z.boolean(),
  mode: z.enum(['all', 'selected']),
  exemptAgentSlugs: z.array(z.string()),
  appliedAgentSlugs: z.array(z.string()),
})

export const projectExecPolicyResponseSchema = z.object({
  askPolicy: z.enum(['always', 'on-miss', 'off']),
  safeBins: z.array(z.string()),
  timeoutSec: z.number(),
})

export type ProjectExecPolicyResponse = z.infer<typeof projectExecPolicyResponseSchema>

export const updateProjectExecPolicyBodySchema = z.object({
  askPolicy: z.enum(['always', 'on-miss', 'off']),
  safeBins: z.array(z.string()),
  timeoutSec: z.number().min(5).max(86400),
})

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

export const providerStarterModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  openclawId: z.string(),
  recommended: z.boolean().optional(),
})

export const providerDefinitionSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  envKey: z.string(),
  uiGroup: z.enum(['foundation', 'ai-provider']),
  category: z.enum(['direct', 'proxy']),
  openclawProviderId: z.string().optional(),
  defaultModel: z.string().optional(),
  models: z.array(providerModelCatalogSchema).optional(),
  starterModels: z.array(providerStarterModelSchema).optional(),
  modelRefHint: z.string().optional(),
  apiKeyUrl: z.string().optional(),
  docsUrl: z.string().optional(),
})

export const providerModelRowSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  openclawId: z.string(),
  displayName: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ProviderDefinition = z.infer<typeof providerDefinitionSchema>
export type ProviderModelCatalog = z.infer<typeof providerModelCatalogSchema>
export type ProviderStarterModel = z.infer<typeof providerStarterModelSchema>
export type ProviderModelRow = z.infer<typeof providerModelRowSchema>

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

export const skillStoreItemSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  heading: z.string(),
  tags: z.array(z.string()),
  installed: z.boolean(),
  downloads: z.number().nullable(),
  stars: z.number().nullable(),
})

export const skillStoreDetailSchema = skillStoreItemSchema.extend({
  bodyMarkdown: z.string(),
})

export const skillStoreSearchResponseSchema = z.object({
  items: z.array(skillStoreItemSchema),
  nextCursor: z.string().nullable(),
})

export const installSkillFromStoreInputSchema = z.object({
  slug: z.string().min(2).max(64),
})

export type ProjectSkillListRow = z.infer<typeof projectSkillListRowSchema>
export type ProjectSkillDetail = z.infer<typeof projectSkillDetailSchema>
export type CreateProjectSkillInput = z.infer<typeof createProjectSkillSchema>
export type UpdateProjectSkillInput = z.infer<typeof updateProjectSkillSchema>
export type SkillStoreItem = z.infer<typeof skillStoreItemSchema>
export type SkillStoreDetail = z.infer<typeof skillStoreDetailSchema>
export type InstallSkillFromStoreInput = z.infer<typeof installSkillFromStoreInputSchema>

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

/** POST /api/projects/:id/agent-ai-editor/complete */
export const agentAiEditorMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

export const agentAiEditorCompleteInputSchema = z.object({
  providerId: z.string(),
  model: z.string(),
  intent: z.enum(['optimize', 'chat']),
  messages: z.array(agentAiEditorMessageSchema).min(1).max(20),
  agentContext: z.object({
    name: z.string(),
    description: z.string(),
    vibe: z.enum(['professional', 'friendly', 'strict']),
    tags: z.array(z.string()),
    instructionsMode: z.enum(['simple', 'advanced']),
    currentAgentsMd: z.string(),
    activeEditTab: z.string().optional(),
    instructionsRole: z.string().optional(),
    instructionsRules: z.string().optional(),
    instructionsConstraints: z.string().optional(),
    instructionsOutputFormat: z.string().optional(),
  }),
})

export const agentAiEditorCompleteResponseSchema = z.object({
  phase: z.enum(['clarify', 'optimize']),
  message: z.string(),
  questions: z.array(z.string()).optional(),
  markdown: z.string().optional(),
})

export type AgentAiEditorCompleteInput = z.infer<
  typeof agentAiEditorCompleteInputSchema
>
export type AgentAiEditorCompleteResponse = z.infer<
  typeof agentAiEditorCompleteResponseSchema
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
  skillsCount: z.number().int().nonnegative(),
  enabled: z.boolean(),
  isDefault: z.boolean(),
  inCollaboration: z.boolean().default(false),
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
  shellExecEnabled: z.boolean(),
  skillNames: z.array(z.string()).default([]),
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

export const agentApiKeyListItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  tokenPrefix: z.string(),
  createdAt: z.coerce.string(),
  lastUsedAt: z.coerce.string().nullable(),
})

export const agentApiKeyListResponseSchema = z.object({
  items: z.array(agentApiKeyListItemSchema),
})

export const agentApiKeyCreatedSchema = agentApiKeyListItemSchema.extend({
  token: z.string().min(1),
})

export const createAgentApiKeyInputSchema = z.object({
  label: z.string().min(1).max(200),
})

export type AgentApiKeyListItem = z.infer<typeof agentApiKeyListItemSchema>
export type AgentApiKeyCreated = z.infer<typeof agentApiKeyCreatedSchema>
export type CreateAgentApiKeyInput = z.infer<typeof createAgentApiKeyInputSchema>

export const projectCollaborationSchema = z.object({
  enabled: z.boolean(),
  memberSlugs: z.array(z.string()),
  effectiveAllow: z.array(z.string()),
  legacyDerived: z.boolean().optional().default(false),
})

export function createUpdateProjectCollaborationSchema(t: ProjectTranslate) {
  return z
    .object({
      enabled: z.boolean(),
      memberSlugs: z.array(z.string().min(1)).max(50),
    })
    .superRefine((data, ctx) => {
      if (data.enabled && data.memberSlugs.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['memberSlugs'],
          message: t('agent.collaboration.needMember'),
        })
      }
    })
}

export type UpdateProjectCollaborationInput = z.infer<
  ReturnType<typeof createUpdateProjectCollaborationSchema>
>

export type ProjectCollaboration = z.infer<typeof projectCollaborationSchema>
