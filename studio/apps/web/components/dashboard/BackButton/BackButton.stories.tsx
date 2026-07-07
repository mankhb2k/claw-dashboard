import React from "react";

import { BackButton } from "@/components/dashboard/BackButton/BackButton";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof BackButton> = {
  title: "Dashboard/BackButton",
  component: BackButton,
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/dashboard/agent/create",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div
        style={{
          padding: "20px",
          background: "var(--color-background)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
        }}
      >
        <Story />
      </div>
    ),
  ],
  argTypes: {
    href: { control: "text" },
    disabled: { control: "boolean" },
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof BackButton>;

export const IconOnly: Story = {
  args: {
    href: "/dashboard/agent",
  },
};

export const WithLabel: Story = {
  args: {
    href: "/dashboard/agent",
    children: "Edit Agent",
  },
};

export const CreateLabel: Story = {
  args: {
    href: "/dashboard/agent",
    children: "Create New Agent",
  },
};

export const CustomHref: Story = {
  args: {
    href: "/dashboard/overview",
    children: "Back to Overview",
  },
};

export const WithOnClick: Story = {
  args: {
    children: "Edit Agent",
    onClick: () => {},
  },
};

export const Disabled: Story = {
  args: {
    children: "Edit Agent",
    disabled: true,
  },
};

export const DisabledIconOnly: Story = {
  args: {
    disabled: true,
  },
};
