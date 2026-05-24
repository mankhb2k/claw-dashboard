export const enChannels = {
  page: {
    headerChannel: "Channel",
    titleWithProject: "{{name}} · Channel",
    chatChannelsTitle: "Chat channels",
    leadBeforeStrong:
      "Connect OpenClaw to the chat apps you already use. Each channel talks through the ",
    leadStrong: "Gateway",
    leadAfterStrong:
      "; you can enable multiple channels and route per conversation. ",
    docsLinkLabel: "Full documentation",
    searchAria: "Search channels",
    searchPlaceholder: "Search channels…",
    emptySearch: "No channels match your search.",
    loading: "Loading…",
    notFoundTitle: "Not found",
    backToList: "← Back to list",
    projectNotFound: "Project not found.",
    invalidProject: "Invalid project id",
  },
  badge: {
    channel: "Channel",
    web: "Web",
    plugin: "Plugin",
  },
  card: {
    openDocsAria: "{{name}} — open OpenClaw documentation (new tab)",
  },
  items: {
    telegram: {
      name: "Telegram",
      description:
        "Bot API via grammY; groups and DMs. Often the fastest setup (bot token).",
      vendor: "OpenClaw Gateway",
    },
    whatsapp: {
      name: "WhatsApp",
      description:
        "Popular channel; Baileys and QR pairing. The Gateway loads the runtime only when the channel is active.",
      vendor: "OpenClaw Gateway",
    },
    slack: {
      name: "Slack",
      description: "Bolt SDK; workspace apps, channels, and DMs.",
      vendor: "OpenClaw Gateway",
    },
    discord: {
      name: "Discord",
      description: "Discord Bot API + Gateway; servers, channels, and DMs.",
      vendor: "OpenClaw Gateway",
    },
    msteams: {
      name: "Microsoft Teams",
      description: "Bot Framework; enterprise support (bundled plugin).",
      vendor: "OpenClaw Gateway",
    },
    googlechat: {
      name: "Google Chat",
      description: "Google Chat API via HTTP webhook.",
      vendor: "OpenClaw Gateway",
    },
    matrix: {
      name: "Matrix",
      description: "Matrix protocol (bundled plugin).",
      vendor: "OpenClaw Gateway",
    },
    mattermost: {
      name: "Mattermost",
      description:
        "Bot API + WebSocket; channels, groups, DMs (bundled plugin).",
      vendor: "OpenClaw Gateway",
    },
    feishu: {
      name: "Feishu / Lark",
      description: "Feishu/Lark bot over WebSocket (bundled plugin).",
      vendor: "OpenClaw Gateway",
    },
    line: {
      name: "LINE",
      description: "LINE Messaging API bot (bundled plugin).",
      vendor: "OpenClaw Gateway",
    },
    signal: {
      name: "Signal",
      description: "signal-cli; privacy-focused.",
      vendor: "OpenClaw Gateway",
    },
    irc: {
      name: "IRC",
      description:
        "Classic IRC servers; channels + DMs with pairing/allowlist.",
      vendor: "OpenClaw Gateway",
    },
    nostr: {
      name: "Nostr",
      description: "Decentralized DMs via NIP-04 (bundled plugin).",
      vendor: "OpenClaw Gateway",
    },
    twitch: {
      name: "Twitch",
      description: "Twitch chat via IRC connection (bundled plugin).",
      vendor: "OpenClaw Gateway",
    },
    qqbot: {
      name: "QQ Bot",
      description:
        "QQ Bot API; private chat, groups, and rich media (bundled plugin).",
      vendor: "OpenClaw Gateway",
    },
    zalo: {
      name: "Zalo",
      description: "Zalo Bot API — popular in Vietnam (bundled plugin).",
      vendor: "OpenClaw Gateway",
    },
    zalouser: {
      name: "Zalo Personal",
      description: "Personal Zalo account via QR login (bundled plugin).",
      vendor: "OpenClaw Gateway",
    },
    "synology-chat": {
      name: "Synology Chat",
      description:
        "Synology NAS Chat via outgoing+incoming webhooks (bundled plugin).",
      vendor: "OpenClaw Gateway",
    },
    "nextcloud-talk": {
      name: "Nextcloud Talk",
      description: "Self-hosted chat via Nextcloud Talk (bundled plugin).",
      vendor: "OpenClaw Gateway",
    },
    tlon: {
      name: "Tlon",
      description: "Urbit-based messenger (bundled plugin).",
      vendor: "OpenClaw Gateway",
    },
    bluebubbles: {
      name: "BlueBubbles",
      description:
        "Recommended for iMessage; macOS server REST API with full features (bundled plugin).",
      vendor: "OpenClaw Gateway",
    },
    imessage: {
      name: "iMessage (legacy)",
      description:
        "Legacy macOS integration via imsg CLI — use BlueBubbles for new setups.",
      vendor: "OpenClaw Gateway",
    },
    wechat: {
      name: "WeChat",
      description:
        "Tencent iLink Bot via QR — private chats only (external plugin).",
      vendor: "OpenClaw (external)",
    },
    yuanbao: {
      name: "Yuanbao",
      description: "Tencent Yuanbao bot (external plugin).",
      vendor: "OpenClaw (external)",
    },
    webchat: {
      name: "WebChat",
      description: "Gateway WebChat UI over WebSocket.",
      vendor: "OpenClaw Gateway",
    },
    "voice-call": {
      name: "Voice Call",
      description:
        "Telephony via Plivo or Twilio (install plugin separately).",
      vendor: "OpenClaw (plugin)",
    },
  },
} as const
