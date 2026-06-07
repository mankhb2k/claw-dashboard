/** Subset of OpenClaw gateway session row (sessions.list). */
export type GatewaySessionRow = {
  key: string
  label?: string
  displayName?: string
  /** First user message title when sessions.list uses includeDerivedTitles. */
  derivedTitle?: string
  kind: 'cron' | 'direct' | 'group' | 'global' | 'unknown'
  updatedAt: number | null
  archived?: boolean
  hasActiveRun?: boolean
  totalTokens?: number
  contextTokens?: number
  totalTokensFresh?: boolean
  compactionCount?: number
}

export type SessionsListResult = {
  ts: number
  count: number
  totalCount?: number
  hasMore?: boolean
  nextOffset?: number | null
  sessions: GatewaySessionRow[]
}

export type SessionsCreateResult = {
  ok?: boolean
  key?: string
  sessionId?: string
}
