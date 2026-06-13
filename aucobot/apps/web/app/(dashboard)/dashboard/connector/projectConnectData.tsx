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
  /** When true, platform has a chat API and appears under messaging channels in Integrations. */
  hasChat?: boolean;
};

export const PERMISSION_GROUP_LABELS: Record<string, string> = {
  read: "Read-only tools",
  write: "Write/delete tools",
};

export const CONNECT_SERVICES: ServiceConnectData[] = [
  {
    id: "drive",
    name: "Google Drive",
    slug: "google-drive",
    type: "OAUTH",
    author: "Google",
    description: "Connect Google Drive to manage and share files.",
    iconSrc: "/tools-provider-icon/GoogleDrive-icon.svg",
  },
  {
    id: "notion",
    name: "Notion",
    slug: "notion",
    type: "MCP",
    author: "Notion",
    description: "Connect Notion to read and write databases and pages.",
    iconSrc: "/tools-provider-icon/Notion-icon.svg",
  },
  {
    id: "github",
    name: "GitHub",
    slug: "github",
    type: "OAUTH",
    author: "GitHub",
    description: "Connect GitHub to manage repositories and code.",
    iconSrc: "/tools-provider-icon/GitHub-icon.svg",
  },
  {
    id: "slack",
    name: "Slack",
    slug: "slack",
    type: "MCP",
    author: "Slack",
    description: "Connect Slack to send messages and receive notifications.",
    iconSrc: "/icons/slack.svg",
  },
  {
    id: "gmail",
    name: "Gmail",
    slug: "gmail",
    type: "OAUTH",
    author: "Google",
    description: "Connect Gmail to read and send email.",
    iconSrc: "/tools-provider-icon/Gmail-icon.svg",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    slug: "google-calendar",
    type: "OAUTH",
    author: "Google",
    description: "Connect Google Calendar to manage schedules.",
    iconSrc: "/tools-provider-icon/GoogleCalendar-icon.svg",
  },
  {
    id: "shopee",
    name: "Shopee",
    slug: "shopee",
    type: "OAUTH",
    author: "Sea Group",
    description: "Connect Shopee Seller Center: buyer chat, orders, products, and logistics.",
    iconSrc: "/tools-provider-icon/Shopee-icon.svg",
    hasChat: true,
  },
  {
    id: "tiktok-shop",
    name: "TikTok Shop",
    slug: "tiktok-shop",
    type: "OAUTH",
    author: "ByteDance",
    description: "Connect TikTok Shop: auto-reply to comments/chat, orders, and product management.",
    iconSrc: "/tools-provider-icon/TikTok-icon.svg",
    hasChat: true,
  },
];

export const findServiceBySlug = (slug: string) => CONNECT_SERVICES.find(s => s.slug === slug);
