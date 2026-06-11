import { api } from '@/lib/http/axios'
import { z } from 'zod'

const chatAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  isDefault: z.boolean(),
})

const chatStatusSchema = z.object({
  ready: z.boolean(),
  reason: z.string().optional(),
  status: z.string().optional(),
  agents: z.array(chatAgentSchema),
  defaultAgentId: z.string(),
  defaultSessionKey: z.string(),
})

const chatModelOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  openclawId: z.string(),
})

const chatModelProviderSchema = z.object({
  providerId: z.string(),
  displayName: z.string(),
  defaultModel: z.string().nullable(),
  tested: z.boolean(),
  models: z.array(chatModelOptionSchema),
})

export const chatModelsResponseSchema = z.object({
  primaryModel: z.string().nullable(),
  agentPrimaryModel: z.string().nullable().optional(),
  providers: z.array(chatModelProviderSchema),
})

export type ChatStatus = z.infer<typeof chatStatusSchema>
export type ChatAgent = z.infer<typeof chatAgentSchema>
export type ChatModelsResponse = z.infer<typeof chatModelsResponseSchema>

export const chatApi = {
  status: async (projectId: string): Promise<ChatStatus> => {
    const res = await api.get(`/api/projects/${projectId}/chat/status`)
    return chatStatusSchema.parse(res.data)
  },

  listModels: async (
    projectId: string,
    agentId?: string,
  ): Promise<ChatModelsResponse> => {
    const params = agentId?.trim() ? { agentId: agentId.trim() } : undefined
    const res = await api.get(`/api/projects/${projectId}/chat/models`, {
      params,
    })
    const parsed = chatModelsResponseSchema.parse(res.data)
    return {
      ...parsed,
      agentPrimaryModel:
        parsed.agentPrimaryModel ?? parsed.primaryModel ?? null,
    }
  },

  setModel: async (
    projectId: string,
    body: { agentId: string; model: string },
  ): Promise<{ model: string; primaryModel: string | null }> => {
    const res = await api.put(`/api/projects/${projectId}/chat/model`, body)
    return res.data as { model: string; primaryModel: string | null }
  },
}
