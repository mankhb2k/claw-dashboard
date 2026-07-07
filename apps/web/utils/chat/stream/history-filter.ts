const HIDDEN_HISTORY_ROLES = new Set(['tool', 'toolresult', 'system'])

const EXTERNAL_CONTENT_MARKER = '<<<EXTERNAL_UNTRUSTED_CONTENT'

const TOOL_JSON_HEAD_RE =
  /"query"\s*:|"provider"\s*:|"results"\s*:|"tookMs"\s*:|"toolCallId"\s*:|"tool_call_id"\s*:/

function findJsonCandidate(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) return trimmed
  const start = trimmed.indexOf('{')
  if (start === -1) return trimmed
  return trimmed.slice(start)
}

function looksLikeToolJsonObject(parsed: Record<string, unknown>): boolean {
  if (typeof parsed.query === 'string') {
    return (
      typeof parsed.provider === 'string' ||
      Array.isArray(parsed.results) ||
      typeof parsed.tookMs === 'number' ||
      typeof parsed.count === 'number'
    )
  }
  if (typeof parsed.provider === 'string' && Array.isArray(parsed.results)) {
    return true
  }
  if (typeof parsed.toolCallId === 'string' || typeof parsed.tool_call_id === 'string') {
    return true
  }
  if (typeof parsed.name === 'string' && parsed.args != null) {
    return true
  }
  return false
}

function looksLikeWebSearchJson(text: string): boolean {
  const candidate = findJsonCandidate(text)
  if (!candidate.startsWith('{')) return false

  const head = candidate.slice(0, 800)
  if (!TOOL_JSON_HEAD_RE.test(head)) return false

  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return false
    }
    return looksLikeToolJsonObject(parsed)
  } catch {
    return TOOL_JSON_HEAD_RE.test(head)
  }
}

export function isHiddenToolPayloadText(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (trimmed.includes(EXTERNAL_CONTENT_MARKER)) return true

  if (looksLikeWebSearchJson(trimmed)) return true

  // Large JSON-ish blobs (tool output pasted as plain text)
  if (trimmed.startsWith('{') && trimmed.length > 200 && TOOL_JSON_HEAD_RE.test(trimmed.slice(0, 800))) {
    return true
  }

  return false
}

export function isOrphanStreamFragment(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length > 120) return false
  if (/^\)\s*[-–—]/.test(trimmed)) return true
  if (/^[-–—•]\s*$/.test(trimmed)) return true
  if (/^[\s).,;:\-–—•]+\S{0,40}$/.test(trimmed) && !trimmed.includes('\n')) {
    return true
  }
  return false
}

export function shouldShowHistoryMessage(role: string, text: string): boolean {
  const normalizedRole = role.toLowerCase()
  if (HIDDEN_HISTORY_ROLES.has(normalizedRole)) return false
  if (normalizedRole === 'user') return true
  if (isOrphanStreamFragment(text)) return false
  return !isHiddenToolPayloadText(text)
}

export function isVisibleChatBubbleText(role: string, text: string): boolean {
  return shouldShowHistoryMessage(role, text)
}
