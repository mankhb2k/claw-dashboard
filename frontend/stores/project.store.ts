import { create } from 'zustand'
import { projectApi } from '@/lib/api/project'
import type { Project, CreateProjectInput } from '@/schemas/project.schema'

interface ProjectState {
  projects: Project[]
  isLoading: boolean
  error: string | null
  fetchProjects: (opts?: { silent?: boolean }) => Promise<void>
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

  fetchProjects: async (opts) => {
    const silent = opts?.silent === true
    if (!silent) {
      set({ isLoading: true, error: null })
    }
    try {
      const projects = await projectApi.list()
      set({ projects, error: null })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Không tải được danh sách project' })
    } finally {
      if (!silent) {
        set({ isLoading: false })
      }
    }
  },

  createProject: async (input) => {
    const project = await projectApi.create(input)
    set((s) => ({ projects: [...s.projects, project] }))
    return project
  },

  startProject: async (id) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, status: 'STARTING' } : p)),
    }))
    await projectApi.start(id)
    // Add silent poll so the UI can auto-refresh when start actually completes
    get().pollHealth(id, () => {})
  },

  stopProject: async (id) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, status: 'STOPPING' } : p)),
    }))
    await projectApi.stop(id)
    // Do not optimistically set STOPPED, because the worker takes up to 10s to stop.
    // Instead, trigger silent polling to wait for the real STOPPED state.
    get().pollHealth(id, () => {})
  },

  destroyProject: async (id) => {
    await projectApi.destroy(id)
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
  },

  pollHealth: (id, onDone) => {
    const interval = setInterval(async () => {
      try {
        const health = await projectApi.health(id)
        const healthStatus = health.status?.toUpperCase()
        if (healthStatus === 'RUNNING') {
          clearInterval(interval)
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === id ? { ...p, status: 'RUNNING' } : p
            ),
          }))
          onDone(
            health.publicUrl
              ? health.publicUrl
              : health.subdomain
                ? `https://${health.subdomain}.${process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'clawsandbox.cloud'}`
                : null,
          )
        } else if (healthStatus === 'ERROR') {
          clearInterval(interval)
          set((s) => ({
            projects: s.projects.map((p) => (p.id === id ? { ...p, status: 'ERROR' } : p)),
          }))
          onDone(null)
        } else if (healthStatus === 'STOPPED') {
          clearInterval(interval)
          set((s) => ({
            projects: s.projects.map((p) => (p.id === id ? { ...p, status: 'STOPPED' } : p)),
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
