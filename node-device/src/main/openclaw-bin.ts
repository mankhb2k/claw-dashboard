import { app } from "electron";
import path from "node:path";

export function resolveOpenclawBin(): string {
  const bin = process.platform === "win32" ? "openclaw.cmd" : "openclaw";
  return path.join(app.getAppPath(), "node_modules", ".bin", bin);
}
