import type { User } from '@/schemas/auth.schema'
import type { Project } from '@/schemas/project.schema'

export const mockUsers = new Map<string, User>([
  [
    'demo',
    {
      id: '1',
      username: 'demo',
      name: 'Demo',
      createdAt: '2026-04-22T00:00:00Z',
    },
  ],
])

export const mockPasswords = new Map<string, string>([['demo', 'demo123']])

export const mockProjectEnv = new Map<string, Map<string, string>>()
export const mockGatewayTokens = new Map<string, string>()

export const mockProjects = new Map<string, Project>([
  [
    '1',
    {
      id: '1',
      displayName: 'Telegram Sales Bot',
      name: 'Telegram Sales Bot',
      subdomain: 'telegram-bot',
      publicUrl: 'https://telegram-bot.localhost',
      status: 'running',
      containerMissing: false,
      containerName: 'abc123',
      lastActiveAt: new Date().toISOString(),
      createdAt: '2026-04-20T00:00:00Z',
    },
  ],
])

export let currentUser: User | null = mockUsers.get('demo') ?? null

export function setCurrentUser(user: User | null) {
  currentUser = user
}
