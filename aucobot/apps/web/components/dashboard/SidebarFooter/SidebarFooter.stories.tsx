import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { I18nProvider } from "@/lib/i18n";

import { SidebarFooter } from "./SidebarFooter";

/** Sidebar-sized frame so spacing matches the real shell. */
const frameStyle = (width: number): CSSProperties => ({
  width,
  padding: "var(--space-3)",
  background: "var(--color-card-background)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
});

const meta: Meta<typeof SidebarFooter> = {
  title: "Dashboard/SidebarFooter",
  component: SidebarFooter,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <I18nProvider defaultLocale="en">
        <Story />
      </I18nProvider>
    ),
  ],
  parameters: { layout: "centered" },
  args: { collapsed: false },
};

export default meta;
type Story = StoryObj<typeof SidebarFooter>;

export const Expanded: Story = {
  args: { collapsed: false },
  decorators: [
    (Story) => (
      <div style={frameStyle(248)}>
        <Story />
      </div>
    ),
  ],
};

export const Collapsed: Story = {
  args: { collapsed: true },
  decorators: [
    (Story) => (
      <div style={frameStyle(72)}>
        <Story />
      </div>
    ),
  ],
};
