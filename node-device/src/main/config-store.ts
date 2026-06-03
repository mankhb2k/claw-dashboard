import { app, safeStorage } from "electron";
import fs from "node:fs";
import path from "node:path";
import {
  storedConfigSchema,
  type StoredConfig,
} from "../shared/schemas/node-config.schema";

const CONFIG_FILE = "node-device-config.bin";

function configPath(): string {
  return path.join(app.getPath("userData"), CONFIG_FILE);
}

export function loadStoredConfig(): StoredConfig | null {
  const file = configPath();
  if (!fs.existsSync(file)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(file);
    let json: string;
    if (safeStorage.isEncryptionAvailable()) {
      json = safeStorage.decryptString(raw);
    } else {
      json = raw.toString("utf8");
    }
    const parsed = JSON.parse(json) as unknown;
    return storedConfigSchema.parse(parsed);
  } catch {
    return null;
  }
}

export function saveStoredConfig(config: StoredConfig): void {
  const validated = storedConfigSchema.parse(config);
  const json = JSON.stringify(validated);
  const payload = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(json)
    : Buffer.from(json, "utf8");
  fs.writeFileSync(configPath(), payload);
}

export function clearStoredConfig(): void {
  const file = configPath();
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}

export function isSafeStorageAvailable(): boolean {
  return safeStorage.isEncryptionAvailable();
}
