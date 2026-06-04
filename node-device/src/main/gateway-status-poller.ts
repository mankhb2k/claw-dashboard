import { spawn } from "node:child_process";
import type { NodeConnectionState } from "../shared/schemas/node-config.schema";
import { toGatewayWsUrl } from "./gateway-url";
import { resolveOpenclawBin } from "./openclaw-bin";

export type GatewayPollConfig = {
  gatewayUrl: string;
  gatewayToken: string;
  displayName?: string;
};

type NodeRow = {
  nodeId?: string;
  displayName?: string;
  connected?: boolean;
  paired?: boolean;
};

type StateListener = (state: NodeConnectionState, detail?: string) => void;

const POLL_MS = 2500;
const CLI_TIMEOUT_MS = 8000;

function matchNode(nodes: NodeRow[], displayName?: string): NodeRow | undefined {
  const trimmed = displayName?.trim();
  if (trimmed) {
    const byName = nodes.find(
      (n) => n.displayName?.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (byName) {
      return byName;
    }
  }

  const connected = nodes.filter((n) => n.connected);
  if (connected.length === 1) {
    return connected[0];
  }

  return undefined;
}

async function runOpenclawJson(args: string[], gatewayToken: string): Promise<unknown> {
  const bin = resolveOpenclawBin();
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      shell: process.platform === "win32",
      env: {
        ...process.env,
        OPENCLAW_GATEWAY_TOKEN: gatewayToken,
      },
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("openclaw CLI timed out"));
    }, CLI_TIMEOUT_MS + 2000);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || `openclaw exited (${code})`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim() || "{}"));
      } catch {
        reject(new Error("openclaw returned invalid JSON"));
      }
    });
  });
}

function isPendingApprovalError(message: string): boolean {
  return /pending approval|pair required|pairing required|metadata change pending/i.test(
    message,
  );
}

async function runOpenclawJsonSafe(
  args: string[],
  gatewayToken: string,
): Promise<{ ok: true; data: unknown } | { ok: false; message: string }> {
  try {
    return { ok: true, data: await runOpenclawJson(args, gatewayToken) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message };
  }
}

async function inferGatewayState(
  config: GatewayPollConfig,
): Promise<{ state: NodeConnectionState; detail?: string }> {
  const wsUrl = toGatewayWsUrl(config.gatewayUrl);
  const common = [
    "--json",
    "--url",
    wsUrl,
    "--token",
    config.gatewayToken,
    "--timeout",
    String(CLI_TIMEOUT_MS),
  ] as const;

  const [statusRes, devicesRes, nodesPendingRes] = await Promise.all([
    runOpenclawJsonSafe(["nodes", "status", ...common], config.gatewayToken),
    runOpenclawJsonSafe(["devices", "list", ...common], config.gatewayToken),
    runOpenclawJsonSafe(["nodes", "pending", ...common], config.gatewayToken),
  ]);

  for (const res of [statusRes, devicesRes, nodesPendingRes]) {
    if (!res.ok && isPendingApprovalError(res.message)) {
      return {
        state: "awaiting_approval",
        detail: "Pending device or node approval on dashboard",
      };
    }
  }

  if (!statusRes.ok) {
    throw new Error(statusRes.message);
  }

  const statusJson = statusRes.data;
  const devicesJson = devicesRes.ok ? devicesRes.data : { pending: [] };
  const nodesPendingJson = nodesPendingRes.ok ? nodesPendingRes.data : [];

  const devicesPending = Array.isArray((devicesJson as { pending?: unknown[] }).pending)
    ? (devicesJson as { pending: unknown[] }).pending
    : [];
  const nodesPending = Array.isArray(nodesPendingJson) ? nodesPendingJson : [];

  if (devicesPending.length > 0 || nodesPending.length > 0) {
    const parts: string[] = [];
    if (devicesPending.length > 0) {
      parts.push(`${devicesPending.length} device`);
    }
    if (nodesPending.length > 0) {
      parts.push(`${nodesPending.length} node`);
    }
    return {
      state: "awaiting_approval",
      detail: `Pending pairing: ${parts.join(", ")} request(s)`,
    };
  }

  const nodes = Array.isArray((statusJson as { nodes?: NodeRow[] }).nodes)
    ? (statusJson as { nodes: NodeRow[] }).nodes
    : [];
  const node = matchNode(nodes, config.displayName);

  if (node?.connected) {
    const label = node.displayName?.trim() || "Node";
    return {
      state: "connected",
      detail: `${label} connected to gateway`,
    };
  }

  if (node?.paired) {
    return {
      state: "connecting",
      detail: "Paired — reconnecting to gateway…",
    };
  }

  return { state: "connecting" };
}

export class GatewayStatusPoller {
  private timer: ReturnType<typeof setInterval> | null = null;
  private active = false;
  private config: GatewayPollConfig | null = null;
  private onState: StateListener | null = null;

  start(config: GatewayPollConfig, onState: StateListener): void {
    this.stop();
    this.active = true;
    this.config = config;
    this.onState = onState;
    void this.poll();
    this.timer = setInterval(() => void this.poll(), POLL_MS);
  }

  stop(): void {
    this.active = false;
    this.config = null;
    this.onState = null;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async poll(): Promise<void> {
    if (!this.active || !this.config || !this.onState) {
      return;
    }

    const config = this.config;
    const onState = this.onState;

    try {
      const result = await inferGatewayState(config);
      if (this.active && this.onState === onState) {
        onState(result.state, result.detail);
      }
    } catch {
      // Transient gateway/CLI errors — keep last known state.
    }
  }
}
