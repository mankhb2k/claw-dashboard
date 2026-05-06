import { api } from '@/lib/axios'
import {
  projectSchema,
  projectHealthSchema,
  upsertProjectEnvSchema,
  projectEnvMaskedRowSchema,
  gatewayTokenResponseSchema,
  connectorDefinitionSchema,
  projectConnectorSchema,
  type Project,
  type CreateProjectInput,
  type ProjectHealth,
  type UpsertProjectEnvInput,
  type GatewayTokenResponse,
  type ConnectorDefinition,
  type ProjectConnector,
} from '@/schemas/project.schema'
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
    const res = await api.post('/api/projects', input)
    return projectSchema.parse(res.data)
  },

  start: async (id: string): Promise<void> => {
    await api.post(`/api/projects/${id}/start`)
  },

  stop: async (id: string): Promise<void> => {
    await api.post(`/api/projects/${id}/stop`)
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

  upsertEnv: async (id: string, input: UpsertProjectEnvInput): Promise<void> => {
    const parsed = upsertProjectEnvSchema.parse(input)
    await api.put(`/api/projects/${id}/env`, parsed)
  },

  listEnv: async (
    id: string,
  ): Promise<Array<{ key: string; updatedAt: string; masked: string }>> => {
    const res = await api.get(`/api/projects/${id}/env`)
    return z.array(projectEnvMaskedRowSchema).parse(res.data)
  },

  deleteEnvKey: async (id: string, key: string): Promise<void> => {
    await api.delete(`/api/projects/${id}/env`, { data: { key } })
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
}
