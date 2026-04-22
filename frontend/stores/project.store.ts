import { create } from 'zustand'
import { projectApi } from '@/lib/api/project'
import type { Project, CreateProjectInput } from '@/schemas/project.schema'

interface ProjectState {
  projects: Project[]
  isLoading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  createProject: (input: CreateProjectInput) => Promise<Project>
  startProject: (id: string) => Promise<void>
  stopProject: (id: string) => Promise<void>
  destroyProject: (id: string) => Promise<void>
  pollHealth: (id: string, onDone: (url: string | null) => void) => () => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const projects = await projectApi.list()
      set({ projects })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Không tải được danh sách project' })
    } finally {
      set({ isLoading: false })
    }
  },

  createProject: async (input) => {
    const project = await projectApi.create(input)
    set((s) => ({ projects: [...s.projects, project] }))
    return project
  },

  startProject: async (id) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, status: 'starting' } : p)),
    }))
    await projectApi.start(id)
  },

  stopProject: async (id) => {
    await projectApi.stop(id)
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, status: 'stopped' } : p)),
    }))
  },

  destroyProject: async (id) => {
    await projectApi.destroy(id)
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
  },

  pollHealth: (id, onDone) => {
    const interval = setInterval(async () => {
      try {
        const health = await projectApi.health(id)
        if (health.status === 'running') {
          clearInterval(interval)
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === id ? { ...p, status: 'running' } : p
            ),
          }))
          onDone(health.subdomain ? `https://${health.subdomain}.openclaw.ai` : null)
        } else if (health.status === 'error') {
          clearInterval(interval)
          set((s) => ({
            projects: s.projects.map((p) => (p.id === id ? { ...p, status: 'error' } : p)),
          }))
          onDone(null)
        }
      } catch {
        // keep polling
      }
    }, 2000)

    return () => clearInterval(interval)
  },
}))
