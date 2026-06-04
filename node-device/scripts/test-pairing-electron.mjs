#!/usr/bin/env node
/**
 * Electron main process headless — exercises NodeRunner + GatewayStatusPoller without UI.
 *
 * Usage:
 *   pnpm build
 *   node scripts/test-pairing-electron.mjs --invite nd-inv-XXXX
 *
 * Optional second terminal (approve without dashboard):
 *   node scripts/test-pairing-flow.mjs --approve-only --gateway-url http://127.0.0.1:18789 --gateway-token TOKEN --auto-approve --name electron-headless
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

function parseArgs(argv) {
  const opts = {
    apiUrl: "http://localhost:3001",
    invite: "",
    name: "electron-headless",
    exitOnConnected: true,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--invite" && argv[i + 1]) opts.invite = argv[++i];
    else if (arg === "--api-url" && argv[i + 1]) opts.apiUrl = argv[++i];
    else if (arg === "--name" && argv[i + 1]) opts.name = argv[++i];
    else if (arg === "--no-exit-on-connected") opts.exitOnConnected = false;
  }

  return opts;
}

function printHelp() {
  console.log(`Electron headless pairing test

Options:
  --invite <code>           Pairing invite (required)
  --api-url <url>           AucoBot API (default: http://localhost:3001)
  --name <name>             Display name (default: electron-headless)
  --no-exit-on-connected    Keep process running after connected
  -h, --help

Stdout tags (same as in-app poller):
  [node-device:state] connecting | awaiting_approval | connected
  [node-device:log]   process logs

Approve without dashboard (second terminal, use gateway token from Settings):
  node scripts/test-pairing-flow.mjs --approve-only --gateway-url http://127.0.0.1:18789 --gateway-token <TOKEN> --auto-approve --name electron-headless

Requires: pnpm build
`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.invite) {
    printHelp();
    process.exit(opts.help ? 0 : 1);
  }

  const electron = spawn(
    isWin ? "pnpm.cmd" : "pnpm",
    ["exec", "electron", "."],
    {
      cwd: root,
      stdio: "inherit",
      shell: isWin,
      env: {
        ...process.env,
        NODE_DEVICE_HEADLESS: "1",
        NODE_DEVICE_AUTO_INVITE: opts.invite,
        NODE_DEVICE_API_URL: opts.apiUrl,
        NODE_DEVICE_AUTO_DISPLAY_NAME: opts.name,
        NODE_DEVICE_EXIT_ON_CONNECTED: opts.exitOnConnected ? "1" : "",
      },
    },
  );

  electron.on("exit", (code) => process.exit(code ?? 0));
  process.on("SIGINT", () => {
    electron.kill();
    process.exit(0);
  });
}

main();
