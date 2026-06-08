import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React, { useMemo, useState } from "react";
import {
  Activity,
  Brain,
  CalendarClock,
  Rocket,
  UserRoundPen,
  Wrench,
} from "lucide-react";
import { Tabs, type TabItem } from "@/components/ui/Tabs/Tabs";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["section", "panel"],
      description: "section = Bot Agent nav; panel = Agent edit form",
    },
    showIndicator: {
      control: "boolean",
      description: "Sliding underline under active tab",
    },
    value: {
      control: "text",
    },
    "aria-label": {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

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

const SECTION_ITEMS: TabItem[] = [
  { value: "agents", label: "Agents", href: "#" },
  { value: "collaboration", label: "Collaboration", href: "#", badge: 3 },
  {
    value: "schedules",
    label: "Schedules",
    href: "#",
    badge: 1,
    badgeTone: "danger",
  },
  { value: "heartbeat", label: "Heartbeat", href: "#" },
];

const PANEL_ITEMS: TabItem[] = [
  { value: "identity", label: "Identity", icon: <UserRoundPen size={16} /> },
  { value: "instructions", label: "Instructions", icon: <Brain size={16} /> },
  { value: "capabilities", label: "Capabilities", icon: <Wrench size={16} /> },
  { value: "integrations", label: "Integrations", icon: <Rocket size={16} /> },
  { value: "schedules", label: "Schedules", icon: <CalendarClock size={16} /> },
  { value: "heartbeat", label: "Heartbeat", icon: <Activity size={16} /> },
];

const PANEL_ITEMS_TEXT_ONLY: TabItem[] = PANEL_ITEMS.map(
  ({ value, label }) => ({
    value,
    label,
  }),
);

function TabsPlayground({
  variant = "section",
  showIndicator = true,
  withIcons = false,
  initialValue,
}: {
  variant?: "section" | "panel";
  showIndicator?: boolean;
  withIcons?: boolean;
  initialValue?: string;
}) {
  const items = useMemo(
    () =>
      variant === "section"
        ? SECTION_ITEMS
        : withIcons
          ? PANEL_ITEMS
          : PANEL_ITEMS_TEXT_ONLY,
    [variant, withIcons],
  );
  const [value, setValue] = useState(initialValue ?? items[0]?.value ?? "");

  return (
    <Tabs
      items={items}
      value={value}
      onValueChange={setValue}
      variant={variant}
      showIndicator={showIndicator}
      aria-label={
        variant === "section" ? "Agent section" : "Agent form sections"
      }
    />
  );
}

export const Playground: Story = {
  render: (args) => (
    <TabsPlayground
      variant={args.variant ?? "section"}
      showIndicator={args.showIndicator ?? true}
      withIcons={args.variant === "panel"}
    />
  ),
  args: {
    variant: "section",
    showIndicator: true,
    "aria-label": "Tabs",
  },
};

/** Bot Agent — text tabs + bottom indicator (no icons) */
export const BotAgentSection: Story = {
  render: () => (
    <div>
      <DemoLabel>
        Bot Agent section nav (variant=&quot;section&quot;, showIndicator)
      </DemoLabel>
      <TabsPlayground variant="section" showIndicator initialValue="agents" />
    </div>
  ),
};

/** AgentID edit form — icons, no bottom indicator */
export const AgentIdPanel: Story = {
  render: () => (
    <div>
      <DemoLabel>
        Agent ID panel tabs (variant=&quot;panel&quot;, showIndicator=false)
      </DemoLabel>
      <TabsPlayground
        variant="panel"
        showIndicator={false}
        withIcons
        initialValue="identity"
      />
    </div>
  ),
};

/** Panel tabs without icons */
export const PanelTextOnly: Story = {
  render: () => (
    <div>
      <DemoLabel>Panel tabs — text only, no indicator</DemoLabel>
      <TabsPlayground
        variant="panel"
        showIndicator={false}
        withIcons={false}
        initialValue="identity"
      />
    </div>
  ),
};

/** Section with indicator off */
export const SectionNoIndicator: Story = {
  render: () => (
    <div>
      <DemoLabel>Section tabs — indicator disabled</DemoLabel>
      <TabsPlayground
        variant="section"
        showIndicator={false}
        initialValue="collaboration"
      />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        maxWidth: 720,
      }}
    >
      <div>
        <DemoLabel>With indicator + icons (panel)</DemoLabel>
        <TabsPlayground
          variant="panel"
          showIndicator
          withIcons
          initialValue="capabilities"
        />
      </div>
      <div>
        <DemoLabel>Without indicator + icons (Agent ID)</DemoLabel>
        <TabsPlayground
          variant="panel"
          showIndicator={false}
          withIcons
          initialValue="identity"
        />
      </div>
      <div>
        <DemoLabel>Section nav + badges</DemoLabel>
        <TabsPlayground
          variant="section"
          showIndicator
          initialValue="schedules"
        />
      </div>
      <div>
        <DemoLabel>Section — text only, no indicator</DemoLabel>
        <TabsPlayground
          variant="section"
          showIndicator={false}
          initialValue="heartbeat"
        />
      </div>
    </div>
  ),
};
