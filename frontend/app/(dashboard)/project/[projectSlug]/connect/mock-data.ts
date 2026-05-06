export type ServiceType = 'MCP' | 'API' | 'OAUTH'
export type PermissionMode = 'allow' | 'ask' | 'block'

export type ServiceMeta = {
  id: string
  slug: string
  type: ServiceType
  supportUrl: string
  author: string
  connectorUrl: string
  tools: string[]
}

export type PermissionGroup = {
  id: string
  labelKey: 'readOnlyTools' | 'writeDeleteTools'
  tools: string[]
}

export const MOCK_SERVICES: ServiceMeta[] = [
  {
    id: 'drive',
    slug: 'google-drive',
    type: 'OAUTH',
    supportUrl: 'https://developers.google.com/workspace/support',
    author: 'Google',
    connectorUrl: 'https://drive.googleapis.com',
    tools: [
      'create_file',
      'download_file_content',
      'get_file_metadata',
      'get_file_permissions',
      'list_recent_files',
      'read_file_content',
      'search_files',
    ],
  },
  {
    id: 'notion',
    slug: 'notion',
    type: 'MCP',
    supportUrl: 'https://www.notion.so/help',
    author: 'Notion',
    connectorUrl: 'https://www.notion.so',
    tools: ['search_files', 'read_file_content', 'create_file'],
  },
  {
    id: 'github',
    slug: 'github',
    type: 'OAUTH',
    supportUrl: 'https://docs.github.com/en',
    author: 'GitHub',
    connectorUrl: 'https://api.github.com',
    tools: ['search_files', 'read_file_content'],
  },
  {
    id: 'slack',
    slug: 'slack',
    type: 'MCP',
    supportUrl: 'https://slack.com/help',
    author: 'Slack',
    connectorUrl: 'https://slack.com/api',
    tools: ['search_files', 'read_file_content'],
  },
  {
    id: 'gmail',
    slug: 'gmail',
    type: 'OAUTH',
    supportUrl: 'https://support.google.com/mail',
    author: 'Google',
    connectorUrl: 'https://gmail.googleapis.com',
    tools: ['read_file_content', 'search_files'],
  },
  {
    id: 'google-calendar',
    slug: 'google-calendar',
    type: 'OAUTH',
    supportUrl: 'https://support.google.com/calendar',
    author: 'Google',
    connectorUrl: 'https://www.googleapis.com/calendar/v3',
    tools: ['read_file_content', 'search_files'],
  },
]

export const MOCK_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'read',
    labelKey: 'readOnlyTools',
    tools: [
      'download_file_content',
      'get_file_metadata',
      'get_file_permissions',
      'list_recent_files',
      'read_file_content',
      'search_files',
    ],
  },
  {
    id: 'write',
    labelKey: 'writeDeleteTools',
    tools: ['copy_file', 'create_file'],
  },
]

export function findServiceBySlug(slug: string): ServiceMeta | null {
  return MOCK_SERVICES.find((item) => item.slug === slug) ?? null
}
