import type { InternalAxiosRequestConfig } from 'axios'
import {
  mockUsers,
  mockPasswords,
  mockProjects,
  mockProjectEnv,
  mockGatewayTokens,
  currentUser,
  setCurrentUser,
} from './data'
import type { User, LoginInput, RegisterInput } from '@/schemas/auth.schema'
import type { CreateProjectInput, Project } from '@/schemas/project.schema'

export interface MockRequest {
  config: InternalAxiosRequestConfig
  data: unknown
}

const projectTimers = new Map<string, NodeJS.Timeout>()
type MockConnectorKind = 'API' | 'MCP' | 'OAUTH'
type MockConnectorStatus = 'DISCONNECTED' | 'CONNECTED' | 'ERROR' | 'NEEDS_REAUTH'

type MockConnectorDefinition = {
  id: string
  slug: string
  displayName: string
  description: string
  kind: MockConnectorKind
  status: 'ACTIVE' | 'DISABLED' | 'DEPRECATED'
}

type MockProjectConnector = {
  id: string
  projectId: string
  connectorDefinitionId: string
  connectorSlug: string
  connectorName: string
  connectorKind: MockConnectorKind
  displayName: string
  enabled: boolean
  connectionStatus: MockConnectorStatus
  config: Record<string, unknown> | null
  lastTestedAt: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
  secrets: Map<string, string>
}

const mockConnectorDefinitions: MockConnectorDefinition[] = [
  { id: 'def_1', slug: 'trello', displayName: 'Trello', description: 'Quản lý công việc và bảng Kanban', kind: 'API', status: 'ACTIVE' },
  { id: 'def_2', slug: 'google-calendar', displayName: 'Google Calendar', description: 'Đồng bộ sự kiện và lịch họp', kind: 'OAUTH', status: 'ACTIVE' },
  { id: 'def_3', slug: 'figma', displayName: 'Figma', description: 'Trích xuất asset và thông tin thiết kế', kind: 'MCP', status: 'ACTIVE' },
  { id: 'def_4', slug: 'slack', displayName: 'Slack', description: 'Gửi thông báo và bot chat nội bộ', kind: 'MCP', status: 'ACTIVE' },
  { id: 'def_5', slug: 'github', displayName: 'GitHub', description: 'Quản lý Pull Request, Issues và Actions', kind: 'OAUTH', status: 'ACTIVE' },
  { id: 'def_6', slug: 'notion', displayName: 'Notion', description: 'Truy cập wiki và database tài liệu', kind: 'MCP', status: 'ACTIVE' },
  { id: 'def_7', slug: 'jira', displayName: 'Jira Software', description: 'Theo dõi tiến độ Sprint và bug', kind: 'API', status: 'ACTIVE' },
  { id: 'def_8', slug: 'linear', displayName: 'Linear', description: 'Issue tracking tốc độ cao cho dev', kind: 'API', status: 'ACTIVE' },
  { id: 'def_9', slug: 'discord', displayName: 'Discord', description: 'Bot trả lời tự động cho server', kind: 'MCP', status: 'ACTIVE' },
  { id: 'def_10', slug: 'google-drive', displayName: 'Google Drive', description: 'Lưu trữ và đọc file tài liệu', kind: 'OAUTH', status: 'ACTIVE' },
  { id: 'def_11', slug: 'stripe', displayName: 'Stripe', description: 'Nhận event thanh toán và hóa đơn', kind: 'API', status: 'ACTIVE' },
  { id: 'def_12', slug: 'salesforce', displayName: 'Salesforce', description: 'Truy xuất dữ liệu CRM khách hàng', kind: 'API', status: 'ACTIVE' },
  { id: 'def_13', slug: 'zendesk', displayName: 'Zendesk', description: 'Hỗ trợ ticket CSKH tự động', kind: 'API', status: 'ACTIVE' },
]

const mockProjectConnectors = new Map<string, Map<string, MockProjectConnector>>()
let connectorCounter = 0

export const authHandlers = {
  login: (req: MockRequest): { user: User } => {
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
    return { user }
  },

  register: (req: MockRequest): { user: User } => {
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
    return { user }
  },

  logout: (): void => {
    setCurrentUser(null)
  },

  me: (): { user: User } => {
    if (!currentUser) {
      throw new Error('Not authenticated')
    }
    return { user: currentUser }
  },
}

export const projectHandlers = {
  list: (): Project[] => {
    if (!currentUser) throw new Error('Not authenticated')
    return Array.from(mockProjects.values())
  },

  create: (req: MockRequest): Project => {
    if (!currentUser) throw new Error('Not authenticated')

    const { displayName } = req.data as CreateProjectInput
    const slugBase =
      displayName
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

    const hexId = [...project.id].reduce((acc, c) => acc + c.charCodeAt(0).toString(16), '')
    mockGatewayTokens.set(
      project.id,
      `${hexId.repeat(8).slice(0, 32)}facade00`,
    )

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
      lastActiveAt: project.lastActiveAt,
    }
  },

  destroy: (id: string): void => {
    if (!currentUser) throw new Error('Not authenticated')

    const timer = projectTimers.get(id)
    if (timer) clearTimeout(timer)
    projectTimers.delete(id)
    mockGatewayTokens.delete(id)
    mockProjects.delete(id)
  },

  gatewayToken: (id: string): { token: string } => {
    if (!currentUser) throw new Error('Not authenticated')
    if (!mockProjects.has(id)) throw new Error('Project not found')

    let token = mockGatewayTokens.get(id)
    if (!token) {
      const hexId = [...id].reduce((acc, c) => acc + c.charCodeAt(0).toString(16), '')
      token = `${hexId.repeat(8).slice(0, 48)}beef`
      mockGatewayTokens.set(id, token)
    }
    return { token }
  },

  upsertEnv: (id: string, req: MockRequest): void => {
    if (!currentUser) throw new Error('Not authenticated')
    if (!mockProjects.has(id)) throw new Error('Project not found')
    const data = req.data as { env?: Array<{ key: string; value: string }> }
    const list = data.env ?? []
    const store = mockProjectEnv.get(id) ?? new Map<string, string>()
    for (const entry of list) {
      if (!entry?.key || !entry?.value) continue
      store.set(entry.key, entry.value)
    }
    mockProjectEnv.set(id, store)
  },

  getEnv: (id: string): Array<{ key: string; updatedAt: string; masked: string }> => {
    if (!currentUser) throw new Error('Not authenticated')
    if (!mockProjects.has(id)) throw new Error('Project not found')
    const store = mockProjectEnv.get(id)
    if (!store) return []
    const now = new Date().toISOString()
    return Array.from(store.keys()).map((key) => ({
      key,
      updatedAt: now,
      masked: '••••••••••••',
    }))
  },

  deleteEnvKey: (id: string, keyName: string): void => {
    if (!currentUser) throw new Error('Not authenticated')
    if (!mockProjects.has(id)) throw new Error('Project not found')
    const trimmed = keyName.trim()
    if (!trimmed) throw new Error('Missing key')

    const store = mockProjectEnv.get(id)
    if (!store) return
    store.delete(trimmed)
    if (store.size === 0) {
      mockProjectEnv.delete(id)
    }
  },

  connectorDefinitions: () => {
    return mockConnectorDefinitions.map((item) => ({
      ...item,
      configSchema: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  },

  listConnectors: (id: string) => {
    if (!currentUser) throw new Error('Not authenticated')
    if (!mockProjects.has(id)) throw new Error('Project not found')
    const store = mockProjectConnectors.get(id)
    if (!store) return []
    return Array.from(store.values()).map((conn) => ({
      id: conn.id,
      projectId: conn.projectId,
      connectorDefinitionId: conn.connectorDefinitionId,
      connectorSlug: conn.connectorSlug,
      connectorName: conn.connectorName,
      connectorKind: conn.connectorKind,
      displayName: conn.displayName,
      enabled: conn.enabled,
      connectionStatus: conn.connectionStatus,
      config: conn.config,
      lastTestedAt: conn.lastTestedAt,
      lastError: conn.lastError,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt,
      secrets: Array.from(conn.secrets.keys()).map((key) => ({
        key,
        updatedAt: conn.updatedAt,
        masked: '••••••••••••',
      })),
      definition: {
        description:
          mockConnectorDefinitions.find((def) => def.slug === conn.connectorSlug)?.description ?? '',
        status: 'ACTIVE',
        configSchema: null,
      },
    }))
  },

  createConnector: (id: string, req: MockRequest) => {
    if (!currentUser) throw new Error('Not authenticated')
    if (!mockProjects.has(id)) throw new Error('Project not found')
    const data = req.data as {
      connectorSlug?: string
      displayName?: string
      enabled?: boolean
      config?: Record<string, unknown>
    }
    const slug = (data.connectorSlug ?? '').trim().toLowerCase()
    const def = mockConnectorDefinitions.find((item) => item.slug === slug)
    if (!def) throw new Error('Connector definition not found')

    const now = new Date().toISOString()
    const store = mockProjectConnectors.get(id) ?? new Map<string, MockProjectConnector>()
    if (store.has(slug)) throw new Error('Connector already exists')

    connectorCounter += 1
    store.set(slug, {
      id: `conn_${connectorCounter}`,
      projectId: id,
      connectorDefinitionId: def.id,
      connectorSlug: def.slug,
      connectorName: def.displayName,
      connectorKind: def.kind,
      displayName: data.displayName?.trim() || def.displayName,
      enabled: Boolean(data.enabled),
      connectionStatus: data.enabled ? 'CONNECTED' : 'DISCONNECTED',
      config: data.config ?? null,
      lastTestedAt: null,
      lastError: null,
      createdAt: now,
      updatedAt: now,
      secrets: new Map<string, string>(),
    })
    mockProjectConnectors.set(id, store)
  },

  updateConnector: (id: string, connectorId: string, req: MockRequest) => {
    if (!currentUser) throw new Error('Not authenticated')
    const store = mockProjectConnectors.get(id)
    if (!store) throw new Error('Connector not found')
    const conn = Array.from(store.values()).find((item) => item.id === connectorId)
    if (!conn) throw new Error('Connector not found')

    const data = req.data as { displayName?: string; enabled?: boolean; config?: Record<string, unknown> }
    if (data.displayName !== undefined) conn.displayName = data.displayName.trim() || conn.connectorName
    if (data.enabled !== undefined) {
      conn.enabled = data.enabled
      conn.connectionStatus = data.enabled ? 'CONNECTED' : 'DISCONNECTED'
    }
    if (data.config !== undefined) conn.config = data.config
    conn.updatedAt = new Date().toISOString()
  },

  upsertConnectorSecret: (id: string, connectorId: string, secretKey: string, req: MockRequest) => {
    if (!currentUser) throw new Error('Not authenticated')
    const store = mockProjectConnectors.get(id)
    if (!store) throw new Error('Connector not found')
    const conn = Array.from(store.values()).find((item) => item.id === connectorId)
    if (!conn) throw new Error('Connector not found')
    const data = req.data as { value?: string }
    if (!data.value?.trim()) throw new Error('Missing secret value')
    conn.secrets.set(secretKey.toUpperCase(), data.value.trim())
    conn.updatedAt = new Date().toISOString()
  },

  deleteConnectorSecret: (id: string, connectorId: string, secretKey: string) => {
    if (!currentUser) throw new Error('Not authenticated')
    const store = mockProjectConnectors.get(id)
    if (!store) return
    const conn = Array.from(store.values()).find((item) => item.id === connectorId)
    if (!conn) return
    conn.secrets.delete(secretKey.toUpperCase())
    conn.updatedAt = new Date().toISOString()
  },

  testConnector: (id: string, connectorId: string) => {
    if (!currentUser) throw new Error('Not authenticated')
    const store = mockProjectConnectors.get(id)
    if (!store) throw new Error('Connector not found')
    const conn = Array.from(store.values()).find((item) => item.id === connectorId)
    if (!conn) throw new Error('Connector not found')
    const now = new Date().toISOString()
    conn.lastTestedAt = now
    if (!conn.secrets.has('API_KEY')) {
      conn.connectionStatus = 'ERROR'
      conn.lastError = 'Missing API_KEY secret'
      throw new Error('API_KEY secret is required before testing connector')
    }
    conn.enabled = true
    conn.connectionStatus = 'CONNECTED'
    conn.lastError = null
    conn.updatedAt = now
  },
}

