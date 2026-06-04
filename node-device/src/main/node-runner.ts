import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import type { NodeConnectionState } from "../shared/schemas/node-config.schema";
import {
  fetchGatewayConnectionState,
  GatewayStatusPoller,
} from "./gateway-status-poller";
import {
  buildOpenclawChildEnv,
  formatOpenclawNodeRequirementError,
  resolveOpenclawSpawn,
} from "./openclaw-bin";

export type NodeRunnerStartOptions = {
  host: string;
  port: number;
  displayName?: string;
  gatewayToken: string;
  gatewayUrl?: string;
};

type StateListener = (state: NodeConnectionState, detail?: string) => void;
type LogListener = (line: string) => void;

function redactSecrets(line: string, token: string): string {
  if (!token) return line;
  return line.split(token).join("***");
}

function inferState(line: string): NodeConnectionState | null {
  const lower = line.toLowerCase();
  if (
    lower.includes("reconnect paused") &&
    lower.includes("waiting for operator")
  ) {
    return "awaiting_approval";
  }
  if (
    lower.includes("pairing") ||
    lower.includes("pending approval") ||
    lower.includes("awaiting approval") ||
    lower.includes("pair required") ||
    lower.includes("role upgrade") ||
    lower.includes("identity changed") ||
    lower.includes("metadata change")
  ) {
    return "awaiting_approval";
  }
  if (
    lower.includes("connected") ||
    lower.includes("paired") ||
    lower.includes("hello-ok")
  ) {
    return "connected";
  }
  if (
    lower.includes("error") ||
    lower.includes("failed") ||
    lower.includes("unauthorized") ||
    lower.includes("rejected") ||
    lower.includes("connect failed")
  ) {
    return "error";
  }
  if (lower.includes("connecting") || lower.includes("starting")) {
    return "connecting";
  }
  return null;
}

export class NodeRunner {
  private child: ChildProcessWithoutNullStreams | null = null;
  private state: NodeConnectionState = "idle";
  private token = "";
  private lastStartOpts: NodeRunnerStartOptions | null = null;
  private readonly poller = new GatewayStatusPoller();

  constructor(
    private readonly onState: StateListener,
    private readonly onLog: LogListener,
  ) {}

  getState(): NodeConnectionState {
    return this.state;
  }

  isRunning(): boolean {
    return this.child !== null;
  }

  private setState(next: NodeConnectionState, detail?: string, force = false): void {
    if (!force && this.state === next && !detail) {
      return;
    }
    if (!force && this.state === next) {
      this.onState(next, detail);
      return;
    }
    this.state = next;
    this.onState(next, detail);
  }

  private applyPolledState(next: NodeConnectionState, detail?: string): void {
    if (this.state === "error" || !this.child) {
      return;
    }
    this.setState(next, detail, true);
  }

  private startStatusPolling(opts: NodeRunnerStartOptions): void {
    if (!opts.gatewayUrl) {
      return;
    }
    this.poller.start(
      {
        gatewayUrl: opts.gatewayUrl,
        gatewayToken: opts.gatewayToken,
        displayName: opts.displayName,
      },
      (state, detail) => this.applyPolledState(state, detail),
    );
  }

  private stopStatusPolling(): void {
    this.poller.stop();
  }

  async checkCli(): Promise<{ ok: boolean; message?: string }> {
    let spawnConfig: ReturnType<typeof resolveOpenclawSpawn>;
    try {
      spawnConfig = resolveOpenclawSpawn();
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "OpenClaw chưa được cài trong app.",
      };
    }

    const { command, prefixArgs, useShell } = spawnConfig;
    return new Promise((resolve) => {
      const probe = spawn(command, [...prefixArgs, "--version"], {
        shell: useShell,
        env: buildOpenclawChildEnv(command),
      });
      let stdout = "";
      let stderr = "";
      probe.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      probe.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      probe.on("error", () => {
        resolve({
          ok: false,
          message:
            "Không chạy được OpenClaw CLI. Chạy `pnpm install` trong node-device hoặc cài lại app.",
        });
      });
      probe.on("close", (code) => {
        if (code === 0) {
          resolve({ ok: true });
          return;
        }
        const combined = `${stderr}\n${stdout}`.trim();
        const needsNode =
          /Node\.js v22\.19|openclaw: Node/i.test(combined) ||
          command === process.execPath;
        resolve({
          ok: false,
          message: needsNode
            ? formatOpenclawNodeRequirementError()
            : combined || "OpenClaw CLI failed to run.",
        });
      });
    });
  }

  async start(opts: NodeRunnerStartOptions): Promise<{ ok: boolean; message?: string }> {
    if (this.child) {
      return { ok: false, message: "Node is already running." };
    }

    const cliCheck = await this.checkCli();
    if (!cliCheck.ok) {
      this.setState("error", cliCheck.message);
      return cliCheck;
    }

    const { command, prefixArgs, useShell } = resolveOpenclawSpawn();
    const args = [
      ...prefixArgs,
      "node",
      "run",
      "--host",
      opts.host,
      "--port",
      String(opts.port),
    ];
    if (opts.displayName?.trim()) {
      args.push("--display-name", opts.displayName.trim());
    }

    this.token = opts.gatewayToken;
    this.lastStartOpts = opts;
    this.setState("connecting");

    this.child = spawn(command, args, {
      shell: useShell,
      env: {
        ...buildOpenclawChildEnv(command),
        OPENCLAW_GATEWAY_TOKEN: opts.gatewayToken,
      },
    });

    const pushLine = (chunk: Buffer) => {
      const text = chunk.toString();
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        this.onLog(redactSecrets(trimmed, this.token));
        const inferred = inferState(trimmed);
        if (inferred) {
          if (inferred === "error") {
            this.stopStatusPolling();
          }
          this.setState(inferred, trimmed, inferred === "error");
        }
      }
    };

    this.child.stdout.on("data", pushLine);
    this.child.stderr.on("data", pushLine);

    this.child.on("close", (code) => {
      this.child = null;
      this.token = "";
      void this.handleProcessExit(code);
    });

    this.child.on("error", (err) => {
      this.stopStatusPolling();
      this.onLog(`Spawn error: ${err.message}`);
      this.setState("error", err.message, true);
    });

    this.startStatusPolling(opts);

    return { ok: true };
  }

  private async handleProcessExit(code: number | null): Promise<void> {
    if (code === 0 || code === null) {
      this.stopStatusPolling();
      this.lastStartOpts = null;
      this.setState("idle", undefined, true);
      return;
    }

    const opts = this.lastStartOpts;
    if (opts?.gatewayUrl && opts.gatewayToken) {
      try {
        const result = await fetchGatewayConnectionState({
          gatewayUrl: opts.gatewayUrl,
          gatewayToken: opts.gatewayToken,
          displayName: opts.displayName,
        });
        if (result.state === "awaiting_approval") {
          this.setState(
            "awaiting_approval",
            result.detail ?? "Chờ duyệt trên Companion Nodes",
            true,
          );
          return;
        }
        if (result.state === "connected") {
          this.stopStatusPolling();
          this.setState("connected", result.detail, true);
          return;
        }
        if (result.state === "connecting") {
          this.setState("connecting", result.detail, true);
          return;
        }
      } catch {
        // Fall through to error below.
      }
    }

    this.stopStatusPolling();
    this.setState("error", `Process exited (${code})`, true);
  }

  stop(): void {
    this.stopStatusPolling();
    this.lastStartOpts = null;
    if (!this.child) {
      this.setState("idle", undefined, true);
      return;
    }
    this.child.kill();
    this.child = null;
    this.token = "";
    this.setState("idle", undefined, true);
  }
}
