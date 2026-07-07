export type GatewayHealthLogger = {
  log?(message: string): void;
};

function spawnTimeoutMs(): number {
  const n = Number(process.env.OPENCLAW_SPAWN_TIMEOUT_MS ?? 60_000);
  return Math.max(15_000, Number.isFinite(n) ? n : 60_000);
}

function healthPollIntervalMs(): number {
  const n = Number(process.env.OPENCLAW_HEALTH_INTERVAL_MS ?? 2000);
  return Math.max(500, Number.isFinite(n) ? n : 2000);
}

function healthFetchTimeoutMs(): number {
  const n = Number(process.env.OPENCLAW_HEALTH_FETCH_TIMEOUT_MS ?? 3000);
  return Math.max(1000, Number.isFinite(n) ? n : 3000);
}

/** Poll GET {httpBaseUrl}/healthz until ok or timeout. */
export async function waitForGatewayHealth(
  httpBaseUrl: string,
  log?: GatewayHealthLogger,
): Promise<void> {
  const timeoutMs = spawnTimeoutMs();
  const intervalMs = healthPollIntervalMs();
  const fetchTimeoutMs = healthFetchTimeoutMs();
  const base = httpBaseUrl.replace(/\/$/, '');
  const url = `${base}/healthz`;
  const deadline = Date.now() + timeoutMs;
  let attempt = 0;

  log?.log?.(`Waiting for gateway ${url} (timeout ${Math.round(timeoutMs / 1000)}s)`);

  while (Date.now() < deadline) {
    attempt += 1;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(fetchTimeoutMs) });
      if (res.ok) {
        log?.log?.(`Gateway ready at ${url} (attempt ${attempt})`);
        return;
      }
    } catch {
      /* retry until deadline */
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  const sec = Math.round(timeoutMs / 1000);
  throw new Error(
    `Gateway not healthy at ${url} after ${sec}s. Ensure the OpenClaw gateway container is running (port 18789) and OPENCLAW_GATEWAY_URL matches.`,
  );
}
