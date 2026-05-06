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
    containerName: z.string().nullable().optional(), // backend field
    lastActiveAt: z.coerce.string().nullable(),
    createdAt: z.coerce.string(),
  })
  .transform((p) => ({ ...p, name: p.displayName }))

export const createProjectSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Tên tối thiểu 1 ký tự')
    .max(200, 'Tên tối đa 200 ký tự'),
})

export const projectEnvEntrySchema = z.object({
  key: z.string().min(2).max(100),
  value: z.string().min(1).max(5000),
})

export const upsertProjectEnvSchema = z.object({
  env: z.array(projectEnvEntrySchema).min(1).max(100),
})

export const projectHealthSchema = z.object({
  status: projectStatusSchema,
  displayName: z.string().optional(),
  publicUrl: z.string().optional(),
  subdomain: z.string().optional(),
  lastActiveAt: z.coerce.string().nullable().optional(),
  storageUsedMb: z.number().optional(),
})

export type Project = z.infer<typeof projectSchema>
export type ProjectStatus = z.infer<typeof projectStatusSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type ProjectHealth = z.infer<typeof projectHealthSchema>
export type ProjectEnvEntryInput = z.infer<typeof projectEnvEntrySchema>
export type UpsertProjectEnvInput = z.infer<typeof upsertProjectEnvSchema>

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

/** GET /api/projects/:id/env — masked rows */
export const projectEnvMaskedRowSchema = z.object({
  key: z.string(),
  updatedAt: z.coerce.string(),
  masked: z.string(),
})

export const connectorKindSchema = z.enum(['API', 'MCP', 'OAUTH'])
export const connectorStatusSchema = z.enum(['DISCONNECTED', 'CONNECTED', 'ERROR', 'NEEDS_REAUTH'])

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
