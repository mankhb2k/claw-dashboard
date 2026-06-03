import { app } from "electron";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
import type { NodeConnectionState } from "../shared/schemas/node-config.schema";

export type NodeRunnerStartOptions = {
  host: string;
  port: number;
  displayName?: string;
  gatewayToken: string;
};

type StateListener = (state: NodeConnectionState, detail?: string) => void;
type LogListener = (line: string) => void;

function resolveOpenclawBin(): string {
  const bin = process.platform === "win32" ? "openclaw.cmd" : "openclaw";
  return path.join(app.getAppPath(), "node_modules", ".bin", bin);
}

function redactSecrets(line: string, token: string): string {
  if (!token) return line;
  return line.split(token).join("***");
}

function inferState(line: string): NodeConnectionState | null {
  const lower = line.toLowerCase();
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
    lower.includes("rejected")
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

  private setState(next: NodeConnectionState, detail?: string): void {
    if (this.state === next) return;
    this.state = next;
    this.onState(next, detail);
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
          this.setState(inferred, trimmed);
        }
      }
    };

    this.child.stdout.on("data", pushLine);
    this.child.stderr.on("data", pushLine);

    this.child.on("close", (code) => {
      this.child = null;
      this.token = "";
      if (code !== 0 && code !== null) {
        this.setState("error", `Process exited (${code})`);
      } else {
        this.setState("idle");
      }
    });

    this.child.on("error", (err) => {
      this.onLog(`Spawn error: ${err.message}`);
      this.setState("error", err.message);
    });

    return { ok: true };
  }

  stop(): void {
    if (!this.child) {
      this.setState("idle");
      return;
    }
    this.child.kill();
    this.child = null;
    this.token = "";
    this.setState("idle");
  }
}
