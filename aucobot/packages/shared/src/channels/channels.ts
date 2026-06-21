/** Lowercase project status (API normalizes DB enum). */
export const PROJECT_STATUSES = [
  'creating',
  'running',
  'starting',
  'stopping',
  'stopped',
  'error',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const CONNECTOR_KINDS = ['API', 'MCP', 'OAUTH'] as const;
export type ConnectorKind = (typeof CONNECTOR_KINDS)[number];

export const CONNECTOR_CONNECTION_STATUSES = [
  'disconnected',
  'connected',
  'error',
  'needs_reauth',
] as const;
export type ConnectorConnectionStatus = (typeof CONNECTOR_CONNECTION_STATUSES)[number];

export const CHANNEL_KINDS = ['BOT_TOKEN', 'OAUTH', 'WEBHOOK', 'QR_PAIRING'] as const;
export type ChannelKind = (typeof CHANNEL_KINDS)[number];

export type ChannelTestResult = {
  ok: boolean;
  message?: string;
  metadata?: Record<string, unknown>;
};

export const CHANNEL_CONNECTION_STATUSES = [
  'disconnected',
  'configured',
  'connected',
  'needs_reauth',
  'error',
] as const;
export type ChannelConnectionStatus = (typeof CHANNEL_CONNECTION_STATUSES)[number];

export const TELEGRAM_DM_POLICIES = ['pairing', 'allowlist', 'open'] as const;
export type TelegramDmPolicy = (typeof TELEGRAM_DM_POLICIES)[number];

export const TELEGRAM_USER_ID_RE = /^\d+$/;

export function normalizeTelegramAllowFromEntry(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const stripped = trimmed.replace(/^(telegram:|tg:)/i, '');
  if (stripped === '*') return '*';
  if (TELEGRAM_USER_ID_RE.test(stripped)) return stripped;
  return null;
}

export function parseTelegramAllowFromInput(input: string): string[] {
  const parts = input.split(/[\n,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const normalized = normalizeTelegramAllowFromEntry(part);
    if (normalized && !out.includes(normalized)) {
      out.push(normalized);
    }
  }
  return out;
}

export type TelegramAccessValidation =
  | { ok: true; dmPolicy: TelegramDmPolicy; allowFrom: string[] }
  | { ok: false; message: string };

export function validateTelegramAccessForm(input: {
  dmPolicy: TelegramDmPolicy;
  allowFromInput: string;
}): TelegramAccessValidation {
  const { dmPolicy } = input;

  if (dmPolicy === 'open') {
    return { ok: true, dmPolicy: 'open', allowFrom: ['*'] };
  }

  const allowFrom = parseTelegramAllowFromInput(input.allowFromInput);

  if (dmPolicy === 'allowlist') {
    if (allowFrom.length === 0) {
      return {
        ok: false,
        message: 'Chế độ allowlist cần ít nhất một Telegram user ID (chỉ số).',
      };
    }
    const invalid = input.allowFromInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !normalizeTelegramAllowFromEntry(s));
    if (invalid.length > 0) {
      return {
        ok: false,
        message: `User ID không hợp lệ: ${invalid.join(', ')}. Dùng số (vd. 8734062810).`,
      };
    }
  } else if (allowFrom.length > 0) {
    const invalid = input.allowFromInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !normalizeTelegramAllowFromEntry(s));
    if (invalid.length > 0) {
      return {
        ok: false,
        message: `User ID không hợp lệ: ${invalid.join(', ')}.`,
      };
    }
  }

  return { ok: true, dmPolicy, allowFrom };
}

export function validateTelegramAccessConfig(
  input: {
    dmPolicy?: unknown;
    allowFrom?: unknown;
  },
  options?: { strict?: boolean },
): { dmPolicy: TelegramDmPolicy; allowFrom: string[] } {
  const strict = options?.strict !== false;
  const rawPolicy =
    typeof input.dmPolicy === 'string' ? input.dmPolicy.trim().toLowerCase() : 'allowlist';
  const dmPolicy = TELEGRAM_DM_POLICIES.includes(rawPolicy as TelegramDmPolicy)
    ? (rawPolicy as TelegramDmPolicy)
    : null;
  if (!dmPolicy) {
    throw new Error('dmPolicy must be pairing, allowlist, or open');
  }

  let allowFrom: string[] = [];
  if (Array.isArray(input.allowFrom)) {
    for (const entry of input.allowFrom) {
      if (typeof entry !== 'string') continue;
      const normalized = normalizeTelegramAllowFromEntry(entry);
      if (normalized && !allowFrom.includes(normalized)) {
        allowFrom.push(normalized);
      }
    }
  }

  if (dmPolicy === 'open') {
    if (allowFrom.length > 0 && !(allowFrom.length === 1 && allowFrom[0] === '*')) {
      throw new Error('dmPolicy open requires allowFrom ["*"] only');
    }
    allowFrom = ['*'];
  } else if (dmPolicy === 'allowlist') {
    if (strict && allowFrom.length === 0) {
      throw new Error('allowlist requires at least one numeric Telegram user ID in allowFrom');
    }
    if (allowFrom.includes('*')) {
      throw new Error('allowFrom cannot contain * unless dmPolicy is open');
    }
  } else if (allowFrom.includes('*')) {
    throw new Error('allowFrom cannot contain * unless dmPolicy is open');
  }

  return { dmPolicy, allowFrom };
}

export function readTelegramAccessFromConfig(config: unknown): {
  dmPolicy: TelegramDmPolicy;
  allowFromInput: string;
} {
  const row = config && typeof config === 'object' ? (config as Record<string, unknown>) : {};
  const rawPolicy = typeof row.dmPolicy === 'string' ? row.dmPolicy.toLowerCase() : 'allowlist';
  const dmPolicy = TELEGRAM_DM_POLICIES.includes(rawPolicy as TelegramDmPolicy)
    ? (rawPolicy as TelegramDmPolicy)
    : 'allowlist';
  const allowFrom = Array.isArray(row.allowFrom)
    ? row.allowFrom.filter((v): v is string => typeof v === 'string')
    : [];
  return {
    dmPolicy,
    allowFromInput: allowFrom.filter((id) => id !== '*').join('\n'),
  };
}

export const DISCORD_DM_POLICIES = TELEGRAM_DM_POLICIES;
export type DiscordDmPolicy = TelegramDmPolicy;

export const DISCORD_USER_ID_RE = /^\d{17,20}$/;

export function normalizeDiscordAllowFromEntry(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const stripped = trimmed.replace(/^(discord:|user:)/i, '');
  if (stripped === '*') return '*';
  if (DISCORD_USER_ID_RE.test(stripped)) return stripped;
  return null;
}

export function parseDiscordAllowFromInput(input: string): string[] {
  const parts = input.split(/[\n,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const normalized = normalizeDiscordAllowFromEntry(part);
    if (normalized && !out.includes(normalized)) {
      out.push(normalized);
    }
  }
  return out;
}

export type DiscordAccessValidation =
  | { ok: true; dmPolicy: DiscordDmPolicy; allowFrom: string[] }
  | { ok: false; message: string };

export function validateDiscordAccessForm(input: {
  dmPolicy: DiscordDmPolicy;
  allowFromInput: string;
}): DiscordAccessValidation {
  const { dmPolicy } = input;

  if (dmPolicy === 'open') {
    return { ok: true, dmPolicy: 'open', allowFrom: ['*'] };
  }

  const allowFrom = parseDiscordAllowFromInput(input.allowFromInput);

  if (dmPolicy === 'allowlist') {
    if (allowFrom.length === 0) {
      return {
        ok: false,
        message: 'Chế độ allowlist cần ít nhất một Discord user ID (snowflake).',
      };
    }
    const invalid = input.allowFromInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !normalizeDiscordAllowFromEntry(s));
    if (invalid.length > 0) {
      return {
        ok: false,
        message: `User ID không hợp lệ: ${invalid.join(', ')}. Dùng số snowflake (vd. 123456789012345678).`,
      };
    }
  } else if (allowFrom.length > 0) {
    const invalid = input.allowFromInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !normalizeDiscordAllowFromEntry(s));
    if (invalid.length > 0) {
      return {
        ok: false,
        message: `User ID không hợp lệ: ${invalid.join(', ')}.`,
      };
    }
  }

  return { ok: true, dmPolicy, allowFrom };
}

export function validateDiscordAccessConfig(
  input: {
    dmPolicy?: unknown;
    allowFrom?: unknown;
  },
  options?: { strict?: boolean },
): { dmPolicy: DiscordDmPolicy; allowFrom: string[] } {
  const strict = options?.strict !== false;
  const rawPolicy =
    typeof input.dmPolicy === 'string' ? input.dmPolicy.trim().toLowerCase() : 'pairing';
  const dmPolicy = DISCORD_DM_POLICIES.includes(rawPolicy as DiscordDmPolicy)
    ? (rawPolicy as DiscordDmPolicy)
    : null;
  if (!dmPolicy) {
    throw new Error('dmPolicy must be pairing, allowlist, or open');
  }

  let allowFrom: string[] = [];
  if (Array.isArray(input.allowFrom)) {
    for (const entry of input.allowFrom) {
      if (typeof entry !== 'string') continue;
      const normalized = normalizeDiscordAllowFromEntry(entry);
      if (normalized && !allowFrom.includes(normalized)) {
        allowFrom.push(normalized);
      }
    }
  }

  if (dmPolicy === 'open') {
    if (allowFrom.length > 0 && !(allowFrom.length === 1 && allowFrom[0] === '*')) {
      throw new Error('dmPolicy open requires allowFrom ["*"] only');
    }
    allowFrom = ['*'];
  } else if (dmPolicy === 'allowlist') {
    if (strict && allowFrom.length === 0) {
      throw new Error('allowlist requires at least one Discord user ID in allowFrom');
    }
    if (allowFrom.includes('*')) {
      throw new Error('allowFrom cannot contain * unless dmPolicy is open');
    }
  } else if (allowFrom.includes('*')) {
    throw new Error('allowFrom cannot contain * unless dmPolicy is open');
  }

  return { dmPolicy, allowFrom };
}

export function readDiscordAccessFromConfig(config: unknown): {
  dmPolicy: DiscordDmPolicy;
  allowFromInput: string;
} {
  const row = config && typeof config === 'object' ? (config as Record<string, unknown>) : {};
  const rawPolicy = typeof row.dmPolicy === 'string' ? row.dmPolicy.toLowerCase() : 'pairing';
  const dmPolicy = DISCORD_DM_POLICIES.includes(rawPolicy as DiscordDmPolicy)
    ? (rawPolicy as DiscordDmPolicy)
    : 'pairing';
  const allowFrom = Array.isArray(row.allowFrom)
    ? row.allowFrom.filter((v): v is string => typeof v === 'string')
    : [];
  return {
    dmPolicy,
    allowFromInput: allowFrom.filter((id) => id !== '*').join('\n'),
  };
}

export const DISCORD_DM_POLICY_OPTIONS: Array<{
  value: DiscordDmPolicy;
  label: string;
  description: string;
}> = [
  {
    value: 'pairing',
    label: 'Pairing (recommended)',
    description: 'Strangers receive a pairing code; an admin must approve before the bot replies.',
  },
  {
    value: 'allowlist',
    label: 'Allowlist',
    description: 'Only Discord user IDs on the list can DM the bot.',
  },
  {
    value: 'open',
    label: 'Open (public)',
    description: 'Anyone can DM the bot — use for demos only; high risk.',
  },
];
