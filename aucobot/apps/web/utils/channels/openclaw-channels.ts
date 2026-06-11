/**
 * OpenClaw chat channels — cấu trúc (id, docs, loại) tách khỏi chuỗi i18n.
 * Tên, mô tả, vendor: `lib/i18n/dictionaries/vi.ts` & `en.ts`
 * Tài liệu: https://docs.openclaw.ai/channels
 */
import type { AppDictionary } from '@/lib/i18n/dictionaries'

export const OPENCLAW_CHANNEL_DEFS = [
  { id: 'telegram', docsPath: '/channels/telegram', kind: 'bundled' as const },
  { id: 'whatsapp', docsPath: '/channels/whatsapp', kind: 'bundled' as const },
  { id: 'slack', docsPath: '/channels/slack', kind: 'bundled' as const },
  { id: 'discord', docsPath: '/channels/discord', kind: 'bundled' as const },
  { id: 'msteams', docsPath: '/channels/msteams', kind: 'bundled' as const },
  { id: 'googlechat', docsPath: '/channels/googlechat', kind: 'bundled' as const },
  { id: 'matrix', docsPath: '/channels/matrix', kind: 'bundled' as const },
  { id: 'mattermost', docsPath: '/channels/mattermost', kind: 'bundled' as const },
  { id: 'feishu', docsPath: '/channels/feishu', kind: 'bundled' as const },
  { id: 'line', docsPath: '/channels/line', kind: 'bundled' as const },
  { id: 'signal', docsPath: '/channels/signal', kind: 'bundled' as const },
  { id: 'irc', docsPath: '/channels/irc', kind: 'bundled' as const },
  { id: 'nostr', docsPath: '/channels/nostr', kind: 'bundled' as const },
  { id: 'twitch', docsPath: '/channels/twitch', kind: 'bundled' as const },
  { id: 'qqbot', docsPath: '/channels/qqbot', kind: 'bundled' as const },
  { id: 'zalo', docsPath: '/channels/zalo', kind: 'bundled' as const },
  { id: 'zalouser', docsPath: '/channels/zalouser', kind: 'bundled' as const },
  {
    id: 'synology-chat',
    docsPath: '/channels/synology-chat',
    kind: 'bundled' as const,
  },
  {
    id: 'nextcloud-talk',
    docsPath: '/channels/nextcloud-talk',
    kind: 'bundled' as const,
  },
  { id: 'tlon', docsPath: '/channels/tlon', kind: 'bundled' as const },
  { id: 'bluebubbles', docsPath: '/channels/bluebubbles', kind: 'bundled' as const },
  { id: 'imessage', docsPath: '/channels/imessage', kind: 'bundled' as const },
  { id: 'wechat', docsPath: '/channels/wechat', kind: 'external' as const },
  { id: 'yuanbao', docsPath: '/channels/yuanbao', kind: 'external' as const },
  { id: 'webchat', docsPath: '/web/webchat', kind: 'web' as const },
  {
    id: 'voice-call',
    docsPath: '/plugins/voice-call',
    kind: 'external' as const,
  },
] as const

export type OpenClawChannelDef = (typeof OPENCLAW_CHANNEL_DEFS)[number]

export type OpenClawChannelId = OpenClawChannelDef['id']

export type OpenClawChannelKind = OpenClawChannelDef['kind']

export type OpenClawChannel = OpenClawChannelDef & {
  name: string
  description: string
  vendor: string
}

export const OPENCLAW_DOC_ORIGIN = 'https://docs.openclaw.ai'

export function openclawDocsUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${OPENCLAW_DOC_ORIGIN}${p}`
}

/** Ghép định nghĩa kênh với `channels.items` trong dictionary i18n. */
export function resolveOpenClawChannels(
  items: AppDictionary['channels']['items'],
): OpenClawChannel[] {
  return OPENCLAW_CHANNEL_DEFS.map((def) => {
    const row = items[def.id]
    return {
      ...def,
      name: row.name,
      description: row.description,
      vendor: row.vendor,
    }
  })
}
