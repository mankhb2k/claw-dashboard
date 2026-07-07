/** Presentation-only icons for channel cards (OpenClaw channel id → assets). */
const CHANNEL_ICON_BY_ID: Record<string, { iconSrc: string; iconLabel: string }> = {
  telegram: { iconSrc: '/channel-icon/Telegram-icon.svg', iconLabel: 'send' },
  whatsapp: { iconSrc: '/channel-icon/WhatsApp-icon.svg', iconLabel: 'chat' },
  slack: { iconSrc: '/channel-icon/Slack-icon.svg', iconLabel: 'tag' },
  discord: { iconSrc: '/channel-icon/Discord-icon.svg', iconLabel: 'sports_esports' },
  zalo: { iconSrc: '/channel-icon/Zalo-icon.svg', iconLabel: 'chat_bubble' },
  'facebook-messenger': { iconSrc: '/channel-icon/Messenger-icon.svg', iconLabel: 'chat' },
};

export function channelIconFor(channelId: string) {
  return CHANNEL_ICON_BY_ID[channelId.toLowerCase()];
}
