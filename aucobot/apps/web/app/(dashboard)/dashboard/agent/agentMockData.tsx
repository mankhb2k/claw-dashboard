export interface AgentItem {
  id: string;
  name: string;
  avatar: string;
  description: string;
  model: string;
  skillsCount: number;
  isActive: boolean;
  inCollaboration?: boolean;
}

export const INITIAL_AGENTS: AgentItem[] = [
  {
    id: "agent-1",
    name: "Customer Support",
    avatar: "🤖",
    description: "Giải đáp thắc mắc và hỗ trợ khách hàng tự động trên các kênh chat.",
    model: "Claude 3.5 Sonnet",
    skillsCount: 3,
    isActive: true,
  },
  {
    id: "agent-2",
    name: "Data Analyst",
    avatar: "📊",
    description: "Phân tích số liệu và trích xuất báo cáo thông minh từ cơ sở dữ liệu.",
    model: "GPT-4o",
    skillsCount: 5,
    isActive: true,
  },
  {
    id: "agent-3",
    name: "Sales Assistant",
    avatar: "💼",
    description: "Tự động tư vấn sản phẩm, báo giá và hỗ trợ chốt đơn hàng nhanh chóng.",
    model: "Gemini 1.5 Pro",
    skillsCount: 2,
    isActive: false,
  },
];

export interface AgentTemplate {
  id: string;
  name: string;
  avatar: string;
  description: string;
  model: string;
  vibe: 'professional' | 'friendly' | 'strict';
  toolsProfile: 'full' | 'coding' | 'messaging' | 'minimal';
  sandboxEnabled: boolean;
  bootstrapFiles: {
    identity: string;
    soul: string;
    agents: string;
  };
}

export const INITIAL_TEMPLATES: AgentTemplate[] = [
  {
    id: "empty",
    name: "Agent Tự Thiết Kế",
    avatar: "⚙️",
    description: "Tự do cấu hình hoàn toàn từ con số không. Thích hợp cho chuyên gia muốn xây dựng logic riêng biệt.",
    model: "claude-3-5-sonnet",
    vibe: "professional",
    toolsProfile: "minimal",
    sandboxEnabled: false,
    bootstrapFiles: {
      identity: "# Tên Agent\n- Mô tả chung về trợ lý.",
      soul: "# LINH HỒN (SOUL.md)\n- Định hình tính cách và các giới hạn đạo đức.",
      agents: "# CHỈ THỊ (AGENTS.md)\n- Các quy tắc thực thi và kịch bản hỗ trợ.",
    },
  },
  {
    id: "customer-support",
    name: "Trợ Lý Hỗ Trợ Khách Hàng",
    avatar: "🤖",
    description: "Giao tiếp lịch thiệp, hỗ trợ giải đáp thắc mắc, phân loại yêu cầu và lưu giữ hội thoại tốt.",
    model: "gemini-1-5-pro",
    vibe: "friendly",
    toolsProfile: "messaging",
    sandboxEnabled: false,
    bootstrapFiles: {
      identity: "# Trợ Lý Hỗ Trợ Khách Hàng\n- Emoji: 🤖\n- Phong cách: Ân cần, lắng nghe, chu đáo.",
      soul: "# LINH HỒN (SOUL.md)\n- Bạn là đại diện hỗ trợ kỹ thuật và chăm sóc khách hàng của OpenClaw.\n- Luôn kiên nhẫn, thấu hiểu và xoa dịu những khách hàng đang bực bội.",
      agents: "# CHỈ THỊ (AGENTS.md)\n- Hỗ trợ giải đáp các thắc mắc về sản phẩm và dịch vụ.\n- Phân loại yêu cầu của người dùng để chuyển tiếp lên kỹ thuật nếu cần.\n- Sử dụng memory_search để nhớ lịch sử và thông tin khách hàng qua các phiên làm việc.",
    },
  },
  {
    id: "coding-assistant",
    name: "Kỹ Sư Lập Trình AI",
    avatar: "💻",
    description: "Đọc, sửa, viết code chuẩn mực. Tích hợp sâu hệ thống file để tự động hóa lập trình và debug.",
    model: "claude-3-5-sonnet",
    vibe: "strict",
    toolsProfile: "coding",
    sandboxEnabled: true,
    bootstrapFiles: {
      identity: "# Kỹ Sư Lập Trình AI\n- Emoji: 💻\n- Phong cách: Cực kỳ ngắn gọn, kỹ thuật, logic.",
      soul: "# LINH HỒN (SOUL.md)\n- Bạn là một lập trình viên cao cấp, viết code sạch (clean code) theo tiêu chuẩn công nghiệp.\n- Trả lời trực tiếp vào giải pháp kỹ thuật, tránh rườm rà sáo rỗng.",
      agents: "# CHỈ THỊ (AGENTS.md)\n- Sử dụng các công cụ hệ thống file (read/write/edit/apply_patch) để trực tiếp xem và sửa đổi mã nguồn.\n- Luôn kiểm tra tính toàn vẹn và thực thi chạy thử code trước khi hoàn thành task.\n- Viết hướng dẫn ngắn kèm chú thích trong code.",
    },
  },
  {
    id: "data-analyst",
    name: "Chuyên Gia Phân Tích & Tra Cứu",
    avatar: "📊",
    description: "Tra cứu web thời gian thực, đọc hiểu tài liệu, phân tích số liệu và xuất báo cáo trực quan.",
    model: "gpt-4o",
    vibe: "professional",
    toolsProfile: "full",
    sandboxEnabled: true,
    bootstrapFiles: {
      identity: "# Chuyên Gia Phân Tích & Tra Cứu\n- Emoji: 📊\n- Phong cách: Khoa học, khách quan, dữ liệu thực tế.",
      soul: "# LINH HỒN (SOUL.md)\n- Bạn là nhà nghiên cứu thị trường và phân tích số liệu.\n- Chỉ đưa ra thông tin dựa trên dữ kiện thực tế có thể kiểm chứng. Tránh phán đoán chủ quan.",
      agents: "# CHỈ THỊ (AGENTS.md)\n- Sử dụng công cụ web_search để cập nhật thông tin nóng hổi nhất từ Internet.\n- Sử dụng browser để cào dữ liệu chuyên sâu và code_execution để phân tích các tập tin CSV/Excel.\n- Xuất báo cáo theo dạng biểu bảng trực quan, cấu trúc rõ ràng.",
    },
  },
  {
    id: "orchestrator",
    name: "Tổng Đài Điều Phối Đa Agent",
    avatar: "🧠",
    description: "Phân chia công việc phức tạp thành các task nhỏ và giao phó cho các Sub-agents phù hợp.",
    model: "gemini-1-5-pro",
    vibe: "professional",
    toolsProfile: "full",
    sandboxEnabled: false,
    bootstrapFiles: {
      identity: "# Tổng Đài Điều Phối Đa Agent\n- Emoji: 🧠\n- Phong cách: Có tầm nhìn, tổ chức, quản lý xuất sắc.",
      soul: "# LINH HỒN (SOUL.md)\n- Bạn là tổng đài trưởng điều phối hệ thống đa tác nhân (Multi-Agent Systems).\n- Mục tiêu của bạn là tối đa hóa hiệu quả bằng cách giao việc cho các sub-agents chuyên môn cao.",
      agents: "# CHỈ THỊ (AGENTS.md)\n- Khi nhận yêu cầu phức tạp từ người dùng, hãy chia nhỏ thành các nhiệm vụ con.\n- Sử dụng công cụ subagents để triệu gọi các Agent phụ (như Kỹ sư lập trình hoặc Chuyên gia tra cứu) để xử lý.\n- Kiểm tra chéo kết quả từ các Agent phụ trước khi tổng hợp gửi báo cáo hoàn chỉnh cho người dùng.",
    },
  },
];

export interface ApiKeyItem {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

export interface FacebookConfig {
  pageId: string;
  pageAccessToken: string;
  webhookUrl: string;
  verifyToken: string;
  isConnected: boolean;
}

export const MOCK_API_KEYS: ApiKeyItem[] = [
  {
    id: "key-1",
    name: "Website Chatbot (Sản xuất)",
    token: "sk-claw-w8a927c6b12f45ea9834bc6293f3c12a",
    createdAt: "2026-05-18",
  },
  {
    id: "key-2",
    name: "REST API Integration",
    token: "sk-claw-m5b8210cd45a8356782ffce111aa990b",
    createdAt: "2026-05-19",
  }
];

// ─── Agent ↔ Channel Assignment ────────────────────────────────────────────
// Mapping: Agent này lắng nghe kênh nào (từ CHANNEL_PROVIDERS)

export interface AgentChannelAssignment {
  /** id tương ứng với ChannelData.id trong CHANNEL_PROVIDERS */
  channelId: string;
  isActive: boolean;
  /** true = kênh này đã được user cấu hình ở tab Channel của Project */
  isConnectedAtProject: boolean;
  config?: {
    replyMode: "all" | "mention-only" | "private-only";
  };
}

export const MOCK_AGENT_CHANNELS: AgentChannelAssignment[] = [
  {
    channelId: "telegram",
    isActive: true,
    isConnectedAtProject: true,
    config: { replyMode: "all" },
  },
  {
    channelId: "facebook-messenger",
    isActive: true,
    isConnectedAtProject: true,
    config: { replyMode: "all" },
  },
  {
    channelId: "zalo",
    isActive: false,
    isConnectedAtProject: true,
    config: { replyMode: "all" },
  },
  {
    channelId: "whatsapp",
    isActive: false,
    isConnectedAtProject: false,
  },
  {
    channelId: "discord",
    isActive: false,
    isConnectedAtProject: false,
  },
  {
    channelId: "slack",
    isActive: false,
    isConnectedAtProject: false,
  },
];

// ─── Agent ↔ Connector Assignment ──────────────────────────────────────────
// Mapping: Agent này được dùng connector nào (từ CONNECT_SERVICES)
// Bao gồm cả e-commerce platforms (Shopee, TikTok) với hasChat=true

export type ConnectorPermission = "read" | "write" | "full";

export interface AgentConnectorAssignment {
  /** slug tương ứng với ServiceConnectData.slug trong CONNECT_SERVICES */
  connectorSlug: string;
  isActive: boolean;
  /** true = connector này đã được user OAuth ở tab Connect của Project */
  isConnectedAtProject: boolean;
  permission: ConnectorPermission;
  /** Nếu connector có hasChat=true, agent có dùng chat capability không */
  chatEnabled?: boolean;
}

export const MOCK_AGENT_CONNECTORS: AgentConnectorAssignment[] = [
  {
    connectorSlug: "shopee",
    isActive: true,
    isConnectedAtProject: true,
    permission: "full",
    chatEnabled: true,
  },
  {
    connectorSlug: "tiktok-shop",
    isActive: false,
    isConnectedAtProject: true,
    permission: "read",
    chatEnabled: false,
  },
  {
    connectorSlug: "google-drive",
    isActive: true,
    isConnectedAtProject: true,
    permission: "read",
  },
  {
    connectorSlug: "notion",
    isActive: false,
    isConnectedAtProject: true,
    permission: "read",
  },
  {
    connectorSlug: "github",
    isActive: false,
    isConnectedAtProject: false,
    permission: "read",
  },
  {
    connectorSlug: "gmail",
    isActive: false,
    isConnectedAtProject: false,
    permission: "read",
  },
];



