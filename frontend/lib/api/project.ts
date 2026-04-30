import { api } from '@/lib/axios'
import {
  projectSchema,
  projectHealthSchema,
  upsertProjectEnvSchema,
  type Project,
  type CreateProjectInput,
  type ProjectHealth,
  type UpsertProjectEnvInput,
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

  destroy: async (id: string): Promise<void> => {
    await api.delete(`/api/projects/${id}`)
  },

  upsertEnv: async (id: string, input: UpsertProjectEnvInput): Promise<void> => {
    const parsed = upsertProjectEnvSchema.parse(input)
    await api.put(`/api/projects/${id}/env`, parsed)
  },
}
