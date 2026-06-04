import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import type { NodeConnectionState } from "../shared/schemas/node-config.schema";
import { GatewayStatusPoller } from "./gateway-status-poller";
import { resolveOpenclawBin } from "./openclaw-bin";

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
    lower.includes("pair required")
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
    const bin = resolveOpenclawBin();
    return new Promise((resolve) => {
      const probe = spawn(bin, ["--version"], {
        shell: process.platform === "win32",
        env: process.env,
      });
      let out = "";
      probe.stdout.on("data", (chunk: Buffer) => {
        out += chunk.toString();
      });
      probe.on("error", () => {
        resolve({
          ok: false,
          message: "OpenClaw CLI not found. Reinstall the app or run pnpm install.",
        });
      });
      probe.on("close", (code) => {
        if (code === 0) {
          resolve({ ok: true });
          return;
        }
        resolve({
          ok: false,
          message: out.trim() || "OpenClaw CLI failed to run.",
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

    const bin = resolveOpenclawBin();
    const args = [
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
    if (opts.port === 443 || opts.port === 80) {
      /* default ports — CLI uses explicit --port */
    }

    this.token = opts.gatewayToken;
    this.setState("connecting");

    this.child = spawn(bin, args, {
      shell: process.platform === "win32",
      env: {
        ...process.env,
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
      this.stopStatusPolling();
      this.child = null;
      this.token = "";
      if (code !== 0 && code !== null) {
        this.setState("error", `Process exited (${code})`, true);
      } else {
        this.setState("idle", undefined, true);
      }
    });

    this.child.on("error", (err) => {
      this.stopStatusPolling();
      this.onLog(`Spawn error: ${err.message}`);
      this.setState("error", err.message, true);
    });

    this.startStatusPolling(opts);

    return { ok: true };
  }

  stop(): void {
    this.stopStatusPolling();
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
