
import { TitleHeader } from "./TitleHeader";
import { Button } from "@/components/ui";
import { I18nProvider } from "@/lib/i18n";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";


const meta: Meta<typeof TitleHeader> = {
  title: "Dashboard/TitleHeader",
  component: TitleHeader,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <I18nProvider defaultLocale="en">
        <Story />
      </I18nProvider>
    ),
  ],
  parameters: { layout: "padded" },
  args: {
    title: "AI Models",
    description: "Manage providers and API keys for this project.",
  },
};

export default meta;
type Story = StoryObj<typeof TitleHeader>;

export const Playground: Story = {};

export const WithBadge: Story = {
  args: { badge: "Beta" },
};

export const WithActions: Story = {
  args: {
    actions: <Button>New provider</Button>,
  },
};

export const WithBorder: Story = {
  args: { showBorder: true },
};

export const TitleOnly: Story = {
  args: { description: undefined },
};
