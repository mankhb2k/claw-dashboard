const SECRET_PATTERNS: RegExp[] = [
  /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /\b(sk-[A-Za-z0-9]{8,})\b/gi,
  /\b(api[_-]?key\s*[:=]\s*)["']?[A-Za-z0-9\-._~+/]{8,}["']?/gi,
  /\b(xox[baprs]-[A-Za-z0-9\-]{10,})\b/gi,
  /\b(ghp_[A-Za-z0-9]{20,})\b/gi,
  /\b(AIza[0-9A-Za-z\-_]{20,})\b/g,
  /\b(eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)\b/g,
  /\b(password\s*[:=]\s*)["']?[^\s"']{4,}["']?/gi,
  /\b(token\s*[:=]\s*)["']?[A-Za-z0-9\-._~+/]{8,}["']?/gi,
]

export const REDACTED = '[redacted]'

export function redactSensitiveText(text: string): string {
  if (!text) return text
  let result = text
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, (match, group1?: string) => {
      if (group1 && typeof group1 === 'string' && group1.length > 0) {
        return `${group1}${REDACTED}`
      }
      return REDACTED
    })
  }
  return result
}

export function redactObject(value: unknown): unknown {
  if (typeof value === 'string') return redactSensitiveText(value)
  if (Array.isArray(value)) return value.map(redactObject)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase()
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('apikey') ||
        lowerKey === 'authorization'
      ) {
        out[key] = REDACTED
      } else {
        out[key] = redactObject(val)
      }
    }
    return out
  }
  return value
}
