import type {
  OverviewChartPeriod,
  OverviewResponse,
} from '@/schemas/overview.schema'

export interface OverviewChartDataPoint {
  name: string
  value: number
}

export type UsageTableRowStatus = 'Success' | 'Failed' | 'Processing'

export interface UsageTableRow {
  id: string
  model: string
  time: string
  user: string
  status: UsageTableRowStatus | string
  latency: number
  inputTokens: number
  outputTokens: number
  color: string
}

const SOURCE_LABELS: Record<string, string> = {
  CHAT_UI: 'Dashboard',
  CHANNEL: 'Channel',
  CRON: 'Cron',
  API_KEY: 'API Key',
  HEARTBEAT: 'Heartbeat',
  OTHER: 'Other',
}

const MODEL_COLORS = [
  'var(--color-overview-input)',
  'var(--color-overview-output)',
  'var(--color-warning)',
  'var(--color-overview-cost)',
  'var(--color-overview-chart-secondary)',
]

export function formatTokenCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return value.toLocaleString('en-US')
}

export function formatCostUsd(value: string): string {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount === 0) return '$0.00'
  if (amount < 0.01) return `$${amount.toFixed(4)}`
  return `$${amount.toFixed(2)}`
}

export function modelAccentColor(modelId: string): string {
  let hash = 0
  for (const char of modelId) {
    hash = (hash + char.charCodeAt(0)) % MODEL_COLORS.length
  }
  return MODEL_COLORS[hash] ?? MODEL_COLORS[0]!
}

export function formatCallTime(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatSourceLabel(
  source: string,
  agentSlug: string | null,
): string {
  const base = SOURCE_LABELS[source] ?? source
  return agentSlug ? `${base} · ${agentSlug}` : base
}

export function chartPointsToRecharts(
  points: OverviewResponse['charts']['input'],
  period: OverviewChartPeriod,
): OverviewChartDataPoint[] {
  return points.map((point) => {
    if ('hour' in point) {
      return { name: String(point.hour), value: point.value }
    }
    if ('date' in point) {
      const [, month, day] = point.date.split('-')
      return {
        name: period === 'week' ? `${Number(month)}/${Number(day)}` : point.date,
        value: point.value,
      }
    }
    return { name: String(point.day), value: point.value }
  })
}

export function shouldShowChartTick(
  name: string,
  period: OverviewChartPeriod,
): boolean {
  const numeric = Number(name)
  if (!Number.isFinite(numeric)) {
    return period === 'week'
  }
  if (period === 'day') {
    return numeric > 0 && numeric % 2 === 0
  }
  if (period === 'month') {
    return numeric % 2 === 0 && numeric >= 2
  }
  return true
}

export function mapRecentCalls(
  calls: OverviewResponse['recentCalls'],
  timezone: string,
): UsageTableRow[] {
  return calls.map((call, index) => ({
    id: `${call.createdAt}-${index}`,
    model: call.modelId,
    time: formatCallTime(call.createdAt, timezone),
    user: formatSourceLabel(call.source, call.agentSlug),
    status: call.status,
    latency: call.latencyMs ?? 0,
    inputTokens: call.inputTokens,
    outputTokens: call.outputTokens,
    color: modelAccentColor(call.modelId),
  }))
}
