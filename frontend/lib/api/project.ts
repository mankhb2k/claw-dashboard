import { api } from '@/lib/axios'
import {
  projectSchema,
  projectHealthSchema,
  type Project,
  type CreateProjectInput,
  type ProjectHealth,
} from '@/schemas/project.schema'
import { z } from 'zod'

export const projectApi = {
  // Backend: GET /api/projects/mine
  list: async (): Promise<Project[]> => {
    const res = await api.get('/api/projects/mine')
    return z.array(projectSchema).parse(res.data)
  },

  // Backend: POST /api/projects (name sent in body)
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
}
