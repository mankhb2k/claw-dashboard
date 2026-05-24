import React from "react";

export type ServiceType = "MCP" | "API" | "OAUTH";

export type PermissionMode = "allow" | "ask" | "block";

export type PermissionGroupData = {
  id: string;
  labelKey: string;
  tools: string[];
};

export const MOCK_PERMISSION_GROUPS: PermissionGroupData[] = [
  {
    id: "read",
    labelKey: "read",
    tools: ["read_drive", "read_calendar"],
  },
  {
    id: "write",
    labelKey: "write",
    tools: ["write_drive", "write_calendar"],
  },
];

export type ServiceConnectData = {
  id: string;
  name: string;
  slug: string;
  type: ServiceType;
  author: string;
  iconSrc?: string;
  description: string;
  supportUrl?: string;
  /** true = platform này có cả chat API, sẽ xuất hiện ở phần Kênh nhắn tin trong tab Integrations */
  hasChat?: boolean;
};

export const CONNECT_SERVICES: ServiceConnectData[] = [
  {
    id: "drive",
    name: "Google Drive",
    slug: "google-drive",
    type: "OAUTH",
    author: "Google",
    description: "Kết nối với Google Drive để quản lý và chia sẻ file.",
    iconSrc: "/tools-provider-icon/GoogleDrive-icon.svg",
  },
  {
    id: "notion",
    name: "Notion",
    slug: "notion",
    type: "MCP",
    author: "Notion",
    description: "Kết nối với Notion để đọc/ghi database và trang tài liệu.",
    iconSrc: "/tools-provider-icon/Notion-icon.svg",
  },
  {
    id: "github",
    name: "GitHub",
    slug: "github",
    type: "OAUTH",
    author: "GitHub",
    description: "Kết nối với GitHub để quản lý repository và code.",
    iconSrc: "/tools-provider-icon/GitHub-icon.svg",
  },
  {
    id: "slack",
    name: "Slack",
    slug: "slack",
    type: "MCP",
    author: "Slack",
    description: "Kết nối với Slack để gửi tin nhắn và nhận thông báo.",
    iconSrc: "/icons/slack.svg",
  },
  {
    id: "gmail",
    name: "Gmail",
    slug: "gmail",
    type: "OAUTH",
    author: "Google",
    description: "Kết nối với Gmail để đọc và gửi email.",
    iconSrc: "/tools-provider-icon/Gmail-icon.svg",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    slug: "google-calendar",
    type: "OAUTH",
    author: "Google",
    description: "Kết nối với Google Calendar để quản lý lịch trình.",
    iconSrc: "/tools-provider-icon/GoogleCalendar-icon.svg",
  },
  {
    id: "shopee",
    name: "Shopee",
    slug: "shopee",
    type: "OAUTH",
    author: "Sea Group",
    description: "Kết nối Shopee Seller Center: trả lời chat mua hàng, tra cứu đơn hàng, quản lý sản phẩm và logistics.",
    iconSrc: "/tools-provider-icon/Shopee-icon.svg",
    hasChat: true,
  },
  {
    id: "tiktok-shop",
    name: "TikTok Shop",
    slug: "tiktok-shop",
    type: "OAUTH",
    author: "ByteDance",
    description: "Kết nối TikTok Shop: tự động trả lời bình luận/chat, quản lý đơn hàng và sản phẩm trên TikTok.",
    iconSrc: "/tools-provider-icon/TikTok-icon.svg",
    hasChat: true,
  },
];

export const findServiceBySlug = (slug: string) => CONNECT_SERVICES.find(s => s.slug === slug);
