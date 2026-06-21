import { matchesSessionKey } from '@/utils/chat/session/key'
import { isHiddenToolPayloadText } from '@/utils/chat/stream/history-filter'
import {
  buildArgsPreview,
  buildToolSteps,
  extractWebSources,
  formatToolOutput,
  mergeToolOutput,
  truncateToolOutput,
} from '@/utils/chat/tool/output'

import type {
  AgentToolEventPayload,
  ToolActivity,
  ToolActivityPatch,
  ToolActivityStatus,
  ToolGatewayEventName,
  ToolStreamEntry,
} from '@/utils/chat/tool/types'

export const MAX_TOOL_ACTIVITIES = 5

export const TOOL_ALIASES: Record<string, string> = {
  search: 'web_search',
  fetch: 'web_fetch',
  process: 'exec',
  bash: 'exec',
  shell: 'exec',
}

export const CANONICAL_TOOL_IDS = [
  'web_search',
  'web_fetch',
  'x_search',
  'browser',
  'exec',
  'code_execution',
  'read',
  'write',
  'edit',
  'apply_patch',
  'message',
  'sessions_list',
  'sessions_history',
  'sessions_send',
  'sessions_spawn',
  'subagents',
  'agents_list',
  'session_status',
  'memory_search',
  'memory_get',
  'image',
  'image_generate',
  'video_generate',
  'music_generate',
  'tts',
  'cron',
  'gateway',
  'canvas',
  'nodes',
] as const

export type CanonicalToolId = (typeof CANONICAL_TOOL_IDS)[number]

const CANONICAL_TOOL_ID_SET = new Set<string>(CANONICAL_TOOL_IDS)

export function normalizeToolName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''
  const withoutPrefix = trimmed.replace(/^(?:mcp__|google-drive__|google-calendar__)/i, '')
  const lastSegment = withoutPrefix.includes('__')
    ? (withoutPrefix.split('__').pop() ?? withoutPrefix)
    : withoutPrefix
  return lastSegment.trim().toLowerCase()
}

export function resolveCanonicalToolId(name: string): CanonicalToolId | null {
  const normalized = normalizeToolName(name)
  if (!normalized) return null
  const aliased = TOOL_ALIASES[normalized] ?? normalized
  return CANONICAL_TOOL_ID_SET.has(aliased) ? (aliased as CanonicalToolId) : null
}

export function humanizeToolName(name: string): string {
  const raw =
    name.trim().replace(/^(?:mcp__|google-drive__|google-calendar__)/i, '').split('__').pop() ??
    name
  if (!raw.trim()) return 'tool'
  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
    .trim()
}

export function resolveToolActivityI18nKey(
  name: string,
  status: ToolActivityStatus,
): string {
  const canonicalId = resolveCanonicalToolId(name)
  if (canonicalId) {
    return `chat.toolActivity.tools.${canonicalId}.${status}`
  }
  return `chat.toolActivity.generic.${status}`
}

export function matchesToolSession(
  payloadSessionKey: string | undefined,
  activeSessionKey: string,
): boolean {
  if (!payloadSessionKey?.trim()) return false
  return matchesSessionKey(payloadSessionKey, activeSessionKey)
}

export function readToolEventSessionKey(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const record = payload as AgentToolEventPayload
  if (typeof record.sessionKey === 'string' && record.sessionKey.trim()) {
    return record.sessionKey.trim()
  }
  if (typeof record.key === 'string' && record.key.trim()) {
    return record.key.trim()
  }
  return undefined
}

function readRecord(source: Record<string, unknown>): Record<string, unknown> {
  return source
}

function readToolIdentity(source: Record<string, unknown>): {
  toolCallId: string
  name: string
  phase?: string
  args?: Record<string, unknown>
  partialResult?: unknown
  isError?: boolean
  error?: unknown
  result?: unknown
} | null {
  const toolCallIdRaw = source.toolCallId ?? source.id
  const nameRaw = source.name ?? source.toolName
  const toolCallId =
    typeof toolCallIdRaw === 'string' && toolCallIdRaw.trim()
      ? toolCallIdRaw.trim()
      : null
  const name =
    typeof nameRaw === 'string' && nameRaw.trim() ? nameRaw.trim() : null
  if (!toolCallId || !name) return null

  const args =
    source.args && typeof source.args === 'object'
      ? (source.args as Record<string, unknown>)
      : undefined

  return {
    toolCallId,
    name,
    phase: typeof source.phase === 'string' ? source.phase : undefined,
    args,
    partialResult: source.partialResult,
    isError: source.isError === true ? true : undefined,
    error: source.error,
    result: source.result,
  }
}

function resolveToolEventData(
  record: AgentToolEventPayload,
): ReturnType<typeof readToolIdentity> {
  if (record.data && typeof record.data === 'object') {
    const nested = readToolIdentity(record.data as Record<string, unknown>)
    if (nested) return nested
  }
  return readToolIdentity(readRecord(record as Record<string, unknown>))
}

function resolveErrorMessage(data: {
  isError?: boolean
  error?: unknown
  result?: unknown
}): string | undefined {
  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error.trim()
  }
  if (data.result && typeof data.result === 'object') {
    const result = data.result as Record<string, unknown>
    if (typeof result.error === 'string' && result.error.trim()) {
      return result.error.trim()
    }
  }
  return undefined
}

function phaseToStatus(
  phase: string | undefined,
  data: {
    isError?: boolean
    error?: unknown
    result?: unknown
  },
): ToolActivityStatus {
  if (phase === 'start' || phase === 'update') return 'running'
  if (phase === 'result') {
    if (data.isError === true) return 'error'
    if (typeof data.error === 'string' && data.error.trim()) return 'error'
    if (data.result && typeof data.result === 'object') {
      const result = data.result as Record<string, unknown>
      if (result.isError === true) return 'error'
      if (typeof result.error === 'string' && result.error.trim()) return 'error'
    }
    return 'done'
  }
  return 'running'
}

export function parseAgentToolPayload(
  payload: unknown,
  eventName: ToolGatewayEventName,
): ToolActivityPatch | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as AgentToolEventPayload

  if (eventName === 'agent' && record.stream !== 'tool') return null

  const toolData = resolveToolEventData(record)
  if (!toolData) return null

  const now = Date.now()
  const phase = toolData.phase

  return {
    id: toolData.toolCallId,
    name: toolData.name,
    status: phaseToStatus(phase, toolData),
    phase,
    updatedAt: now,
    startedAt: phase === 'start' ? now : undefined,
    args: toolData.args,
    partialResult: toolData.partialResult,
    result: toolData.result,
    errorMessage: resolveErrorMessage(toolData),
  }
}

function applyOutputPatch(
  existing: ToolStreamEntry | undefined,
  patch: ToolActivityPatch,
): Pick<
  ToolStreamEntry,
  | 'args'
  | 'argsPreview'
  | 'outputPreview'
  | 'outputFull'
  | 'outputTruncated'
  | 'errorMessage'
  | 'sources'
  | 'steps'
> {
  const args = patch.args ?? existing?.args
  const argsPreview = args ? buildArgsPreview(args) : existing?.argsPreview
  const canonicalId = resolveCanonicalToolId(patch.name)

  let rawOutput = existing?.outputFull ?? ''
  if (patch.phase === 'update' && patch.partialResult != null) {
    rawOutput = mergeToolOutput(rawOutput, patch.partialResult)
  } else if (patch.phase === 'result' && patch.result != null) {
    rawOutput = formatToolOutput(patch.result)
  } else if (patch.phase === 'start' && patch.partialResult != null) {
    rawOutput = mergeToolOutput(rawOutput, patch.partialResult)
  }

  const { preview, full, truncated } = truncateToolOutput(rawOutput)
  let sources = extractWebSources(canonicalId, args, patch.result ?? patch.partialResult)
  if (sources.length === 0 && existing?.sources?.length) {
    sources = [...existing.sources]
  } else if (patch.phase === 'result' && patch.result != null) {
    const fromResult = extractWebSources(canonicalId, args, patch.result)
    for (const source of fromResult) {
      if (!sources.some((s) => s.url === source.url)) sources.push(source)
    }
  }

  const draft: ToolStreamEntry = {
    id: patch.id,
    name: patch.name,
    canonicalId,
    status: patch.status,
    i18nKey: resolveToolActivityI18nKey(patch.name, patch.status),
    displayName: canonicalId ? undefined : humanizeToolName(patch.name),
    startedAt: existing?.startedAt ?? patch.updatedAt,
    updatedAt: patch.updatedAt,
    phase: patch.phase,
    args,
    argsPreview,
    outputPreview: preview || existing?.outputPreview,
    outputFull: full || existing?.outputFull,
    outputTruncated: truncated || existing?.outputTruncated,
    errorMessage: patch.errorMessage ?? existing?.errorMessage,
    sources: sources.length > 0 ? sources : existing?.sources,
  }

  return {
    args,
    argsPreview,
    outputPreview: preview || existing?.outputPreview,
    outputFull: full || existing?.outputFull,
    outputTruncated: truncated || existing?.outputTruncated,
    errorMessage: patch.errorMessage ?? existing?.errorMessage,
    sources: draft.sources,
    steps: buildToolSteps(draft),
  }
}

export function applyToolActivityPatch(
  map: Map<string, ToolStreamEntry>,
  patch: ToolActivityPatch,
): Map<string, ToolStreamEntry> {
  const next = new Map(map)
  const existing = next.get(patch.id)
  const canonicalId = resolveCanonicalToolId(patch.name)
  const i18nKey = resolveToolActivityI18nKey(patch.name, patch.status)
  const startedAt = patch.startedAt ?? existing?.startedAt ?? patch.updatedAt
  const outputPatch = applyOutputPatch(existing, patch)

  next.set(patch.id, {
    id: patch.id,
    name: patch.name,
    canonicalId,
    status: patch.status,
    i18nKey,
    displayName: canonicalId ? undefined : humanizeToolName(patch.name),
    startedAt,
    updatedAt: patch.updatedAt,
    phase: patch.phase ?? existing?.phase,
    ...outputPatch,
  })

  return next
}

export function toActivityList(map: Map<string, ToolActivity>): ToolActivity[] {
  const all = [...map.values()]
  const rank = (status: ToolActivityStatus): number => {
    if (status === 'running') return 0
    if (status === 'error') return 1
    return 2
  }

  all.sort((a, b) => {
    const rankDiff = rank(a.status) - rank(b.status)
    if (rankDiff !== 0) return rankDiff
    return b.updatedAt - a.updatedAt
  })

  return all.slice(0, MAX_TOOL_ACTIVITIES)
}

export function toStreamEntryList(map: Map<string, ToolStreamEntry>): ToolStreamEntry[] {
  return [...map.values()].sort((a, b) => a.startedAt - b.startedAt)
}

export function parseToolGatewayEvent(
  eventName: string,
  payload: unknown,
  activeSessionKey: string,
): ToolActivityPatch | null {
  if (eventName !== 'agent' && eventName !== 'session.tool') return null
  const sessionKey = readToolEventSessionKey(payload)
  if (sessionKey && !matchesToolSession(sessionKey, activeSessionKey)) return null
  return parseAgentToolPayload(payload, eventName)
}

export function toolEntryToActivity(entry: ToolStreamEntry): ToolActivity {
  return {
    id: entry.id,
    name: entry.name,
    canonicalId: entry.canonicalId,
    status: entry.status,
    i18nKey: entry.i18nKey,
    displayName: entry.displayName,
    startedAt: entry.startedAt,
    updatedAt: entry.updatedAt,
  }
}

export function mergeLiveAssistantText(
  liveItems: { type: string; text?: string }[],
  streamText: string,
): string {
  const parts: string[] = []
  for (const item of liveItems) {
    if (item.type !== 'text' || typeof item.text !== 'string') continue
    const trimmed = item.text.trim()
    if (!trimmed || isHiddenToolPayloadText(trimmed)) continue
    parts.push(trimmed)
  }
  const streamTrimmed = streamText.trim()
  if (streamTrimmed && !isHiddenToolPayloadText(streamTrimmed)) {
    parts.push(streamTrimmed)
  }
  return parts.join('\n\n')
}
