import { redactObject, redactSensitiveText } from './redact'
import type { ToolSource, ToolStep, ToolStreamEntry } from './types'

export const TOOL_OUTPUT_PREVIEW_LIMIT = 500
export const TOOL_OUTPUT_MAX_LIMIT = 120_000

const WEB_TOOL_IDS = new Set(['web_search', 'web_fetch', 'x_search', 'browser'])

export function formatToolOutput(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return redactSensitiveText(value)
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  try {
    const redacted = redactObject(value)
    return JSON.stringify(redacted, null, 2)
  } catch {
    return redactSensitiveText(String(value))
  }
}

export function truncateToolOutput(
  text: string,
  previewLimit = TOOL_OUTPUT_PREVIEW_LIMIT,
  maxLimit = TOOL_OUTPUT_MAX_LIMIT,
): { preview: string; full: string; truncated: boolean } {
  const full = text.length > maxLimit ? `${text.slice(0, maxLimit)}…` : text
  if (full.length <= previewLimit) {
    return { preview: full, full, truncated: false }
  }
  return {
    preview: `${full.slice(0, previewLimit)}…`,
    full,
    truncated: true,
  }
}

function parseDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] ?? url
  }
}

function collectUrlsFromValue(value: unknown, out: ToolSource[]): void {
  if (typeof value === 'string') {
    const urlMatches = value.match(/https?:\/\/[^\s)\]"']+/gi) ?? []
    for (const url of urlMatches) {
      const clean = url.replace(/[.,;:!?)]+$/, '')
      if (!out.some((s) => s.url === clean)) {
        out.push({ url: clean, domain: parseDomain(clean) })
      }
    }
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectUrlsFromValue(item, out)
    return
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const directUrl = ['url', 'href', 'link']
      .map((key) => record[key])
      .find((candidate): candidate is string => typeof candidate === 'string')
    if (directUrl?.startsWith('http')) {
      const clean = directUrl.replace(/[.,;:!?)]+$/, '')
      if (!out.some((s) => s.url === clean)) {
        out.push({
          url: clean,
          domain: parseDomain(clean),
          title: typeof record.title === 'string' ? record.title : undefined,
        })
      }
    }
    for (const val of Object.values(record)) collectUrlsFromValue(val, out)
  }
}

export function extractWebSources(
  canonicalId: string | null,
  args: Record<string, unknown> | undefined,
  result: unknown,
): ToolSource[] {
  const sources: ToolSource[] = []

  if (canonicalId === 'web_fetch' && args) {
    const url =
      (typeof args.url === 'string' && args.url) ||
      (typeof args.href === 'string' && args.href)
    if (url) {
      sources.push({ url, domain: parseDomain(url) })
    }
  }

  collectUrlsFromValue(result, sources)

  if (canonicalId === 'web_search' && args) {
    const query = typeof args.query === 'string' ? args.query : undefined
    if (query && sources.length === 0) {
      // placeholder until results arrive
    }
  }

  return sources.slice(0, 12)
}

export function buildArgsPreview(args: Record<string, unknown> | undefined): string {
  if (!args || Object.keys(args).length === 0) return ''
  const redacted = redactObject(args) as Record<string, unknown>
  const keys = Object.keys(redacted)
  if (keys.length <= 3) return formatToolOutput(redacted)
  const subset: Record<string, unknown> = {}
  for (const key of keys.slice(0, 3)) subset[key] = redacted[key]
  return `${formatToolOutput(subset)}\n…`
}

export function isWebResearchTool(canonicalId: string | null): boolean {
  return canonicalId != null && WEB_TOOL_IDS.has(canonicalId)
}

export function buildToolSteps(entry: ToolStreamEntry): ToolStep[] {
  const canonicalId = entry.canonicalId
  const status = entry.status
  const steps: ToolStep[] = []

  if (canonicalId === 'web_search') {
    const query =
      typeof entry.args?.query === 'string'
        ? entry.args.query
        : typeof entry.args?.q === 'string'
          ? entry.args.q
          : undefined
    steps.push({
      id: `${entry.id}-search`,
      label: query ?? entry.name,
      status,
      icon: 'globe',
    })
  } else if (canonicalId === 'web_fetch') {
    const url =
      typeof entry.args?.url === 'string'
        ? entry.args.url
        : entry.sources?.[0]?.url
    const domain = url ? parseDomain(url) : entry.sources?.[0]?.domain ?? entry.name
    steps.push({
      id: `${entry.id}-fetch`,
      label: domain,
      status,
      icon: 'link',
    })
  } else if (canonicalId === 'exec' || canonicalId === 'code_execution') {
    const command =
      typeof entry.args?.command === 'string'
        ? entry.args.command
        : typeof entry.args?.cmd === 'string'
          ? entry.args.cmd
          : undefined
    steps.push({
      id: `${entry.id}-exec`,
      label: command ?? entry.name,
      status,
      icon: 'terminal',
    })
  } else if (
    canonicalId === 'read' ||
    canonicalId === 'write' ||
    canonicalId === 'edit' ||
    canonicalId === 'apply_patch'
  ) {
    const path =
      typeof entry.args?.path === 'string'
        ? entry.args.path
        : typeof entry.args?.file === 'string'
          ? entry.args.file
          : undefined
    steps.push({
      id: `${entry.id}-file`,
      label: path ?? entry.name,
      status,
      icon: 'file',
    })
  } else {
    steps.push({
      id: `${entry.id}-generic`,
      label: entry.displayName ?? entry.name,
      status,
      icon: 'tool',
    })
  }

  for (const source of entry.sources ?? []) {
    if (steps.some((s) => s.label === source.domain)) continue
    steps.push({
      id: `${entry.id}-src-${source.domain}`,
      label: source.domain,
      status: entry.status === 'running' ? 'running' : 'done',
      icon: 'link',
    })
  }

  return steps
}

export function mergeToolOutput(
  existing: string | undefined,
  partial: unknown,
): string {
  const chunk = formatToolOutput(partial)
  if (!chunk) return existing ?? ''
  if (!existing) return chunk
  if (existing.endsWith(chunk) || chunk.startsWith(existing)) return chunk
  return `${existing}${chunk}`
}
