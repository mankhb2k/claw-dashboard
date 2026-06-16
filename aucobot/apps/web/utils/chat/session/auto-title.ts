import type { GatewaySessionRow } from './types'
import { isPlaceholderSessionLabel } from './display'

export const AUTO_TITLE_MAX_LENGTH = 48

export function deriveAutoTitleFromMessage(text: string, maxLen = AUTO_TITLE_MAX_LENGTH): string {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  if (!oneLine) return ''
  if (oneLine.length <= maxLen) return oneLine
  return `${oneLine.slice(0, maxLen - 1).trimEnd()}…`
}

/** Dashboard sessions without a custom label are candidates for auto-title. */
export function isAutoTitleCandidate(key: string, row?: GatewaySessionRow): boolean {
  const label = row?.label?.trim() ?? ''
  if (label && label !== key && !isPlaceholderSessionLabel(label)) return false

  const displayName = row?.displayName?.trim() ?? ''
  if (
    displayName &&
    displayName !== key &&
    !isPlaceholderSessionLabel(displayName)
  ) {
    return false
  }

  return /^agent:[^:]+:dashboard:/i.test(key.trim())
}
