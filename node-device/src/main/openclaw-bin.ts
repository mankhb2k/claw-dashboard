import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { app } from "electron";
import path from "node:path";

const MIN_NODE_MAJOR = 22;
const MIN_NODE_MINOR = 19;

export type OpenclawSpawn = {
  command: string;
  /** Args before openclaw subcommand, e.g. [path/to/openclaw.mjs] */
  prefixArgs: string[];
  useShell: boolean;
};

function parseNodeVersion(raw: string): { major: number; minor: number } {
  const match = raw.trim().replace(/^v/, "").match(/^(\d+)\.(\d+)/);
  return {
    major: Number(match?.[1] ?? 0),
    minor: Number(match?.[2] ?? 0),
  };
}

function isSupportedNodeVersion(raw: string): boolean {
  const { major, minor } = parseNodeVersion(raw);
  return (
    major > MIN_NODE_MAJOR ||
    (major === MIN_NODE_MAJOR && minor >= MIN_NODE_MINOR)
  );
}

function probeNodeVersion(
  command: string,
  extraEnv?: NodeJS.ProcessEnv,
): string | null {
  try {
    const result = spawnSync(command, ["-v"], {
      env: { ...process.env, ...extraEnv },
      encoding: "utf8",
      timeout: 8000,
      windowsHide: true,
    });
    const out = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    const match = out.match(/v?(\d+\.\d+\.\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function resolveSystemNode(): { command: string; version: string } | null {
  const candidates: string[] = [];
  if (process.env.OPENCLAW_NODE?.trim()) {
    candidates.push(process.env.OPENCLAW_NODE.trim());
  }
  candidates.push(process.platform === "win32" ? "node.exe" : "node");

  for (const command of candidates) {
    const version = probeNodeVersion(command);
    if (version && isSupportedNodeVersion(version)) {
      return { command, version };
    }
  }
  return null;
}

export function openclawMjsPath(): string {
  return path.join(app.getAppPath(), "node_modules", "openclaw", "openclaw.mjs");
}

/** Env for child processes spawned to run openclaw.mjs */
export function buildOpenclawChildEnv(command: string): NodeJS.ProcessEnv {
  const env = { ...process.env };
  if (command === process.execPath) {
    env.ELECTRON_RUN_AS_NODE = "1";
  }
  return env;
}

export function formatOpenclawNodeRequirementError(): string {
  const electronVersion =
    probeNodeVersion(process.execPath, { ELECTRON_RUN_AS_NODE: "1" }) ??
    "unknown";
  const systemVersion = probeNodeVersion(
    process.platform === "win32" ? "node.exe" : "node",
  );

  if (systemVersion && !isSupportedNodeVersion(systemVersion)) {
    return (
      `OpenClaw cần Node.js ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}+ (máy đang có v${systemVersion}). ` +
      "Cài Node 22 LTS mới từ https://nodejs.org rồi mở lại app."
    );
  }

  return (
    `OpenClaw cần Node.js ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}+. ` +
    `Electron trong app chỉ có v${electronVersion}. ` +
    "Cài Node 22+ trên máy (https://nodejs.org) hoặc đặt biến môi trường OPENCLAW_NODE trỏ tới node.exe, rồi khởi động lại AucoBot Node."
  );
}

/**
 * Spawn OpenClaw CLI via Node + openclaw.mjs.
 * Prefers system Node (22.19+) because Electron's embedded Node is often older.
 */
export function resolveOpenclawSpawn(): OpenclawSpawn {
  const mjs = openclawMjsPath();
  if (!existsSync(mjs)) {
    throw new Error(
      "Gói OpenClaw không có trong app. Chạy pnpm install trong thư mục node-device.",
    );
  }

  const system = resolveSystemNode();
  if (system) {
    return {
      command: system.command,
      prefixArgs: [mjs],
      useShell: false,
    };
  }

  const electronVersion = probeNodeVersion(process.execPath, {
    ELECTRON_RUN_AS_NODE: "1",
  });
  if (electronVersion && isSupportedNodeVersion(electronVersion)) {
    return {
      command: process.execPath,
      prefixArgs: [mjs],
      useShell: false,
    };
  }

  return {
    command: process.execPath,
    prefixArgs: [mjs],
    useShell: false,
  };
}

/** @deprecated Prefer resolveOpenclawSpawn in Electron main process */
export function resolveOpenclawBin(): string {
  const bin = process.platform === "win32" ? "openclaw.cmd" : "openclaw";
  return path.join(app.getAppPath(), "node_modules", ".bin", bin);
}
