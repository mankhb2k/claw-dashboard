export function extractText(message: unknown): string | null {
  if (!message || typeof message !== 'object') return null
  const entry = message as Record<string, unknown>
  if (typeof entry.text === 'string' && entry.text.trim()) {
    return entry.text
  }
  const content = entry.content
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return null
  const parts: string[] = []
  for (const block of content) {
    if (!block || typeof block !== 'object') continue
    const row = block as { type?: unknown; text?: unknown }
    if (row.type === 'text' && typeof row.text === 'string') {
      parts.push(row.text)
    }
  }
  return parts.length > 0 ? parts.join('\n') : null
}

export function roleOf(message: unknown): string {
  if (!message || typeof message !== 'object') return 'unknown'
  const role = (message as { role?: unknown }).role
  return typeof role === 'string' ? role : 'unknown'
}
