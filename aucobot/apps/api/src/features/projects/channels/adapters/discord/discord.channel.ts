import {
  type ChannelTestResult,
  validateDiscordAccessConfig,
} from '@aucobot/shared';

import type { ChannelAdapter } from '../../lib/channel-adapter.types';

/** Discord bot tokens are three dot-separated segments. */
const DISCORD_BOT_TOKEN_RE = /^[\w-]{20,}\.[\w-]{4,}\.[\w-]{20,}$/;

function readBotToken(secrets: Record<string, string>): string | null {
  const token = secrets.bot_token?.trim();
  if (!token || !DISCORD_BOT_TOKEN_RE.test(token)) {
    return null;
  }
  return token;
}

async function testDiscordConnection(
  secrets: Record<string, string>,
): Promise<ChannelTestResult> {
  const token = readBotToken(secrets);
  if (!token) {
    return { ok: false, message: 'Invalid Discord bot token format' };
  }

  const res = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bot ${token}` },
  });
  const data = (await res.json()) as {
    id?: string;
    username?: string;
    discriminator?: string;
    message?: string;
  };

  if (!res.ok || !data.id) {
    const message =
      typeof data.message === 'string'
        ? data.message
        : `Discord API HTTP ${res.status}`;
    return { ok: false, message };
  }

  const tag =
    data.discriminator && data.discriminator !== '0'
      ? `${data.username}#${data.discriminator}`
      : (data.username ?? data.id);
  return {
    ok: true,
    message: `Connected as ${tag}`,
    metadata: data.username ? { botUsername: data.username } : undefined,
  };
}

function buildDiscordOpenClawConfig(
  secrets: Record<string, string>,
  config: Record<string, unknown>,
): Record<string, unknown> {
  const token = readBotToken(secrets);
  if (!token) {
    throw new Error('bot_token required');
  }

  const access = validateDiscordAccessConfig(config);
  const slice: Record<string, unknown> = {
    token,
    dmPolicy: access.dmPolicy,
  };
  if (access.allowFrom.length > 0) {
    slice.allowFrom = access.allowFrom;
  }
  return slice;
}

function defaultDiscordConfig(): Record<string, unknown> {
  return { dmPolicy: 'pairing', allowFrom: [] as string[] };
}

function normalizeDiscordConfig(
  existing: unknown,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const merged = { ...base, ...patch };
  const access = validateDiscordAccessConfig(merged, { strict: false });
  return { ...merged, dmPolicy: access.dmPolicy, allowFrom: access.allowFrom };
}

export const DISCORD_CHANNEL: ChannelAdapter = {
  id: 'discord',
  displayName: 'Discord',
  description: 'Connect a Discord bot via the Developer Portal bot token.',
  kind: 'BOT_TOKEN',
  status: 'ACTIVE',
  secretKeys: ['bot_token'],
  pluginId: 'discord',
  docsPath: '/channels/discord',
  testConnection: testDiscordConnection,
  buildOpenClawConfig: buildDiscordOpenClawConfig,
  defaultConfig: defaultDiscordConfig,
  normalizeConfig: normalizeDiscordConfig,
};
