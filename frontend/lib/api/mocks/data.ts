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
      displayName: 'Telegram Sales Bot',
      name: 'Telegram Sales Bot',
      subdomain: 'telegram-bot',
      publicUrl: 'https://telegram-bot.clawsandbox.cloud',
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
      displayName: 'Discord Community Bot',
      name: 'Discord Community Bot',
      subdomain: 'discord-bot',
      publicUrl: 'https://discord-bot.clawsandbox.cloud',
      status: 'stopped',
      containerName: 'xyz789',
      lastActiveAt: '2026-04-21T12:00:00Z',
      createdAt: '2026-04-19T00:00:00Z',
    },
  ],
  [
    '3',
    {
      id: '3',
      displayName: 'WhatsApp Support Assistant',
      name: 'WhatsApp Support Assistant',
      subdomain: 'whatsapp-support',
      publicUrl: 'https://whatsapp-support.clawsandbox.cloud',
      status: 'creating',
      containerName: null,
      lastActiveAt: null,
      createdAt: '2026-04-18T08:10:00Z',
    },
  ],
  [
    '4',
    {
      id: '4',
      displayName: 'Slack HR Onboarding',
      name: 'Slack HR Onboarding',
      subdomain: 'slack-hr-onboarding',
      publicUrl: 'https://slack-hr-onboarding.clawsandbox.cloud',
      status: 'starting',
      containerName: null,
      lastActiveAt: '2026-04-27T02:45:00Z',
      createdAt: '2026-04-15T03:20:00Z',
    },
  ],
  [
    '5',
    {
      id: '5',
      displayName: 'LINE Marketing Campaign Auto Reply',
      name: 'LINE Marketing Campaign Auto Reply',
      subdomain: 'line-marketing-campaign-auto-reply',
      publicUrl: 'https://line-marketing-campaign-auto-reply.clawsandbox.cloud',
      status: 'error',
      containerName: null,
      lastActiveAt: null,
      createdAt: '2026-04-13T15:40:00Z',
    },
  ],
  [
    '6',
    {
      id: '6',
      displayName: 'Zalo CS Bot',
      name: 'Zalo CS Bot',
      subdomain: 'zalo-cs-bot',
      publicUrl: 'https://zalo-cs-bot.clawsandbox.cloud',
      status: 'running',
      containerName: 'ctn-6f9a2b1',
      lastActiveAt: '2026-04-30T08:00:00Z',
      createdAt: '2026-04-11T09:00:00Z',
    },
  ],
  [
    '7',
    {
      id: '7',
      displayName: 'TikTok Live Comment Moderator',
      name: 'TikTok Live Comment Moderator',
      subdomain: 'tiktok-live-moderator',
      publicUrl: 'https://tiktok-live-moderator.clawsandbox.cloud',
      status: 'stopped',
      containerName: null,
      lastActiveAt: '2026-04-28T10:30:00Z',
      createdAt: '2026-04-10T07:35:00Z',
    },
  ],
  [
    '8',
    {
      id: '8',
      displayName: 'SMS Backup Alerts',
      name: 'SMS Backup Alerts',
      subdomain: 'sms-backup-alerts',
      publicUrl: 'https://sms-backup-alerts.clawsandbox.cloud',
      status: 'running',
      containerName: 'ctn-sms-998',
      lastActiveAt: '2026-04-30T09:12:00Z',
      createdAt: '2026-04-09T05:11:00Z',
    },
  ],
  [
    '9',
    {
      id: '9',
      displayName:
        'Enterprise Omnichannel AI Assistant For Multi Region Support Team With Very Long Project Name',
      name: 'Enterprise Omnichannel AI Assistant For Multi Region Support Team With Very Long Project Name',
      subdomain: 'enterprise-omnichannel-assistant-multi-region-support',
      publicUrl: 'https://enterprise-omnichannel-assistant-multi-region-support.clawsandbox.cloud',
      status: 'running',
      containerName: 'ctn-ent-4421',
      lastActiveAt: '2026-04-29T23:00:00Z',
      createdAt: '2026-04-08T14:25:00Z',
    },
  ],
  [
    '10',
    {
      id: '10',
      displayName: 'Internal QA Sandbox',
      name: 'Internal QA Sandbox',
      subdomain: 'internal-qa-sandbox',
      publicUrl: 'https://internal-qa-sandbox.clawsandbox.cloud',
      status: 'creating',
      containerName: null,
      lastActiveAt: null,
      createdAt: '2026-04-30T08:55:00Z',
    },
  ],
  [
    '11',
    {
      id: '11',
      displayName: 'Nightly Batch Notifier',
      name: 'Nightly Batch Notifier',
      subdomain: 'nightly-batch-notifier',
      publicUrl: 'https://nightly-batch-notifier.clawsandbox.cloud',
      status: 'starting',
      containerName: null,
      lastActiveAt: '2026-04-30T07:45:00Z',
      createdAt: '2026-04-05T06:20:00Z',
    },
  ],
  [
    '12',
    {
      id: '12',
      displayName: 'Failing Test Project',
      name: 'Failing Test Project',
      subdomain: 'failing-test-project',
      publicUrl: 'https://failing-test-project.clawsandbox.cloud',
      status: 'error',
      containerName: 'ctn-fail-001',
      lastActiveAt: '2026-04-20T12:10:00Z',
      createdAt: '2026-03-30T12:10:00Z',
    },
  ],
])

export let currentUser: User | null = mockUsers.get('demo@example.com') || null

export const mockProjectEnv = new Map<string, Map<string, string>>()

export function setCurrentUser(user: User | null) {
  currentUser = user
}
