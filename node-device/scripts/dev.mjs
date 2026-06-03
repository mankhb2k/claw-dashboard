import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

function run(name, cmd, args, env = {}) {
  return spawn(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: isWin,
    env: { ...process.env, ...env },
  });
}

const children = [];

function track(child) {
  children.push(child);
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[dev] process exited with code ${code}`);
      shutdown(code ?? 1);
    }
  });
  return child;
}

track(run("tsc", "pnpm", ["exec", "tsc", "-p", "tsconfig.json", "-w"]));
track(run("vite", "pnpm", ["exec", "vite"]));

const wait = track(run("wait-on", "pnpm", ["exec", "wait-on", "http://127.0.0.1:5173"]));
wait.on("exit", () => {
  track(
    run("electron", "pnpm", ["exec", "electron", "."], {
      NODE_ENV: "development",
      VITE_DEV_SERVER_URL: "http://127.0.0.1:5173",
    }),
  );
});

function shutdown(code = 0) {
  for (const child of children) {
    child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
