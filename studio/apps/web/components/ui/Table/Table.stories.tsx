import React from "react";

import { Flex } from "@/components/layout/Flex/Flex";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table/Table";
import { Typography } from "@/components/ui/Typography/Typography";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof Table> = {
  title: "UI/Table",
  component: Table,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    scrollable: {
      control: "boolean",
      description: "Horizontal scroll when content overflows",
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

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
      width: "100%",
      maxWidth: 960,
      padding: "24px",
      border: "1px dashed var(--color-border)",
      borderRadius: "var(--radius-md)",
      background: "var(--color-background)",
    }}
  >
    {children}
  </div>
);

const USAGE_ROWS = [
  {
    model: "GPT-4o",
    time: "2 mins ago",
    user: "Admin",
    status: "Success",
    latency: 450,
    tokens: 1240,
    color: "#10b981",
  },
  {
    model: "Claude 3.5 Sonnet",
    time: "15 mins ago",
    user: "System",
    status: "Success",
    latency: 820,
    tokens: 4200,
    color: "#f59e0b",
  },
  {
    model: "Gemini 1.5 Pro",
    time: "1 hour ago",
    user: "API Key",
    status: "Failed",
    latency: 120,
    tokens: 0,
    color: "#3b82f6",
  },
] as const;

const statusStyle: Record<string, React.CSSProperties> = {
  Success: {
    background: "color-mix(in srgb, var(--color-success) 15%, transparent)",
    color: "var(--color-success)",
  },
  Failed: {
    background: "color-mix(in srgb, var(--color-danger) 15%, transparent)",
    color: "var(--color-danger)",
  },
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Typography
      variant="xs"
      weight="bold"
      as="span"
      style={{
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: "var(--radius-full)",
        textTransform: "capitalize",
        ...statusStyle[status],
      }}
    >
      {status}
    </Typography>
  );
}

export const Default: Story = {
  render: () => (
    <DemoBox>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead label="Name" />
            <TableHead label="Role" />
            <TableHead label="Status" align="right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow hoverable>
            <TableCell>
              <Typography variant="small" weight="medium">
                Alice
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="small">Admin</Typography>
            </TableCell>
            <TableCell align="right">
              <StatusBadge status="Success" />
            </TableCell>
          </TableRow>
          <TableRow hoverable>
            <TableCell>
              <Typography variant="small" weight="medium">
                Bob
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="small">Editor</Typography>
            </TableCell>
            <TableCell align="right">
              <StatusBadge status="Failed" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </DemoBox>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <DemoLabel>Medium (default)</DemoLabel>
        <DemoBox>
          <Table size="md">
            <TableHeader>
              <TableRow>
                <TableHead label="Column" />
                <TableHead label="Value" align="right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Row A</TableCell>
                <TableCell align="right">100</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DemoBox>
      </div>
      <div>
        <DemoLabel>Small — dense lists</DemoLabel>
        <DemoBox>
          <Table size="sm">
            <TableHeader>
              <TableRow>
                <TableHead label="Column" />
                <TableHead label="Value" align="right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Row A</TableCell>
                <TableCell align="right">100</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DemoBox>
      </div>
    </div>
  ),
};

export const Alignments: Story = {
  render: () => (
    <DemoBox>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead label="Left" align="left" />
            <TableHead label="Center" align="center" />
            <TableHead label="Right" align="right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell align="left">Left cell</TableCell>
            <TableCell align="center">Center cell</TableCell>
            <TableCell align="right">Right cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </DemoBox>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <DemoLabel>Hoverable rows</DemoLabel>
        <DemoBox>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead label="Agent" />
                <TableHead label="Tokens" align="right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow hoverable>
                <TableCell>main</TableCell>
                <TableCell align="right">12,400</TableCell>
              </TableRow>
              <TableRow hoverable>
                <TableCell>support</TableCell>
                <TableCell align="right">3,200</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DemoBox>
      </div>
      <div>
        <DemoLabel>Selected row</DemoLabel>
        <DemoBox>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead label="Agent" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow selected>
                <TableCell>Selected agent</TableCell>
              </TableRow>
              <TableRow hoverable>
                <TableCell>Other agent</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DemoBox>
      </div>
      <div>
        <DemoLabel>Empty state</DemoLabel>
        <DemoBox>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead label="Name" />
                <TableHead label="Status" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty colSpan={2} message="No rows yet" />
            </TableBody>
          </Table>
        </DemoBox>
      </div>
    </div>
  ),
};

export const Scrollable: Story = {
  render: () => (
    <DemoBox>
      <Table scrollable>
        <TableHeader>
          <TableRow>
            <TableHead label="ID" />
            <TableHead label="Description" />
            <TableHead label="Owner" />
            <TableHead label="Region" />
            <TableHead label="Created" />
            <TableHead label="Amount" align="right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow hoverable>
            <TableCell>inv_001</TableCell>
            <TableCell>Enterprise annual subscription renewal</TableCell>
            <TableCell>ops@example.com</TableCell>
            <TableCell>ap-southeast-1</TableCell>
            <TableCell>2026-06-01</TableCell>
            <TableCell align="right">$12,400</TableCell>
          </TableRow>
        </TableBody>
        <TableCaption>Scroll horizontally on narrow viewports</TableCaption>
      </Table>
    </DemoBox>
  ),
};

export const DashboardUsage: Story = {
  name: "Dashboard usage (model calls)",
  render: () => (
    <DemoBox>
      <Table scrollable size="md">
        <TableHeader>
          <TableRow>
            <TableHead label="Model / Task" />
            <TableHead label="User / Source" />
            <TableHead label="Status" />
            <TableHead label="Latency" align="right" />
            <TableHead label="Tokens" align="right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {USAGE_ROWS.map((row) => (
            <TableRow key={row.model} hoverable>
              <TableCell>
                <Flex align="center" gap={12}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "var(--radius-sm)",
                      opacity: 0.8,
                      background: row.color,
                      flexShrink: 0,
                    }}
                    aria-hidden
                  />
                  <Flex direction="column" gap={2}>
                    <Typography variant="small" weight="medium">
                      {row.model}
                    </Typography>
                    <Typography variant="xs" color="muted">
                      {row.time}
                    </Typography>
                  </Flex>
                </Flex>
              </TableCell>
              <TableCell>
                <Typography variant="small">{row.user}</Typography>
              </TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell align="right">
                <Typography variant="small">{row.latency}ms</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="small" weight="bold">
                  {row.tokens.toLocaleString("en-US")}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DemoBox>
  ),
};
