import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { mockUsers, mockPasswords, mockProjects, currentUser, setCurrentUser } from './data'
import type { User, LoginInput, RegisterInput } from '@/schemas/auth.schema'
import type { CreateProjectInput, Project } from '@/schemas/project.schema'

export interface MockRequest {
  config: InternalAxiosRequestConfig
  data: any
}

const projectTimers = new Map<string, NodeJS.Timeout>()

export const authHandlers = {
  login: (req: MockRequest): User => {
    const { email, password } = req.data as LoginInput

    if (password.length < 6) {
      throw new Error('Mật khẩu tối thiểu 6 ký tự')
    }

    const user = mockUsers.get(email)
    if (!user) {
      throw new Error('Email không tồn tại')
    }

    const storedPassword = mockPasswords.get(email)
    if (storedPassword !== password) {
      throw new Error('Mật khẩu không đúng')
    }

    setCurrentUser(user)
    return user
  },

  register: (req: MockRequest): User => {
    const { email, password } = req.data as Omit<RegisterInput, 'confirmPassword'>

    if (password.length < 6) {
      throw new Error('Mật khẩu tối thiểu 6 ký tự')
    }

    if (mockUsers.has(email)) {
      throw new Error('Email đã tồn tại')
    }

    const user: User = {
      id: Math.random().toString(36).slice(2, 9),
      email,
      name: email.split('@')[0],
      createdAt: new Date().toISOString(),
    }

    mockUsers.set(email, user)
    mockPasswords.set(email, password)
    setCurrentUser(user)
    return user
  },

  logout: (): void => {
    setCurrentUser(null)
  },

  me: (): User => {
    if (!currentUser) {
      throw new Error('Not authenticated')
    }
    return currentUser
  },
}

export const projectHandlers = {
  list: (): Project[] => {
    if (!currentUser) {
      throw new Error('Not authenticated')
    }
    return Array.from(mockProjects.values())
  },

  create: (req: MockRequest): Project => {
    if (!currentUser) {
      throw new Error('Not authenticated')
    }

    const { displayName } = req.data as CreateProjectInput
    const slugBase = displayName
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project'
    const subdomain = `${slugBase}-m${Math.random().toString(36).slice(2, 6)}`
    const publicUrl = `https://${subdomain}.clawsandbox.cloud`

    const project: Project = {
      id: Math.random().toString(36).slice(2, 9),
      displayName,
      name: displayName,
      subdomain,
      publicUrl,
      status: 'creating',
      containerName: null,
      lastActiveAt: null,
      createdAt: new Date().toISOString(),
    }

    mockProjects.set(project.id, project)

    // Simulate async creation: creating → running (2s)
    const timer = setTimeout(() => {
      const p = mockProjects.get(project.id)
      if (p) {
        p.status = 'running'
        p.containerName = Math.random().toString(36).slice(2, 9)
      }
    }, 2000)

    projectTimers.set(project.id, timer)

    return project
  },

  start: (id: string): void => {
    if (!currentUser) throw new Error('Not authenticated')

    const project = mockProjects.get(id)
    if (!project) throw new Error('Project not found')

    project.status = 'starting'

    // Simulate async start: starting → running (3s)
    const timer = setTimeout(() => {
      const p = mockProjects.get(id)
      if (p) {
        p.status = 'running'
        p.lastActiveAt = new Date().toISOString()
      }
    }, 3000)

    projectTimers.set(id, timer)
  },

  stop: (id: string): void => {
    if (!currentUser) throw new Error('Not authenticated')

    const project = mockProjects.get(id)
    if (!project) throw new Error('Project not found')

    project.status = 'stopped'

    // Clear any pending timers
    const timer = projectTimers.get(id)
    if (timer) clearTimeout(timer)
  },

  health: (id: string) => {
    if (!currentUser) throw new Error('Not authenticated')

    const project = mockProjects.get(id)
    if (!project) throw new Error('Project not found')

    return {
      status: project.status,
      displayName: project.displayName,
      publicUrl:
        project.status === 'running' ? (project.publicUrl ?? `https://${project.subdomain}.clawsandbox.cloud`) : undefined,
      subdomain: project.subdomain,
    }
  },

  destroy: (id: string): void => {
    if (!currentUser) throw new Error('Not authenticated')

    const timer = projectTimers.get(id)
    if (timer) clearTimeout(timer)
    projectTimers.delete(id)

    mockProjects.delete(id)
  },
}
