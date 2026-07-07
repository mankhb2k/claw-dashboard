export interface ChannelData {
  id: string;
  name: string;
  icon: string;
  color: string;
  envKey?: string;
  iconSrc?: string;
  description?: string;
}

/** Static catalog for mock/agent UI — channel list page uses API definitions instead. */
export const CHANNEL_PROVIDERS: ChannelData[] = [
  {
    id: "telegram",
    name: "Telegram",
    icon: "send",
    color: "#229ED9",
    iconSrc: "/channel-icon/Telegram-icon.svg",
    envKey: "TELEGRAM_BOT_TOKEN",
    description: "Chatbot via Telegram Bot Token.",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "chat",
    color: "#25D366",
    iconSrc: "/channel-icon/WhatsApp-icon.svg",
    envKey: "WHATSAPP_API_KEY",
    description: "Automated WhatsApp Business messaging.",
  },
  {
    id: "slack",
    name: "Slack",
    icon: "tag",
    color: "#4A154B",
    iconSrc: "/channel-icon/Slack-icon.svg",
    envKey: "SLACK_BOT_TOKEN",
    description: "Slack bot for internal teams or customers.",
  },
  {
    id: "discord",
    name: "Discord",
    icon: "sports_esports",
    color: "#5865F2",
    iconSrc: "/channel-icon/Discord-icon.svg",
    envKey: "DISCORD_BOT_TOKEN",
    description: "Discord bot for communities and support.",
  },
  {
    id: "zalo",
    name: "Zalo",
    icon: "chat_bubble",
    color: "#0099FF",
    iconSrc: "/channel-icon/Zalo-icon.svg",
    envKey: "ZALO_API_KEY",
    description: "Automated Zalo Official Account messaging.",
  },
  {
    id: "facebook-messenger",
    name: "Facebook Messenger",
    icon: "chat",
    color: "#0866FF",
    iconSrc: "/channel-icon/Messenger-icon.svg",
    envKey: "FACEBOOK_PAGE_ACCESS_TOKEN",
    description: "Automated Facebook Page Messenger replies.",
  },
];
