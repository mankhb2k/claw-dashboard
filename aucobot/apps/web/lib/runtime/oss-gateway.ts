import { GATEWAY_READY_TIMEOUT_MS } from '@/lib/runtime/project-spawn'

export function gatewayTimeoutMessage(): string {
  const sec = GATEWAY_READY_TIMEOUT_MS / 1000
  return `Shared OpenClaw gateway is not ready after ${sec}s. Ensure the gateway container is running on port 18789 (see deploy/docker-compose.gateway.dev.yml).`
}

export const OSS_GATEWAY_DEV_URL = 'http://127.0.0.1:18789'
