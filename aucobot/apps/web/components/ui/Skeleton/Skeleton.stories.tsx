import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { Card, Typography } from "@/components/ui";
import { Flex } from "@/components/layout";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["block", "text", "textSm", "circle"],
      description: "Preset shape",
    },
    width: {
      control: "text",
      description: "Width (px number or CSS value)",
    },
    height: {
      control: "text",
      description: "Height (px number or CSS value)",
    },
    pulse: {
      control: "boolean",
      description: "Shimmer pulse animation",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

const DemoLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="xs" color="muted" style={{ marginBottom: 8, display: "block" }}>
    {children}
  </Typography>
);

export const Default: Story = {
  args: {
    variant: "text",
    width: "240px",
    pulse: true,
  },
};

export const Variants: Story = {
  render: () => (
    <Flex direction="column" gap={24} style={{ maxWidth: 320 }}>
      <div>
        <DemoLabel>text — title line</DemoLabel>
        <Skeleton variant="text" width="72%" />
      </div>
      <div>
        <DemoLabel>textSm — secondary line</DemoLabel>
        <Skeleton variant="textSm" width="100%" />
      </div>
      <div>
        <DemoLabel>block — button / custom block</DemoLabel>
        <Skeleton variant="block" width={72} height={32} />
      </div>
      <div>
        <DemoLabel>circle — avatar</DemoLabel>
        <Skeleton variant="circle" width={40} height={40} />
      </div>
    </Flex>
  ),
};

export const Pulse: Story = {
  render: () => (
    <Flex direction="column" gap={16}>
      <div>
        <DemoLabel>pulse ON</DemoLabel>
        <Skeleton variant="text" width="200px" pulse />
      </div>
      <div>
        <DemoLabel>pulse OFF</DemoLabel>
        <Skeleton variant="text" width="200px" pulse={false} />
      </div>
    </Flex>
  ),
};

/** Multiple Skeletons — CardSkillStore layout pattern */
export const CardSkillStoreLayout: Story = {
  render: () => (
    <Card disableHover style={{ width: 320, padding: "var(--space-4)" }}>
      <Flex direction="column" gap="var(--space-3)" fullWidth>
        <Skeleton variant="text" width="72%" height={16} />
        <Flex justify="between" align="start" gap="var(--space-3)" fullWidth>
          <Skeleton variant="textSm" width="100%" style={{ flex: 1, minWidth: 0 }} />
          <Skeleton variant="block" width={72} height={32} />
        </Flex>
        <Flex justify="between" align="center" fullWidth>
          <Skeleton variant="textSm" width="40%" />
          <Flex align="center" gap="var(--space-2)">
            <Skeleton variant="textSm" width={36} />
            <Skeleton variant="textSm" width={36} />
          </Flex>
        </Flex>
      </Flex>
    </Card>
  ),
};

/** Two skeleton cards in a 2-column grid */
export const GridLoading: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 280px))",
        gap: "var(--space-4)",
      }}
    >
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i} disableHover style={{ padding: "var(--space-4)", minHeight: "8.5rem" }}>
          <Flex direction="column" gap="var(--space-3)" fullWidth>
            <Skeleton variant="text" width="65%" />
            <Flex justify="between" gap="var(--space-3)" fullWidth>
              <Skeleton variant="textSm" width="100%" style={{ flex: 1 }} />
              <Skeleton variant="block" width={64} height={28} />
            </Flex>
            <Flex justify="between" fullWidth>
              <Skeleton variant="textSm" width="35%" />
              <Skeleton variant="textSm" width={56} />
            </Flex>
          </Flex>
        </Card>
      ))}
    </div>
  ),
};

export const WithTypography: Story = {
  render: () => (
    <Flex direction="column" gap={8} style={{ maxWidth: 280 }}>
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="textSm" width="100%" />
      <Skeleton variant="textSm" width="60%" />
      <Typography variant="small" color="muted" style={{ marginTop: 8 }}>
        After loading, the bars above are replaced with real content.
      </Typography>
    </Flex>
  ),
};
