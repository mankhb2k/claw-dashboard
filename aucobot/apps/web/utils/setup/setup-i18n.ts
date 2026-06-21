import { GATEWAY_READY_TIMEOUT_MS } from '@/lib/runtime/project-spawn'

import type { ProjectStatus } from '@/schemas/project.schema'

export const SETUP_ERROR_KEYS = {
  fetchProjects: 'setup.errors.fetchProjects',
  noWorkspace: 'setup.errors.noWorkspace',
  openDashboard: 'setup.errors.openDashboard',
  respawnFailed: 'setup.errors.respawnFailed',
  createWorkspace: 'setup.errors.createWorkspace',
  gatewayTimeout: 'setup.errors.gatewayTimeout',
  spawnTimeout: 'setup.errors.spawnTimeout',
  gatewayUnreachable: 'setup.errors.gatewayUnreachable',
} as const

type SetupTranslate = (
  path: string,
  vars?: Record<string, string>,
) => string

const SETUP_ERROR_KEY_VALUES = new Set<string>(
  Object.values(SETUP_ERROR_KEYS),
)

function timeoutVars(): Record<string, string> {
  return { seconds: String(GATEWAY_READY_TIMEOUT_MS / 1000) }
}

export function localizeSetupMessage(
  message: string | null | undefined,
  t: SetupTranslate,
): string | null {
  const trimmed = message?.trim()
  if (!trimmed) return null

  if (trimmed === SETUP_ERROR_KEYS.gatewayTimeout) {
    return t(SETUP_ERROR_KEYS.gatewayTimeout, timeoutVars())
  }
  if (trimmed === SETUP_ERROR_KEYS.spawnTimeout) {
    return t(SETUP_ERROR_KEYS.spawnTimeout, timeoutVars())
  }
  if (SETUP_ERROR_KEY_VALUES.has(trimmed)) {
    return t(trimmed)
  }
  return trimmed
}

export function statusLabel(
  status: ProjectStatus,
  missing: boolean,
  oss: boolean,
  t: SetupTranslate,
): string {
  if (oss) {
    switch (status) {
      case 'creating':
        return t('setup.status.oss.creating')
      case 'starting':
        return t('setup.status.oss.starting')
      case 'error':
        return t('setup.status.oss.error')
      case 'running':
        return t('setup.status.oss.running')
      default:
        return status
    }
  }

  if (missing) return t('setup.status.cloud.containerMissing')
  switch (status) {
    case 'creating':
      return t('setup.status.cloud.creating')
    case 'starting':
      return t('setup.status.cloud.starting')
    case 'stopping':
      return t('setup.status.cloud.stopping')
    case 'stopped':
      return t('setup.status.cloud.stopped')
    case 'error':
      return t('setup.status.cloud.error')
    case 'running':
      return t('setup.status.cloud.running')
    default:
      return status
  }
}

export function gatewayTimeoutErrorKey(): string {
  return SETUP_ERROR_KEYS.gatewayTimeout
}

export function spawnTimeoutErrorKey(): string {
  return SETUP_ERROR_KEYS.spawnTimeout
}
