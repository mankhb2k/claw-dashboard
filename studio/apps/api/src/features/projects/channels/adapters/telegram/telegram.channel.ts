import {
  type ChannelTestResult,
  validateTelegramAccessConfig,
} from '@claw-dashboard/shared';

import type { ChannelAdapter } from '../../lib/channel-adapter.types';

const BOT_TOKEN_RE = /^\d+:[A-Za-z0-9_-]+$/;

function readBotToken(secrets: Record<string, string>): string | null {
  const token = secrets.bot_token?.trim();
  if (!token || !BOT_TOKEN_RE.test(token)) {
    return null;
  }
  return token;
}

async function testTelegramConnection(
  secrets: Record<string, string>,
): Promise<ChannelTestResult> {
  const token = readBotToken(secrets);
  if (!token) {
    return { ok: false, message: 'Invalid bot token format' };
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const data = (await res.json()) as {
    ok?: boolean;
    description?: string;
    result?: { username?: string; first_name?: string };
  };

  if (!data.ok || !data.result) {
    return { ok: false, message: data.description ?? 'Telegram API error' };
  }

  const username = data.result.username?.trim();
  const label = username ? `@${username}` : (data.result.first_name ?? 'bot');
  return {
    ok: true,
    message: `Connected as ${label}`,
    metadata: username ? { botUsername: username } : undefined,
  };
}

function buildTelegramOpenClawConfig(
  secrets: Record<string, string>,
  config: Record<string, unknown>,
): Record<string, unknown> {
  const token = readBotToken(secrets);
  if (!token) {
    throw new Error('bot_token required');
  }

  const access = validateTelegramAccessConfig(config);
  const slice: Record<string, unknown> = {
    botToken: token,
    dmPolicy: access.dmPolicy,
    groupPolicy: 'disabled',
  };
  if (access.allowFrom.length > 0) {
    slice.allowFrom = access.allowFrom;
  }
  return slice;
}

function defaultTelegramConfig(): Record<string, unknown> {
  return { dmPolicy: 'allowlist', allowFrom: [] as string[] };
}

function normalizeTelegramConfig(
  existing: unknown,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const merged = { ...base, ...patch };
  const access = validateTelegramAccessConfig(merged, { strict: false });
  return { ...merged, dmPolicy: access.dmPolicy, allowFrom: access.allowFrom };
}

export const TELEGRAM_CHANNEL: ChannelAdapter = {
  id: 'telegram',
  displayName: 'Telegram',
  description: 'Connect a Telegram bot via BotFather token.',
  kind: 'BOT_TOKEN',
  status: 'ACTIVE',
  secretKeys: ['bot_token'],
  pluginId: 'telegram',
  docsPath: '/channels/telegram',
  testConnection: testTelegramConnection,
  buildOpenClawConfig: buildTelegramOpenClawConfig,
  defaultConfig: defaultTelegramConfig,
  normalizeConfig: normalizeTelegramConfig,
};
