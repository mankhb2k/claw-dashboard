import { GATEWAY_READY_TIMEOUT_MS } from '@/lib/runtime/project-spawn'
import { gatewayTimeoutErrorKey } from '@/utils/setup/setup-i18n'

export const OSS_GATEWAY_DEV_URL = 'http://127.0.0.1:18789'

/** @deprecated Use gatewayTimeoutErrorKey() + localizeSetupMessage() in UI */
export function gatewayTimeoutMessage(): string {
  return gatewayTimeoutErrorKey()
}

export { GATEWAY_READY_TIMEOUT_MS }
