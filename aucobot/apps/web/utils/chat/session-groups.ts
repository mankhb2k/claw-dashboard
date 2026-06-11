import type { GatewaySessionRow } from './session-types'

export type SessionDateGroup = 'today' | 'yesterday' | 'thisWeek' | 'older'

export const SESSION_GROUP_LABELS: Record<SessionDateGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This week',
  older: 'Older',
}

const GROUP_ORDER: SessionDateGroup[] = ['today', 'yesterday', 'thisWeek', 'older']

function startOfLocalDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function resolveSessionDateGroup(
  updatedAt: number | null | undefined,
  now = Date.now(),
): SessionDateGroup {
  if (!updatedAt || !Number.isFinite(updatedAt)) return 'older'

  const todayStart = startOfLocalDay(now)
  const sessionStart = startOfLocalDay(updatedAt)
  const diffDays = Math.floor((todayStart - sessionStart) / 86_400_000)

  if (diffDays <= 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return 'thisWeek'
  return 'older'
}

export function groupSessionsByDate(
  sessions: GatewaySessionRow[],
): Array<{ group: SessionDateGroup; sessions: GatewaySessionRow[] }> {
  const buckets = new Map<SessionDateGroup, GatewaySessionRow[]>()

  for (const row of sessions) {
    const group = resolveSessionDateGroup(row.updatedAt)
    const list = buckets.get(group) ?? []
    list.push(row)
    buckets.set(group, list)
  }

  return GROUP_ORDER.filter((group) => buckets.has(group)).map((group) => ({
    group,
    sessions: buckets.get(group)!,
  }))
}

export function formatRelativeSessionTime(
  updatedAt: number | null | undefined,
  now = Date.now(),
): string {
  if (!updatedAt || !Number.isFinite(updatedAt)) return ''

  const diffMs = Math.max(0, now - updatedAt)
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m`

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`

  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d`

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(updatedAt))
}
