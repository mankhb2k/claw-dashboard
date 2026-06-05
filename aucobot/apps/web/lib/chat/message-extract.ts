/** Unwrap transcript entries (`{ type: "message", message: { role, content } }`). */
function normalizeHistoryMessage(message: unknown): Record<string, unknown> | null {
  if (!message || typeof message !== 'object') return null
  const entry = message as Record<string, unknown>
  if (entry.message && typeof entry.message === 'object') {
    return entry.message as Record<string, unknown>
  }
  return entry
}

export function extractText(message: unknown): string | null {
  const entry = normalizeHistoryMessage(message)
  if (!entry) return null

  if (typeof entry.text === 'string' && entry.text.trim()) {
    return entry.text
  }

  const content = entry.content
  if (typeof content === 'string' && content.trim()) return content
  if (!Array.isArray(content)) return null

  const parts: string[] = []
  for (const block of content) {
    if (!block || typeof block !== 'object') continue
    const row = block as { type?: unknown; text?: unknown; thinking?: unknown }
    const type = typeof row.type === 'string' ? row.type.toLowerCase() : ''
    if (type === 'thinking') continue
    if (type === 'text' && typeof row.text === 'string' && row.text.trim()) {
      parts.push(row.text)
    }
  }
  return parts.length > 0 ? parts.join('\n') : null
}

export function roleOf(message: unknown): string {
  const entry = normalizeHistoryMessage(message)
  if (!entry) return 'unknown'
  const role = entry.role
  return typeof role === 'string' ? role : 'unknown'
}

export function stableMessageId(message: unknown, index: number): string {
  const entry = normalizeHistoryMessage(message)
  const meta = entry?.__openclaw as { id?: unknown } | undefined
  if (typeof meta?.id === 'string' && meta.id.trim()) {
    return meta.id.trim()
  }
  const role = roleOf(message)
  return `m-${index}-${role}`
}
