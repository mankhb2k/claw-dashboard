/**
 * Chuỗi tiếng Việt — kênh OpenClaw & trang Channel.
 * Cấu trúc mirror `en.ts` để dễ đối chiếu khi thêm locale.
 */
export const vi = {
  channels: {
    page: {
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
      searchPlaceholder: 'Tìm kênh…',
      emptySearch: 'Không có kênh nào khớp tìm kiếm.',
      loading: 'Đang tải…',
      notFoundTitle: 'Không tìm thấy',
      backToList: '← Về danh sách',
      projectNotFound: 'Không tìm thấy project.',
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
  },
  connect: {
    page: {
      headerConnect: 'Connect',
      titleWithProject: '{{name}} · Connect',
      hubTitle: 'Hub Tích Hợp (Connect)',
      lead:
        'Kết nối Agent của bạn với thế giới bên ngoài thông qua API hoặc MCP. Các dịch vụ được chọn sẽ cung cấp Context hoặc tính năng bổ sung cho Model trong thời gian thực.',
      addConnector: 'Thêm kết nối',
      addCustomConnector: 'Thêm kết nối tùy chỉnh',
      connect: 'Kết nối',
      projectNotFound: 'Không tìm thấy project.',
      loading: 'Đang tải...',
      emptyServices: 'Không tìm thấy dịch vụ.',
    },
    menu: {
      actions: 'Thao tác',
      moreOptionsAria: 'Tùy chọn cho {{name}}',
      configure: 'Configure',
      viewDetails: 'Xem chi tiết',
      refreshToolsList: 'Làm mới',
      disconnect: 'Ngắt kết nối',
      remove: 'Xóa khỏi danh sách',
    },
    store: {
      title: 'Chợ ứng dụng kết nối',
      closeAria: 'Đóng chợ ứng dụng kết nối',
      searchPlaceholder: 'Tìm kết nối...',
      installAria: 'Thêm ứng dụng',
      openSettingsAria: 'Mở cài đặt ứng dụng',
      empty: 'Không tìm thấy kết nối phù hợp.',
    },
    custom: {
      title: 'Thêm kết nối tùy chỉnh',
      closeAria: 'Đóng modal thêm kết nối tùy chỉnh',
      lead: 'Kết nối Claude với dữ liệu và công cụ của bạn.',
      nameLabel: 'Tên',
      serverUrlPlaceholder: 'Remote MCP server URL',
      advancedSettings: 'Advanced settings',
      clientIdPlaceholder: 'OAuth Client ID (optional)',
      clientSecretPlaceholder: 'OAuth Client Secret (optional)',
      hint: 'Chỉ dùng connector từ nhà phát triển bạn tin tưởng.',
      cancel: 'Hủy',
      add: 'Thêm',
    },
    detailModal: {
      title: 'Chi tiết kết nối',
      closeAria: 'Đóng chi tiết kết nối',
      tools: 'Tools',
      author: 'Tác giả',
      connectorUrl: 'Connector URL',
      documentation: 'Tài liệu',
      disconnect: 'Disconnect',
    },
    detail: {
      connectorNotFoundTitle: 'Không tìm thấy connector',
      connectorNotFound: 'Không tìm thấy connector.',
      backAllConnectors: 'Tất cả connectors',
      uninstall: 'Gỡ cài đặt',
      supportAria: 'Mở trang hỗ trợ',
      toolPermissions: 'Phân quyền công cụ',
      toolPermissionsLead: 'Chọn cách Claude được phép sử dụng các công cụ này.',
      alwaysAllow: 'Luôn cho phép',
      needsApproval: 'Cần phê duyệt',
      blocked: 'Chặn',
      allow: 'Cho phép',
      ask: 'Hỏi',
      block: 'Chặn',
    },
    groups: {
      readOnlyTools: 'Công cụ chỉ đọc',
      writeDeleteTools: 'Công cụ ghi/xóa',
    },
    services: {
      'google-drive': {
        name: 'Google Drive',
        description: 'Lưu trữ và đọc file tài liệu',
      },
      notion: {
        name: 'Notion',
        description: 'Truy cập wiki và database tài liệu',
      },
      github: {
        name: 'GitHub Integration',
        description: 'Quản lý Pull Request, Issues và Actions',
      },
      slack: {
        name: 'Slack',
        description: 'Gửi thông báo và bot chat nội bộ',
      },
      gmail: {
        name: 'Gmail',
        description: 'Đọc và tìm kiếm email trong hộp thư',
      },
      'google-calendar': {
        name: 'Google Calendar',
        description: 'Đọc lịch và sự kiện theo thời gian thực',
      },
    },
  },
  skills: {
    page: {
      headerSkill: 'Skill',
      titleWithProject: '{{name}} · Skill',
      leadPart1:
        'Skill là thư mục chứa SKILL.md (frontmatter YAML + hướng dẫn agent). Xem ',
      leadPart2: ' để biết định dạng và nơi đặt file.',
      docsLinkLabel: 'Tài liệu tạo skill',
      tabBuilder: 'Trình tạo',
      tabMarkdown: 'Markdown',
      markdownHint:
        'Chỉnh trực tiếp toàn bộ file. Chuyển lại tab Trình tạo sẽ không đồng bộ nội dung form.',
      fieldName: 'Tên skill (ID)',
      fieldNameHint: 'Chữ thường, số và gạch ngang — ví dụ my-telegram-notify',
      fieldDescription: 'Mô tả một dòng',
      fieldDescriptionHint: 'Agent đọc dòng này để biết khi nào dùng skill.',
      fieldHeading: 'Tiêu đề trong file (tùy chọn)',
      fieldHeadingHint: 'Để trống sẽ dùng tên đẹp từ ID (ví dụ my-skill → My skill).',
      fieldWhenToUse: 'Khi nào dùng',
      fieldWorkflow: 'Workflow',
      fieldNotes: 'Lưu ý',
      placeholderWhenToUse: 'Mỗi dòng một ý; sẽ thành bullet list.',
      placeholderWorkflow: 'Các bước agent nên làm, mỗi dòng một bước.',
      placeholderNotes: 'Cảnh báo, edge case…',
      placeholderMarkdown: '---\\nname: ...\\n---\\n\\n# ...',
      sectionWhenToUse: 'Khi nào dùng',
      sectionWorkflow: 'Workflow',
      sectionNotes: 'Lưu ý',
      previewTitle: 'Xem trước SKILL.md',
      copyButton: 'Sao chép',
      downloadButton: 'Tải SKILL.md',
      copySuccess: 'Đã sao chép.',
      copyFail: 'Không sao chép được.',
      downloadFilename: 'SKILL.md',
      errNameFormat:
        'Tên chỉ gồm chữ thường, số và gạch ngang; bắt đầu bằng chữ hoặc số; độ dài 3–64 ký tự.',
      errDescription: 'Mô tả là bắt buộc (tối đa 500 ký tự).',
      errGeneric: 'Kiểm tra lại các trường.',
      loading: 'Đang tải…',
      notFoundTitle: 'Không tìm thấy',
      backToList: '← Về danh sách',
      projectNotFound: 'Không tìm thấy project.',
      invalidProject: 'Mã project không hợp lệ',
    },
  },
} as const

export type ViDictionary = typeof vi
