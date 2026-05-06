/**
 * English strings — OpenClaw channels & Channel page.
 * Keep keys in sync with `vi.ts`.
 */
export const en = {
  channels: {
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
  },
  connect: {
    page: {
      headerConnect: "Connect",
      titleWithProject: "{{name}} · Connect",
      hubTitle: "Integration Hub (Connect)",
      lead: "Connect your agent to the outside world through APIs or MCP. Selected services provide extra context and capabilities to the model in real time.",
      addConnector: "Add connector",
      addCustomConnector: "Add custom connector",
      connect: "Connect",
      projectNotFound: "Project not found.",
      loading: "Loading...",
      emptyServices: "No services found.",
    },
    menu: {
      actions: "Actions",
      moreOptionsAria: "More options for {{name}}",
      configure: "Configure",
      viewDetails: "View details",
      refreshToolsList: "Refresh",
      disconnect: "Disconnect",
      remove: "Remove",
    },
    store: {
      title: "Connector app store",
      closeAria: "Close connector app store",
      searchPlaceholder: "Search connectors...",
      installAria: "Add app",
      openSettingsAria: "Open app settings",
      empty: "No matching connectors found.",
    },
    custom: {
      title: "Add custom connector",
      closeAria: "Close add custom connector modal",
      lead: "Connect Claude to your data and tools.",
      nameLabel: "Name",
      serverUrlPlaceholder: "Remote MCP server URL",
      advancedSettings: "Advanced settings",
      clientIdPlaceholder: "OAuth Client ID (optional)",
      clientSecretPlaceholder: "OAuth Client Secret (optional)",
      hint: "Only use connectors from developers you trust.",
      cancel: "Cancel",
      add: "Add",
    },
    detailModal: {
      title: "Connector details",
      closeAria: "Close connector details",
      tools: "Tools",
      author: "Author",
      connectorUrl: "Connector URL",
      documentation: "Documentation",
      disconnect: "Disconnect",
    },
    detail: {
      connectorNotFoundTitle: "Connector not found",
      connectorNotFound: "Connector not found.",
      backAllConnectors: "All connectors",
      uninstall: "Uninstall",
      supportAria: "Open support page",
      toolPermissions: "Tool permissions",
      toolPermissionsLead: "Choose when Claude is allowed to use these tools.",
      alwaysAllow: "Always allow",
      needsApproval: "Needs approval",
      blocked: "Blocked",
      allow: "Allow",
      ask: "Ask",
      block: "Block",
    },
    groups: {
      readOnlyTools: "Read-only tools",
      writeDeleteTools: "Write/delete tools",
    },
    services: {
      "google-drive": {
        name: "Google Drive",
        description: "Store and read document files",
      },
      notion: {
        name: "Notion",
        description: "Access wiki pages and database documents",
      },
      github: {
        name: "GitHub Integration",
        description: "Manage Pull Requests, Issues, and Actions",
      },
      slack: {
        name: "Slack",
        description: "Send notifications and internal chat bots",
      },
      gmail: {
        name: "Gmail",
        description: "Read and search emails in your inbox",
      },
      "google-calendar": {
        name: "Google Calendar",
        description: "Read calendars and events in real time",
      },
    },
  },
  skills: {
    page: {
      headerSkill: "Skill",
      titleWithProject: "{{name}} · Skill",
      leadPart1:
        "A skill folder contains SKILL.md with YAML frontmatter and agent instructions. See ",
      leadPart2: " for format and where to place files.",
      docsLinkLabel: "Creating skills",
      tabBuilder: "Builder",
      tabMarkdown: "Markdown",
      markdownHint:
        "Edit the full file directly. Switching back to Builder will not sync into the form fields.",
      fieldName: "Skill id (name)",
      fieldNameHint:
        "Lowercase letters, digits, hyphens — e.g. my-telegram-notify",
      fieldDescription: "One-line description",
      fieldDescriptionHint:
        "The agent uses this line to decide when to apply the skill.",
      fieldHeading: "In-file heading (optional)",
      fieldHeadingHint:
        "If empty, a title is derived from the id (e.g. my-skill → My skill).",
      fieldWhenToUse: "When to use",
      fieldWorkflow: "Workflow",
      fieldNotes: "Notes",
      placeholderWhenToUse:
        "One line per bullet; each non-empty line becomes a list item.",
      placeholderWorkflow: "Steps the agent should follow, one per line.",
      placeholderNotes: "Warnings, edge cases…",
      placeholderMarkdown: "---\\nname: ...\\n---\\n\\n# ...",
      sectionWhenToUse: "When to use",
      sectionWorkflow: "Workflow",
      sectionNotes: "Notes",
      previewTitle: "SKILL.md preview",
      copyButton: "Copy",
      downloadButton: "Download SKILL.md",
      copySuccess: "Copied.",
      copyFail: "Could not copy.",
      downloadFilename: "SKILL.md",
      errNameFormat:
        "Use lowercase letters, digits, and hyphens only; 3–64 characters; must start with a letter or digit.",
      errDescription: "Description is required (max 500 characters).",
      errGeneric: "Please check the fields.",
      loading: "Loading…",
      notFoundTitle: "Not found",
      backToList: "← Back to list",
      projectNotFound: "Project not found.",
      invalidProject: "Invalid project id",
    },
  },
} as const;

export type EnDictionary = typeof en;
