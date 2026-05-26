import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { SearchItem } from "@/components/dashboard/SearchItem/SearchItem";

const meta: Meta<typeof SearchItem> = {
  title: "Dashboard/SearchItem",
  component: SearchItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "400px", padding: "20px", background: "var(--color-background)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SearchItem>;

/** Component wrapper để quản lý state động trong Storybook */
function SearchItemInteractive(args: any) {
  const [value, setValue] = useState(args.value || "");
  return <SearchItem {...args} value={value} onChange={setValue} />;
}

export const Interactive: Story = {
  render: (args) => <SearchItemInteractive {...args} />,
  args: {
    placeholder: "Gõ thử để trải nghiệm nút Clear...",
    id: "search-interactive",
  },
};

export const Default: Story = {
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Tìm kiếm agent, kỹ năng...",
  },
};

export const WithText: Story = {
  args: {
    value: "Claude 3.5 Sonnet",
    onChange: () => {},
    placeholder: "Tìm kiếm...",
  },
};

export const CustomPlaceholder: Story = {
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Tìm kiếm theo tên kênh kết nối...",
  },
};

export const CustomMaxWidth: Story = {
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Rộng tối đa 200px...",
    maxWidth: 200,
  },
};
