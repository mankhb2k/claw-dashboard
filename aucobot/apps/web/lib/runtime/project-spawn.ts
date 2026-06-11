/** Thời gian chờ gateway /healthz sau khi container start (khớp backend OPENCLAW_SPAWN_TIMEOUT_MS). */
export const GATEWAY_READY_TIMEOUT_MS = 60_000

/** HTTP spawn/respawn — có thể kéo dài lần đầu (pull image). */
export const SPAWN_API_TIMEOUT_MS = 180_000

export function spawnTimeoutMessage(): string {
  return `Gateway OpenClaw không sẵn sàng sau ${GATEWAY_READY_TIMEOUT_MS / 1000} giây. Kiểm tra Docker Desktop đang chạy và thử Spawn lại.`
}
