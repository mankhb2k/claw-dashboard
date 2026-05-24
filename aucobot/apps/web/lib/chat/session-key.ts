/** Canonical OpenClaw session key for an agent (matches gateway chat events). */
export function sessionKeyForAgent(agentId: string): string {
  const id = agentId.trim().toLowerCase() || 'main'
  return `agent:${id}:main`
}

/** Accept legacy alias `main` when gateway emits `agent:main:main`. */
export function matchesSessionKey(eventKey: string, expected: string): boolean {
  if (eventKey === expected) return true
  if (expected === 'main' && eventKey === 'agent:main:main') return true
  if (expected === 'agent:main:main' && eventKey === 'main') return true
  return false
}
