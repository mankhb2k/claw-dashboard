const LAST_KEY_PREFIX = 'claw-dashboard.chat.lastSessionKey'
const LAST_AGENT_PREFIX = 'claw-dashboard.chat.lastAgentId'
const SIDEBAR_COLLAPSED_PREFIX = 'claw-dashboard.chat.sidebarCollapsed'

function storageKey(prefix: string, projectId: string, agentId?: string): string {
  const base = `${prefix}:${projectId}`
  return agentId ? `${base}:${agentId.trim().toLowerCase()}` : base
}

export function loadLastSessionKey(projectId: string, agentId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(storageKey(LAST_KEY_PREFIX, projectId, agentId))
  } catch {
    return null
  }
}

export function saveLastSessionKey(projectId: string, agentId: string, sessionKey: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey(LAST_KEY_PREFIX, projectId, agentId), sessionKey)
  } catch {
    /* ignore quota errors */
  }
}

export function loadLastAgentId(projectId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(storageKey(LAST_AGENT_PREFIX, projectId))
  } catch {
    return null
  }
}

export function saveLastAgentId(projectId: string, agentId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey(LAST_AGENT_PREFIX, projectId), agentId.trim().toLowerCase())
  } catch {
    /* ignore */
  }
}

export function loadSidebarCollapsed(projectId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(storageKey(SIDEBAR_COLLAPSED_PREFIX, projectId)) === '1'
  } catch {
    return false
  }
}

export function saveSidebarCollapsed(projectId: string, collapsed: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey(SIDEBAR_COLLAPSED_PREFIX, projectId), collapsed ? '1' : '0')
  } catch {
    /* ignore */
  }
}
