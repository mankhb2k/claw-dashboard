#!/usr/bin/env node
/**
 * Headless invite pairing test — no Electron UI.
 * Exercises the same steps as the app: redeem → node run → gateway status poll.
 *
 * Usage:
 *   node scripts/test-pairing-flow.mjs --invite nd-inv-XXXX --api-url http://localhost:3001
 *   node scripts/test-pairing-flow.mjs --invite nd-inv-XXXX --auto-approve --name demo
 *
 * Prerequisites:
 *   - aucobot API + gateway running (pnpm dev:runtime + pnpm dev in aucobot/)
 *   - Fresh invite from Companion Nodes (one-time use)
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const openclawMjs = path.join(root, "node_modules", "openclaw", "openclaw.mjs");

function spawnOpenclaw(cliArgs, options) {
  return spawn(process.execPath, [openclawMjs, ...cliArgs], {
    shell: false,
    cwd: root,
    ...options,
  });
}

const POLL_MS = 2500;
const CLI_TIMEOUT_MS = 8000;

function parseArgs(argv) {
  const opts = {
    apiUrl: "http://localhost:3000",
    invite: "",
    name: "cli-test",
    autoApprove: false,
    approveOnly: false,
    gatewayUrl: "",
    gatewayToken: "",
    adminUser: "admin",
    adminPassword: "admin123",
    projectId: "",
    timeoutSec: 120,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else if (arg === "--invite" && argv[i + 1]) {
      opts.invite = argv[++i];
    } else if (arg === "--api-url" && argv[i + 1]) {
      opts.apiUrl = argv[++i];
    } else if (arg === "--name" && argv[i + 1]) {
      opts.name = argv[++i];
    } else if (arg === "--gateway-url" && argv[i + 1]) {
      opts.gatewayUrl = argv[++i];
    } else if (arg === "--gateway-token" && argv[i + 1]) {
      opts.gatewayToken = argv[++i];
    } else if (arg === "--project-id" && argv[i + 1]) {
      opts.projectId = argv[++i];
    } else if (arg === "--admin-user" && argv[i + 1]) {
      opts.adminUser = argv[++i];
    } else if (arg === "--admin-password" && argv[i + 1]) {
      opts.adminPassword = argv[++i];
    } else if (arg === "--auto-approve") {
      opts.autoApprove = true;
    } else if (arg === "--approve-only") {
      opts.approveOnly = true;
    } else if (arg === "--timeout" && argv[i + 1]) {
      opts.timeoutSec = Number.parseInt(argv[++i], 10);
    }
  }

  return opts;
}

function printHelp() {
  console.log(`Headless pairing flow test (no Electron UI)

Options:
  --invite <code>         Pairing invite (required unless --approve-only)
  --api-url <url>         AucoBot web base for redeem (default: http://localhost:3000)
  --name <displayName>    Node display name (default: cli-test)
  --auto-approve          Approve device + node via openclaw CLI
  --approve-only          Skip redeem/node run; only poll + approve (needs --gateway-url + --gateway-token)
  --gateway-url <url>     Gateway HTTP URL (for --approve-only)
  --gateway-token <token> Gateway token (for --approve-only)
  --timeout <sec>         Max wait for connected (default: 120)
  -h, --help              Show this help

Examples:
  # Full flow + auto approve (no Electron, no dashboard)
  node scripts/test-pairing-flow.mjs --invite nd-inv-ABC --auto-approve --name demo

  # Approve only while Electron headless runs in another terminal
  node scripts/test-pairing-flow.mjs --approve-only --gateway-url http://127.0.0.1:18789 --gateway-token TOKEN --auto-approve --name demo
`);
}

function toWsUrl(gatewayUrl) {
  const url = new URL(
    gatewayUrl.trim().replace(/^wss/i, "https").replace(/^ws/i, "http"),
  );
  const useTls = url.protocol === "https:";
  const port =
    url.port !== ""
      ? Number.parseInt(url.port, 10)
      : useTls
        ? 443
        : 80;
  const defaultPort = useTls ? 443 : 80;
  const portSuffix = port !== defaultPort ? `:${port}` : "";
  return `${useTls ? "wss" : "ws"}://${url.hostname}${portSuffix}`;
}

function parseHostPort(gatewayUrl) {
  const url = new URL(
    gatewayUrl.trim().replace(/^wss/i, "https").replace(/^ws/i, "http"),
  );
  const useTls = url.protocol === "https:";
  const port =
    url.port !== ""
      ? Number.parseInt(url.port, 10)
      : useTls
        ? 443
        : 80;
  return { host: url.hostname, port };
}

async function redeemInvite(apiBaseUrl, code) {
  const base = apiBaseUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/api/nodes/invites/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: code.trim() }),
  });
  const json = await res.json();
  if (!res.ok || !json.success || !json.data) {
    const message =
      (typeof json.error === "object" && json.error?.message) ||
      (typeof json.error === "string" && json.error) ||
      `HTTP ${res.status}`;
    throw new Error(`Redeem failed: ${message}`);
  }
  return json.data;
}

function runOpenclawJson(args, gatewayToken) {
  return new Promise((resolve, reject) => {
    const child = spawnOpenclaw(args, {
      env: { ...process.env, OPENCLAW_GATEWAY_TOKEN: gatewayToken },
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("openclaw CLI timed out"));
    }, CLI_TIMEOUT_MS + 2000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || `exit ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim() || "{}"));
      } catch {
        reject(new Error("invalid JSON from openclaw"));
      }
    });
  });
}

function cliCommon(wsUrl, gatewayToken) {
  return ["--json", "--url", wsUrl, "--token", gatewayToken, "--timeout", String(CLI_TIMEOUT_MS)];
}

function isPendingApprovalError(message) {
  return /pending approval|pair required|pairing required|metadata change pending/i.test(
    message,
  );
}

async function runOpenclawJsonSafe(args, gatewayToken) {
  try {
    return { ok: true, data: await runOpenclawJson(args, gatewayToken) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message };
  }
}

async function loginAndGetCookie(apiUrl, username, password) {
  const base = apiUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new Error(`API login failed (HTTP ${res.status})`);
  }

  const setCookies = typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : [];
  if (setCookies.length > 0) {
    return setCookies.map((row) => row.split(";")[0]).join("; ");
  }

  const raw = res.headers.get("set-cookie");
  if (!raw) {
    throw new Error("API login did not return auth cookies");
  }
  return raw
    .split(/,(?=\s*[^;]+=)/)
    .map((row) => row.split(";")[0].trim())
    .join("; ");
}

async function approveViaApi(apiUrl, projectId, username, password) {
  const cookie = await loginAndGetCookie(apiUrl, username, password);
  const base = apiUrl.replace(/\/$/, "");
  const pairingRes = await fetch(`${base}/api/projects/${projectId}/nodes/pairing`, {
    headers: { Cookie: cookie },
  });
  const pairing = await pairingRes.json();
  if (!pairingRes.ok || !pairing.success) {
    throw new Error("Could not load pairing state from API");
  }

  const devicePending = pairing.data?.devices?.pending ?? [];
  const nodePending = pairing.data?.nodes?.pending ?? [];

  for (const req of devicePending) {
    const requestId = req.requestId;
    if (!requestId) continue;
    console.log(`[approve:api] device ${requestId}`);
    await fetch(`${base}/api/projects/${projectId}/nodes/devices/${requestId}/approve`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
  }

  for (const req of nodePending) {
    const requestId = req.requestId;
    if (!requestId) continue;
    console.log(`[approve:api] node ${requestId}`);
    await fetch(`${base}/api/projects/${projectId}/nodes/pairing/${requestId}/approve`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
  }
}

async function autoApprovePending(opts, gatewayUrl, gatewayToken) {
  if (opts.projectId && opts.apiUrl) {
    try {
      await approveViaApi(
        opts.apiUrl,
        opts.projectId,
        opts.adminUser,
        opts.adminPassword,
      );
      return;
    } catch (err) {
      console.log(`[approve:api] ${err instanceof Error ? err.message : err}`);
    }
  }

  await approveAllPending(gatewayUrl, gatewayToken);
}

function matchNode(nodes, displayName) {
  const trimmed = displayName?.trim();
  if (trimmed) {
    const byName = nodes.find(
      (n) => n.displayName?.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (byName) return byName;
  }
  const connected = nodes.filter((n) => n.connected);
  if (connected.length === 1) return connected[0];
  return undefined;
}

async function inferGatewayState(gatewayUrl, gatewayToken, displayName) {
  const wsUrl = toWsUrl(gatewayUrl);
  const common = cliCommon(wsUrl, gatewayToken);

  const [statusRes, devicesRes, nodesPendingRes] = await Promise.all([
    runOpenclawJsonSafe(["nodes", "status", ...common], gatewayToken),
    runOpenclawJsonSafe(["devices", "list", ...common], gatewayToken),
    runOpenclawJsonSafe(["nodes", "pending", ...common], gatewayToken),
  ]);

  for (const res of [statusRes, devicesRes, nodesPendingRes]) {
    if (!res.ok && isPendingApprovalError(res.message)) {
      return {
        state: "awaiting_approval",
        detail: "Gateway pairing pending approval",
      };
    }
  }

  if (!statusRes.ok) {
    throw new Error(statusRes.message);
  }

  const statusJson = statusRes.data;
  const devicesJson = devicesRes.ok ? devicesRes.data : { pending: [] };
  const nodesPendingJson = nodesPendingRes.ok ? nodesPendingRes.data : [];

  const devicesPending = Array.isArray(devicesJson.pending) ? devicesJson.pending : [];
  const nodesPending = Array.isArray(nodesPendingJson) ? nodesPendingJson : [];

  if (devicesPending.length > 0 || nodesPending.length > 0) {
    const parts = [];
    if (devicesPending.length > 0) parts.push(`${devicesPending.length} device`);
    if (nodesPending.length > 0) parts.push(`${nodesPending.length} node`);
    return {
      state: "awaiting_approval",
      detail: `Pending pairing: ${parts.join(", ")} request(s)`,
    };
  }

  const nodes = Array.isArray(statusJson.nodes) ? statusJson.nodes : [];
  const node = matchNode(nodes, displayName);

  if (node?.connected) {
    return {
      state: "connected",
      detail: `${node.displayName?.trim() || "Node"} connected to gateway`,
    };
  }

  if (node?.paired) {
    return { state: "connecting", detail: "Paired — reconnecting…" };
  }

  return { state: "connecting", detail: "Waiting for gateway…" };
}

async function approveAllPending(gatewayUrl, gatewayToken) {
  const wsUrl = toWsUrl(gatewayUrl);
  const common = cliCommon(wsUrl, gatewayToken);

  const devices = await runOpenclawJson(["devices", "list", ...common], gatewayToken);
  for (const req of devices.pending ?? []) {
    const requestId = req.requestId;
    if (!requestId) continue;
    console.log(`[approve] device ${requestId}`);
    await runOpenclawJson(["devices", "approve", requestId, ...common], gatewayToken);
  }

  const nodesPending = await runOpenclawJson(["nodes", "pending", ...common], gatewayToken);
  for (const req of Array.isArray(nodesPending) ? nodesPending : []) {
    const requestId = req.requestId;
    if (!requestId) continue;
    console.log(`[approve] node ${requestId}`);
    await runOpenclawJson(["nodes", "approve", requestId, ...common], gatewayToken);
  }
}

function startNodeProcess(host, port, displayName, gatewayToken) {
  const args = ["node", "run", "--host", host, "--port", String(port), "--display-name", displayName];
  const child = spawnOpenclaw(args, {
    env: { ...process.env, OPENCLAW_GATEWAY_TOKEN: gatewayToken },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed) console.log(`[openclaw:stdout] ${trimmed}`);
    }
  });
  child.stderr.on("data", (chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed) console.log(`[openclaw:stderr] ${trimmed}`);
    }
  });

  return child;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollUntilConnected(gatewayUrl, gatewayToken, displayName, opts) {
  let lastState = "";
  const deadline = Date.now() + opts.timeoutSec * 1000;

  while (Date.now() < deadline) {
    let result;
    try {
      result = await inferGatewayState(gatewayUrl, gatewayToken, displayName);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isPendingApprovalError(message)) {
        result = {
          state: "awaiting_approval",
          detail: "Gateway pairing pending approval",
        };
      } else {
        console.log(`[poll] ${message}`);
        await sleep(POLL_MS);
        continue;
      }
    }

    const label = `${result.state}${result.detail ? `: ${result.detail}` : ""}`;
    if (label !== lastState) {
      console.log(`[state] ${label}`);
      lastState = label;
    }

    if (opts.autoApprove && result.state === "awaiting_approval") {
      console.log("[approve] auto-approving pending requests…");
      try {
        await autoApprovePending(opts, gatewayUrl, gatewayToken);
      } catch (err) {
        console.log(`[approve] ${err instanceof Error ? err.message : err}`);
      }
    }

    if (result.state === "connected") {
      console.log("[ok] node connected");
      return true;
    }

    await sleep(POLL_MS);
  }

  console.error(`[fail] Timed out after ${opts.timeoutSec}s (last: ${lastState || "unknown"})`);
  return false;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (opts.approveOnly) {
    if (!opts.gatewayUrl || !opts.gatewayToken) {
      console.error("--approve-only requires --gateway-url and --gateway-token");
      process.exit(1);
    }
    console.log("[approve-only] polling + optional auto-approve…");
    const ok = await pollUntilConnected(
      opts.gatewayUrl,
      opts.gatewayToken,
      opts.name,
      opts,
    );
    process.exit(ok ? 0 : 1);
  }

  if (!opts.invite) {
    printHelp();
    process.exit(1);
  }

  console.log("[1/4] Redeeming invite…");
  const redeemed = await redeemInvite(opts.apiUrl, opts.invite);
  const { gatewayUrl, gatewayToken, projectId } = redeemed;
  opts.projectId = projectId;
  const { host, port } = parseHostPort(gatewayUrl);
  console.log(`      gateway=${gatewayUrl}`);

  console.log("[2/4] Starting openclaw node run…");
  const nodeProc = startNodeProcess(host, port, opts.name, gatewayToken);

  console.log("[3/4] Polling gateway status (awaiting_approval → connected)…");

  try {
    const ok = await pollUntilConnected(gatewayUrl, gatewayToken, opts.name, opts);
    nodeProc.kill();
    process.exit(ok ? 0 : 1);
  } catch (err) {
    nodeProc.kill();
    throw err;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
