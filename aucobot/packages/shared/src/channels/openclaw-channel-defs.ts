import type { OpenClawChannelDef } from './openclaw-channel-defs.types.js';

/**
 * OpenClaw chat channel skeleton (id, docs, kind).
 * Display name/description: app i18n dictionaries.
 * Docs: https://docs.openclaw.ai/channels
 */
export const OPENCLAW_CHANNEL_DEFS = [
  { id: 'telegram', docsPath: '/channels/telegram', kind: 'bundled' },
  { id: 'whatsapp', docsPath: '/channels/whatsapp', kind: 'bundled' },
  { id: 'slack', docsPath: '/channels/slack', kind: 'bundled' },
  { id: 'discord', docsPath: '/channels/discord', kind: 'bundled' },
  { id: 'msteams', docsPath: '/channels/msteams', kind: 'bundled' },
  { id: 'googlechat', docsPath: '/channels/googlechat', kind: 'bundled' },
  { id: 'matrix', docsPath: '/channels/matrix', kind: 'bundled' },
  { id: 'mattermost', docsPath: '/channels/mattermost', kind: 'bundled' },
  { id: 'feishu', docsPath: '/channels/feishu', kind: 'bundled' },
  { id: 'line', docsPath: '/channels/line', kind: 'bundled' },
  { id: 'signal', docsPath: '/channels/signal', kind: 'bundled' },
  { id: 'irc', docsPath: '/channels/irc', kind: 'bundled' },
  { id: 'nostr', docsPath: '/channels/nostr', kind: 'bundled' },
  { id: 'twitch', docsPath: '/channels/twitch', kind: 'bundled' },
  { id: 'qqbot', docsPath: '/channels/qqbot', kind: 'bundled' },
  { id: 'zalo', docsPath: '/channels/zalo', kind: 'bundled' },
  { id: 'zalouser', docsPath: '/channels/zalouser', kind: 'bundled' },
  { id: 'synology-chat', docsPath: '/channels/synology-chat', kind: 'bundled' },
  { id: 'nextcloud-talk', docsPath: '/channels/nextcloud-talk', kind: 'bundled' },
  { id: 'tlon', docsPath: '/channels/tlon', kind: 'bundled' },
  { id: 'bluebubbles', docsPath: '/channels/bluebubbles', kind: 'bundled' },
  { id: 'imessage', docsPath: '/channels/imessage', kind: 'bundled' },
  { id: 'wechat', docsPath: '/channels/wechat', kind: 'external' },
  { id: 'yuanbao', docsPath: '/channels/yuanbao', kind: 'external' },
  { id: 'webchat', docsPath: '/web/webchat', kind: 'web' },
  { id: 'voice-call', docsPath: '/plugins/voice-call', kind: 'external' },
] as const satisfies readonly OpenClawChannelDef[];

export type OpenClawChannelDefEntry = (typeof OPENCLAW_CHANNEL_DEFS)[number];

export type OpenClawChannelId = OpenClawChannelDefEntry['id'];

export const OPENCLAW_DOC_ORIGIN = 'https://docs.openclaw.ai';

export function openclawDocsUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${OPENCLAW_DOC_ORIGIN}${p}`;
}
