import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Header } from "@/components/dashboard/Header/Header";
import { I18nProvider } from "@/lib/i18n";
import {
  LayoutDashboard,
  Brain,
  MessageSquareCodeIcon,
  Sparkles,
  Cable,
  Settings as SettingsIcon,
} from "lucide-react";

const meta: Meta<typeof Header> = {
  title: "Dashboard/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <I18nProvider defaultLocale="en">
        <div style={{ width: "100%", minHeight: "100px" }}>
          <Story />
        </div>
      </I18nProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Header>;

const mockItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    isActive: (p: string) => p === "/dashboard",
  },
  {
    href: "/dashboard/model",
    label: "AI Model",
    icon: Brain,
    isActive: (p: string) => p === "/dashboard/model",
  },
  {
    href: "/dashboard/channel",
    label: "Channels",
    icon: MessageSquareCodeIcon,
    isActive: (p: string) => p === "/dashboard/channel",
  },
  {
    href: "/dashboard/skill",
    label: "Skill",
    icon: Sparkles,
    isActive: (p: string) => p === "/dashboard/skill",
  },
  {
    href: "/dashboard/connector",
    label: "Connect",
    icon: Cable,
    isActive: (p: string) => p === "/dashboard/connector",
  },
  {
    href: "/dashboard/setting",
    label: "Settings",
    icon: SettingsIcon,
    isActive: (p: string) => p === "/dashboard/setting",
  },
];

export const Default: Story = {
  args: {
    title: "Channels",
    items: mockItems,
  },
};

export const WithoutNav: Story = {
  args: {
    title: "Project Overview",
    items: [],
  },
};
