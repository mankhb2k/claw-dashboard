import { api } from '@/lib/axios'
import { SPAWN_API_TIMEOUT_MS } from '@/lib/project-spawn'
import { PROVIDER_TEST_TIMEOUT_MS } from '@/lib/provider-test'
import {
  projectSchema,
  projectHealthSchema,
  projectEnvMaskedRowSchema,
  providerKeyTestResultSchema,
  providerDefinitionSchema,
  gatewayTokenResponseSchema,
  connectorDefinitionSchema,
  projectConnectorSchema,
  channelDefinitionSchema,
  projectChannelSchema,
  channelTestResultSchema,
  projectSkillListRowSchema,
  projectSkillDetailSchema,
  agentTemplateRowSchema,
  projectAgentListRowSchema,
  projectAgentDetailSchema,
  projectCollaborationSchema,
  updateProjectCollaborationSchema,
  skillAiEditorOptionsResponseSchema,
  skillAiEditorCompleteInputSchema,
  skillAiEditorCompleteResponseSchema,
  type ProjectSkillListRow,
  type ProjectSkillDetail,
  type CreateProjectSkillInput,
  type UpdateProjectSkillInput,
  type AgentTemplateRow,
  type ProjectAgentListRow,
  type ProjectAgentDetail,
  type CreateProjectAgentInput,
  type UpdateProjectAgentInput,
  type ProjectCollaboration,
  type UpdateProjectCollaborationInput,
  createProjectAgentSchema,
  updateProjectAgentSchema,
  type SkillAiEditorOptionsResponse,
  type SkillAiEditorCompleteInput,
  type Project,
  type CreateProjectInput,
  type ProjectHealth,
  type GatewayTokenResponse,
  type ConnectorDefinition,
  type ProjectConnector,
  type ChannelDefinition,
  type ProjectChannel,
  type ChannelTestResult,
  type ProviderDefinition,
  type ProviderKeyTestResult,
  type ProjectEnvMaskedRow,
} from '@/schemas/project.schema'
import {
  createCronJobInputSchema,
  cronJobSchema,
  cronListResponseSchema,
  cronSummarySchema,
  updateCronJobInputSchema,
  type CreateCronJobInput,
  type UpdateCronJobInput,
} from '@/schemas/cron.schema'
import { z } from 'zod'

export const projectApi = {
  // Backend: GET /api/projects/mine
  list: async (): Promise<Project[]> => {
    const res = await api.get('/api/projects/mine')
    const parsed = z.array(projectSchema).safeParse(res.data)
    if (!parsed.success) {
      console.error('[projectApi.list] Zod parse failed', parsed.error, res.data)
      throw new Error('Dữ liệu project từ server không hợp lệ. Xem console.')
    }
    return parsed.data
  },

  // Backend: POST /api/projects (displayName in body; slug/subdomain is server-generated)
  create: async (input: CreateProjectInput): Promise<Project> => {
    const res = await api.post('/api/projects', input, { timeout: SPAWN_API_TIMEOUT_MS })
    return projectSchema.parse(res.data)
  },

  // Backend: PATCH /api/projects/:id
  updateDisplayName: async (id: string, displayName: string): Promise<Project> => {
    const res = await api.patch(`/api/projects/${id}`, { displayName })
    return projectSchema.parse(res.data)
  },

  start: async (id: string): Promise<Project> => {
    const res = await api.post(`/api/projects/${id}/start`, undefined, {
      timeout: SPAWN_API_TIMEOUT_MS,
    })
    return projectSchema.parse(res.data)
  },

  respawn: async (id: string): Promise<Project> => {
    const res = await api.post(`/api/projects/${id}/respawn`, undefined, {
      timeout: SPAWN_API_TIMEOUT_MS,
    })
    return projectSchema.parse(res.data)
  },

  stop: async (id: string): Promise<Project> => {
    const res = await api.post(`/api/projects/${id}/stop`)
    return projectSchema.parse(res.data)
  },

  health: async (id: string): Promise<ProjectHealth> => {
    const res = await api.get(`/api/projects/${id}/health`)
    return projectHealthSchema.parse(res.data)
  },

  gatewayToken: async (id: string): Promise<GatewayTokenResponse> => {
    const res = await api.get(`/api/projects/${id}/gateway-token`)
    return gatewayTokenResponseSchema.parse(res.data)
  },

  destroy: async (id: string): Promise<void> => {
    await api.delete(`/api/projects/${id}`)
  },

  listProviderKeys: async (id: string): Promise<ProjectEnvMaskedRow[]> => {
    const res = await api.get(`/api/projects/${id}/provider-keys`)
    return z.array(projectEnvMaskedRowSchema).parse(res.data)
  },

  saveProviderKey: async (
    id: string,
    providerId: string,
    body: { apiKey: string; label?: string; defaultModel?: string },
  ): Promise<ProviderKeyTestResult> => {
    const res = await api.put(`/api/projects/${id}/provider-keys/${providerId}`, body, {
      timeout: PROVIDER_TEST_TIMEOUT_MS + 5_000,
    })
    return providerKeyTestResultSchema.parse(res.data)
  },

  setProviderEnabled: async (
    id: string,
    providerId: string,
    enabled: boolean,
  ): Promise<ProviderKeyTestResult> => {
    const res = await api.patch(
      `/api/projects/${id}/provider-keys/${providerId}/enabled`,
      { enabled },
      { timeout: PROVIDER_TEST_TIMEOUT_MS + 5_000 },
    )
    return providerKeyTestResultSchema.parse(res.data)
  },

  testProviderKey: async (id: string, providerId: string): Promise<ProviderKeyTestResult> => {
    const res = await api.post(`/api/projects/${id}/provider-keys/${providerId}/test`, undefined, {
      timeout: PROVIDER_TEST_TIMEOUT_MS + 5_000,
    })
    return providerKeyTestResultSchema.parse(res.data)
  },

  /** GET /api/projects/providers/definitions — catalog provider + models (không cần project id) */
  listProviderDefinitions: async (): Promise<ProviderDefinition[]> => {
    const res = await api.get('/api/projects/providers/definitions')
    return z.array(providerDefinitionSchema).parse(res.data)
  },

  deleteProviderKey: async (id: string, providerId: string): Promise<void> => {
    await api.delete(`/api/projects/${id}/provider-keys/${providerId}`)
  },

  listConnectorDefinitions: async (): Promise<ConnectorDefinition[]> => {
    const res = await api.get('/api/projects/connectors/definitions')
    return z.array(connectorDefinitionSchema).parse(res.data)
  },

  listConnectors: async (id: string): Promise<ProjectConnector[]> => {
    const res = await api.get(`/api/projects/${id}/connectors`)
    return z.array(projectConnectorSchema).parse(res.data)
  },

  createConnector: async (
    id: string,
    input: {
      connectorSlug: string
      displayName?: string
      enabled?: boolean
      config?: Record<string, unknown>
    },
  ): Promise<void> => {
    await api.post(`/api/projects/${id}/connectors`, input)
  },

  updateConnector: async (
    id: string,
    connectorId: string,
    input: { displayName?: string; enabled?: boolean; config?: Record<string, unknown> },
  ): Promise<void> => {
    await api.patch(`/api/projects/${id}/connectors/${connectorId}`, input)
  },

  upsertConnectorSecret: async (
    id: string,
    connectorId: string,
    secretKey: string,
    value: string,
  ): Promise<void> => {
    await api.put(`/api/projects/${id}/connectors/${connectorId}/secrets/${secretKey}`, { value })
  },

  deleteConnectorSecret: async (
    id: string,
    connectorId: string,
    secretKey: string,
  ): Promise<void> => {
    await api.delete(`/api/projects/${id}/connectors/${connectorId}/secrets/${secretKey}`)
  },

  testConnector: async (id: string, connectorId: string): Promise<void> => {
    await api.post(`/api/projects/${id}/connectors/${connectorId}/test`)
  },

  deleteConnector: async (id: string, connectorId: string): Promise<void> => {
    await api.delete(`/api/projects/${id}/connectors/${connectorId}`)
  },

  startConnectorOAuth: async (id: string, slug: string): Promise<{ url: string }> => {
    const res = await api.get(`/api/projects/${id}/connectors/${encodeURIComponent(slug)}/oauth/start`)
    return z.object({ url: z.string().url() }).parse(res.data)
  },

  listChannelDefinitions: async (): Promise<ChannelDefinition[]> => {
    const res = await api.get('/api/projects/channels/definitions')
    return z.array(channelDefinitionSchema).parse(res.data)
  },

  listChannels: async (id: string): Promise<ProjectChannel[]> => {
    const res = await api.get(`/api/projects/${id}/channels`)
    return z.array(projectChannelSchema).parse(res.data)
  },

  getOrCreateChannel: async (
    id: string,
    channelId: string,
  ): Promise<ProjectChannel> => {
    const existing = await projectApi.listChannels(id)
    const row = existing.find((c) => c.channelId === channelId)
    if (row) return row
    const res = await api.post(`/api/projects/${id}/channels`, { channelId })
    return projectChannelSchema.parse(res.data)
  },

  updateChannel: async (
    id: string,
    channelRowId: string,
    input: { enabled?: boolean; config?: Record<string, unknown> },
  ): Promise<ProjectChannel> => {
    const res = await api.patch(`/api/projects/${id}/channels/${channelRowId}`, input)
    return projectChannelSchema.parse(res.data)
  },

  upsertChannelSecret: async (
    id: string,
    channelRowId: string,
    secretKey: string,
    value: string,
  ): Promise<void> => {
    await api.put(`/api/projects/${id}/channels/${channelRowId}/secrets/${secretKey}`, {
      value,
    })
  },

  testChannel: async (id: string, channelRowId: string): Promise<ChannelTestResult> => {
    const res = await api.post(`/api/projects/${id}/channels/${channelRowId}/test`)
    return channelTestResultSchema.parse(res.data)
  },

  deleteChannel: async (id: string, channelRowId: string): Promise<void> => {
    await api.delete(`/api/projects/${id}/channels/${channelRowId}`)
  },

  listSkills: async (id: string): Promise<ProjectSkillListRow[]> => {
    const res = await api.get(`/api/projects/${id}/skills`)
    return z.array(projectSkillListRowSchema).parse(res.data)
  },

  getSkill: async (id: string, slug: string): Promise<ProjectSkillDetail> => {
    const res = await api.get(`/api/projects/${id}/skills/${encodeURIComponent(slug)}`)
    return projectSkillDetailSchema.parse(res.data)
  },

  createSkill: async (id: string, input: CreateProjectSkillInput): Promise<ProjectSkillDetail> => {
    const res = await api.post(`/api/projects/${id}/skills`, input)
    return projectSkillDetailSchema.parse(res.data)
  },

  updateSkill: async (
    id: string,
    slug: string,
    input: UpdateProjectSkillInput,
  ): Promise<ProjectSkillDetail> => {
    const res = await api.put(
      `/api/projects/${id}/skills/${encodeURIComponent(slug)}`,
      input,
    )
    return projectSkillDetailSchema.parse(res.data)
  },

  setSkillEnabled: async (
    id: string,
    slug: string,
    enabled: boolean,
  ): Promise<ProjectSkillDetail> => {
    const res = await api.patch(
      `/api/projects/${id}/skills/${encodeURIComponent(slug)}/enabled`,
      { enabled },
    )
    return projectSkillDetailSchema.parse(res.data)
  },

  deleteSkill: async (id: string, slug: string): Promise<void> => {
    await api.delete(`/api/projects/${id}/skills/${encodeURIComponent(slug)}`)
  },

  syncAllSkills: async (id: string): Promise<{ synced: number; failed: number }> => {
    const res = await api.post(`/api/projects/${id}/skills/sync-all`)
    return z
      .object({ synced: z.number(), failed: z.number() })
      .parse(res.data)
  },

  skillAiEditorOptions: async (id: string): Promise<SkillAiEditorOptionsResponse> => {
    const res = await api.get(`/api/projects/${id}/skill-ai-editor/options`)
    return skillAiEditorOptionsResponseSchema.parse(res.data)
  },

  skillAiEditorComplete: async (
    id: string,
    input: SkillAiEditorCompleteInput,
  ): Promise<{ markdown: string }> => {
    const body = skillAiEditorCompleteInputSchema.parse(input)
    const res = await api.post(`/api/projects/${id}/skill-ai-editor/complete`, body, {
      timeout: 130_000,
    })
    return skillAiEditorCompleteResponseSchema.parse(res.data)
  },

  listAgentTemplates: async (id: string): Promise<AgentTemplateRow[]> => {
    const res = await api.get(`/api/projects/${id}/agents/templates`)
    return z.array(agentTemplateRowSchema).parse(res.data)
  },

  getAgentTemplate: async (id: string, slug: string): Promise<AgentTemplateRow> => {
    const res = await api.get(
      `/api/projects/${id}/agents/templates/${encodeURIComponent(slug)}`,
    )
    return agentTemplateRowSchema.parse(res.data)
  },

  listAgents: async (id: string): Promise<ProjectAgentListRow[]> => {
    const res = await api.get(`/api/projects/${id}/agents`)
    return z.array(projectAgentListRowSchema).parse(res.data)
  },

  getAgent: async (id: string, slug: string): Promise<ProjectAgentDetail> => {
    const res = await api.get(`/api/projects/${id}/agents/${encodeURIComponent(slug)}`)
    return projectAgentDetailSchema.parse(res.data)
  },

  createAgent: async (id: string, input: CreateProjectAgentInput): Promise<ProjectAgentDetail> => {
    const body = createProjectAgentSchema.parse(input)
    const res = await api.post(`/api/projects/${id}/agents`, body)
    return projectAgentDetailSchema.parse(res.data)
  },

  updateAgent: async (
    id: string,
    slug: string,
    input: UpdateProjectAgentInput,
  ): Promise<ProjectAgentDetail> => {
    const body = updateProjectAgentSchema.parse(input)
    const res = await api.put(`/api/projects/${id}/agents/${encodeURIComponent(slug)}`, body)
    return projectAgentDetailSchema.parse(res.data)
  },

  setAgentEnabled: async (
    id: string,
    slug: string,
    enabled: boolean,
  ): Promise<ProjectAgentDetail> => {
    const res = await api.patch(
      `/api/projects/${id}/agents/${encodeURIComponent(slug)}/enabled`,
      { enabled },
    )
    return projectAgentDetailSchema.parse(res.data)
  },

  duplicateAgent: async (
    id: string,
    slug: string,
    input?: { slug?: string; name?: string },
  ): Promise<ProjectAgentDetail> => {
    const res = await api.post(
      `/api/projects/${id}/agents/${encodeURIComponent(slug)}/duplicate`,
      input ?? {},
    )
    return projectAgentDetailSchema.parse(res.data)
  },

  deleteAgent: async (id: string, slug: string): Promise<void> => {
    await api.delete(`/api/projects/${id}/agents/${encodeURIComponent(slug)}`)
  },

  syncAllAgents: async (id: string): Promise<{ synced: number; failed: number }> => {
    const res = await api.post(`/api/projects/${id}/agents/sync-all`)
    return z.object({ synced: z.number(), failed: z.number() }).parse(res.data)
  },

  getCollaboration: async (id: string): Promise<ProjectCollaboration> => {
    const res = await api.get(`/api/projects/${id}/collaboration`)
    return projectCollaborationSchema.parse(res.data)
  },

  updateCollaboration: async (
    id: string,
    input: UpdateProjectCollaborationInput,
  ): Promise<ProjectCollaboration> => {
    const body = updateProjectCollaborationSchema.parse(input)
    const res = await api.put(`/api/projects/${id}/collaboration`, body)
    return projectCollaborationSchema.parse(res.data)
  },

  getCronSummary: async (id: string) => {
    const res = await api.get(`/api/projects/${id}/cron/summary`)
    return cronSummarySchema.parse(res.data)
  },

  listCronJobs: async (id: string, agentId?: string) => {
    const res = await api.get(`/api/projects/${id}/cron`, {
      params: agentId ? { agentId } : undefined,
    })
    return cronListResponseSchema.parse(res.data)
  },

  createCronJob: async (id: string, input: CreateCronJobInput) => {
    const body = createCronJobInputSchema.parse(input)
    const res = await api.post(`/api/projects/${id}/cron`, body)
    return cronJobSchema.parse(res.data)
  },

  updateCronJob: async (id: string, jobId: string, input: UpdateCronJobInput) => {
    const body = updateCronJobInputSchema.parse(input)
    const res = await api.patch(`/api/projects/${id}/cron/${encodeURIComponent(jobId)}`, body)
    return cronJobSchema.parse(res.data)
  },

  deleteCronJob: async (id: string, jobId: string): Promise<void> => {
    await api.delete(`/api/projects/${id}/cron/${encodeURIComponent(jobId)}`)
  },

  runCronJob: async (id: string, jobId: string): Promise<void> => {
    await api.post(`/api/projects/${id}/cron/${encodeURIComponent(jobId)}/run`)
  },
}
