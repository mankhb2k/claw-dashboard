export const viChannels = {
  page: {
    title: 'Kênh chat',
    description:
      'Kết nối chatbot với các kênh phổ biến như Telegram, Facebook, Discord...',
    searchPlaceholder: 'Tìm kênh...',
    loading: 'Đang tải...',
    loadingChannels: 'Đang tải kênh...',
    noProject: 'Chưa có dự án. Tạo dự án ở Tổng quan trước khi cấu hình kênh.',
    backToOverview: 'Về tổng quan',
    projectNotFound: 'Không tìm thấy dự án.',
    retry: 'Thử lại',
    emptyServer: 'Không có kênh nào trên máy chủ.',
    emptySearch: 'Không có kênh khớp tìm kiếm.',
    comingSoon: 'Sắp ra mắt',
    loadError: 'Không thể tải danh sách kênh',
    headerChannel: 'Channel',
    titleWithProject: '{{name}} · Channel',
    chatChannelsTitle: 'Kênh chat',
    leadBeforeStrong:
      'Kết nối OpenClaw với ứng dụng nhắn tin bạn đã dùng. Mỗi kênh giao tiếp qua ',
    leadStrong: 'Gateway',
    leadAfterStrong:
      '; có thể bật nhiều kênh và định tuyến theo từng cuộc trò chuyện. ',
    docsLinkLabel: 'Tài liệu đầy đủ',
    searchAria: 'Tìm kênh',
    notFoundTitle: 'Không tìm thấy',
    backToList: '← Về danh sách',
    invalidProject: 'Mã project không hợp lệ',
  },
  badge: {
    channel: 'Channel',
    web: 'Web',
    plugin: 'Plugin',
  },
  card: {
    openDocsAria: '{{name}} — mở tài liệu OpenClaw (tab mới)',
  },
  items: {
    telegram: {
      name: 'Telegram',
      description:
        'Bot API qua grammY; nhóm & DM. Thường là cách setup nhanh nhất (bot token).',
      vendor: 'OpenClaw Gateway',
    },
    whatsapp: {
      name: 'WhatsApp',
      description:
        'Kênh phổ biến; Baileys và ghép cặp QR. Gateway chỉ tải runtime khi kênh bật.',
      vendor: 'OpenClaw Gateway',
    },
    slack: {
      name: 'Slack',
      description: 'Bolt SDK; workspace apps, kênh và DM.',
      vendor: 'OpenClaw Gateway',
    },
    discord: {
      name: 'Discord',
      description: 'Discord Bot API + Gateway; server, kênh và DM.',
      vendor: 'OpenClaw Gateway',
    },
    msteams: {
      name: 'Microsoft Teams',
      description: 'Bot Framework; hỗ trợ doanh nghiệp (plugin đi kèm).',
      vendor: 'OpenClaw Gateway',
    },
    googlechat: {
      name: 'Google Chat',
      description: 'Google Chat API qua HTTP webhook.',
      vendor: 'OpenClaw Gateway',
    },
    matrix: {
      name: 'Matrix',
      description: 'Giao thức Matrix (plugin đi kèm).',
      vendor: 'OpenClaw Gateway',
    },
    mattermost: {
      name: 'Mattermost',
      description: 'Bot API + WebSocket; kênh, nhóm, DM (plugin đi kèm).',
      vendor: 'OpenClaw Gateway',
    },
    feishu: {
      name: 'Feishu / Lark',
      description: 'Bot Feishu/Lark qua WebSocket (plugin đi kèm).',
      vendor: 'OpenClaw Gateway',
    },
    line: {
      name: 'LINE',
      description: 'LINE Messaging API bot (plugin đi kèm).',
      vendor: 'OpenClaw Gateway',
    },
    signal: {
      name: 'Signal',
      description: 'signal-cli; tập trung vào quyền riêng tư.',
      vendor: 'OpenClaw Gateway',
    },
    irc: {
      name: 'IRC',
      description: 'Máy chủ IRC cổ điển; kênh + DM với pairing/allowlist.',
      vendor: 'OpenClaw Gateway',
    },
    nostr: {
      name: 'Nostr',
      description: 'DM phi tập trung qua NIP-04 (plugin đi kèm).',
      vendor: 'OpenClaw Gateway',
    },
    twitch: {
      name: 'Twitch',
      description: 'Chat Twitch qua kết nối IRC (plugin đi kèm).',
      vendor: 'OpenClaw Gateway',
    },
    qqbot: {
      name: 'QQ Bot',
      description: 'QQ Bot API; chat riêng, nhóm và rich media (plugin đi kèm).',
      vendor: 'OpenClaw Gateway',
    },
    zalo: {
      name: 'Zalo',
      description: 'Zalo Bot API — phổ biến tại Việt Nam (plugin đi kèm).',
      vendor: 'OpenClaw Gateway',
    },
    zalouser: {
      name: 'Zalo Personal',
      description: 'Tài khoản Zalo cá nhân qua đăng nhập QR (plugin đi kèm).',
      vendor: 'OpenClaw Gateway',
    },
    'synology-chat': {
      name: 'Synology Chat',
      description: 'Synology NAS Chat qua webhook gửi/nhận (plugin đi kèm).',
      vendor: 'OpenClaw Gateway',
    },
    'nextcloud-talk': {
      name: 'Nextcloud Talk',
      description: 'Chat tự host qua Nextcloud Talk (plugin đi kèm).',
      vendor: 'OpenClaw Gateway',
    },
    tlon: {
      name: 'Tlon',
      description: 'Messenger Urbit (plugin đi kèm).',
      vendor: 'OpenClaw Gateway',
    },
    bluebubbles: {
      name: 'BlueBubbles',
      description:
        'Khuyến nghị cho iMessage; REST API máy chủ macOS, đủ tính năng (plugin đi kèm).',
      vendor: 'OpenClaw Gateway',
    },
    imessage: {
      name: 'iMessage (legacy)',
      description: 'Tích hợp macOS qua imsg CLI — dùng BlueBubbles cho setup mới.',
      vendor: 'OpenClaw Gateway',
    },
    wechat: {
      name: 'WeChat',
      description: 'Tencent iLink Bot qua QR — chỉ chat riêng (plugin ngoài).',
      vendor: 'OpenClaw (external)',
    },
    yuanbao: {
      name: 'Yuanbao',
      description: 'Bot Tencent Yuanbao (plugin ngoài).',
      vendor: 'OpenClaw (external)',
    },
    webchat: {
      name: 'WebChat',
      description: 'Giao diện WebChat của Gateway qua WebSocket.',
      vendor: 'OpenClaw Gateway',
    },
    'voice-call': {
      name: 'Voice Call',
      description: 'Thoại qua Plivo hoặc Twilio (cài plugin riêng).',
      vendor: 'OpenClaw (plugin)',
    },
  },
} as const
