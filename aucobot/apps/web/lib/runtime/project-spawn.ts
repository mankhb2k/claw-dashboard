import { spawnTimeoutErrorKey } from '@/utils/setup/setup-i18n'

/** Gateway /healthz wait after container start (matches backend OPENCLAW_SPAWN_TIMEOUT_MS). */
export const GATEWAY_READY_TIMEOUT_MS = 60_000;

/** HTTP spawn/respawn — may take longer on first run (image pull). */
export const SPAWN_API_TIMEOUT_MS = 180_000;

/** @deprecated Use spawnTimeoutErrorKey() + localizeSetupMessage() in UI */
export function spawnTimeoutMessage(): string {
  return spawnTimeoutErrorKey()
}
