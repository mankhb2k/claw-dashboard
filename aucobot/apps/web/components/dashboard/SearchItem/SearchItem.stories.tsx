import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React, { useState } from "react";
import { SearchItem } from "@/components/dashboard/SearchItem/SearchItem";

const meta: Meta<typeof SearchItem> = {
  title: "Dashboard/SearchItem",
  component: SearchItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md"],
    },
    maxWidth: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearchItem>;

const DemoLabel = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: "var(--color-muted-foreground)",
      fontWeight: 600,
      marginBottom: "12px",
    }}
  >
    {children}
  </p>
);

const DemoBox = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      padding: "32px",
      minWidth: "400px",
      border: "1px dashed var(--color-border)",
      borderRadius: "var(--radius-md)",
      background: "var(--color-background)",
    }}
  >
    {children}
  </div>
);

function SearchItemInteractive(args: React.ComponentProps<typeof SearchItem>) {
  const [value, setValue] = useState(args.value || "");
  return <SearchItem {...args} value={value} onChange={setValue} />;
}

export const Default: Story = {
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Search agents, skills...",
    size: "md",
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <DemoLabel>Sizes</DemoLabel>
        <DemoBox>
          <SearchItem
            id="search-size-md"
            value=""
            onChange={() => {}}
            placeholder="Medium (default)"
            size="md"
          />
          <SearchItem
            id="search-size-sm"
            value=""
            onChange={() => {}}
            placeholder="Small"
            size="sm"
          />
        </DemoBox>
      </div>
    </div>
  ),
};

export const WithText: Story = {
  args: {
    value: "Claude 3.5 Sonnet",
    onChange: () => {},
    placeholder: "Searching...",
    size: "md",
  },
};

export const Interactive: Story = {
  render: (args) => <SearchItemInteractive {...args} />,
  args: {
    placeholder: "Type to try the clear button...",
    id: "search-interactive",
    size: "md",
  },
};

export const CustomPlaceholder: Story = {
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Search by connector name...",
    size: "md",
  },
};

export const CustomMaxWidth: Story = {
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Max width 200px...",
    maxWidth: 200,
    size: "md",
  },
};
