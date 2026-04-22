import type { User } from '@/schemas/auth.schema'
import type { Project } from '@/schemas/project.schema'

// User profile data (returned in API responses)
export const mockUsers = new Map<string, User>([
  [
    'demo@example.com',
    {
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
      createdAt: '2026-04-22T00:00:00Z',
    },
  ],
])

// Password storage (separate, never returned in API)
export const mockPasswords = new Map<string, string>([
  ['demo@example.com', 'demo123'],
])

export const mockProjects = new Map<string, Project>([
  [
    '1',
    {
      id: '1',
      name: 'Telegram Bot',
      subdomain: 'telegram-bot',
      status: 'running',
      containerName: 'abc123',
      lastActiveAt: new Date().toISOString(),
      createdAt: '2026-04-20T00:00:00Z',
    },
  ],
  [
    '2',
    {
      id: '2',
      name: 'Discord Bot',
      subdomain: 'discord-bot',
      status: 'stopped',
      containerName: 'xyz789',
      lastActiveAt: '2026-04-21T12:00:00Z',
      createdAt: '2026-04-19T00:00:00Z',
    },
  ],
])

export let currentUser: User | null = null

export function setCurrentUser(user: User | null) {
  currentUser = user
}
