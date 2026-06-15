import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { Select } from "@/components/ui/Select/Select";
import { Card } from "@/components/ui/Card/Card";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Select>;

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

const DemoBox = ({
  children,
  width = "450px",
}: {
  children: React.ReactNode;
  width?: string;
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      padding: "40px",
      width: width,
      borderRadius: "var(--radius-lg)",
      background: "var(--color-background)",
      border: "1px solid var(--color-border)",
    }}
  >
    {children}
  </div>
);

export const Default: Story = {
  args: {
    id: "select-default",
    label: "Choose AI model",
    labelPosition: "top",
    placeholder: "Select a model...",
    options: [
      { value: "gpt-4o", label: "GPT-4o (OpenAI)" },
      { value: "claude-3-5", label: "Claude 3.5 Sonnet (Anthropic)" },
      { value: "gemini-1-5", label: "Gemini 1.5 Pro (Google)" },
      { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash (DeepSeek)" },
    ],
  },
};

export const LabelPositions: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <section>
        <DemoLabel>Label on top (top)</DemoLabel>
        <DemoBox>
          <Select
            id="select-label-top"
            label="AI model"
            labelPosition="top"
            defaultValue="gpt-4o"
            options={[
              { value: "gpt-4o", label: "GPT-4o" },
              { value: "claude-3-5", label: "Claude 3.5" },
            ]}
          />
        </DemoBox>
      </section>

      <section>
        <DemoLabel>Label on left (left)</DemoLabel>
        <DemoBox>
          <Select
            id="select-label-left"
            label="Region"
            labelPosition="left"
            defaultValue="sg"
            options={[
              { value: "sg", label: "Singapore" },
              { value: "us", label: "United States" },
            ]}
          />
        </DemoBox>
      </section>

      <section>
        <DemoLabel>Label on right (right)</DemoLabel>
        <DemoBox>
          <Select
            id="select-label-right"
            label="Plan"
            labelPosition="right"
            defaultValue="pro"
            options={[
              { value: "free", label: "Free" },
              { value: "pro", label: "Pro" },
            ]}
          />
        </DemoBox>
      </section>

      <section>
        <DemoLabel>No label (none)</DemoLabel>
        <DemoBox>
          <Select
            id="select-label-none"
            label="Hidden label"
            labelPosition="none"
            placeholder="Select an option..."
            options={[
              { value: "a", label: "Option A" },
              { value: "b", label: "Option B" },
            ]}
          />
        </DemoBox>
      </section>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <section>
        <DemoLabel>Default & placeholder</DemoLabel>
        <DemoBox>
          <Select
            id="select-normal"
            label="Deployment region"
            placeholder="Select server..."
            options={[
              { value: "sg", label: "Singapore (Asia Southeast)" },
              { value: "us", label: "United States (North America)" },
              { value: "eu", label: "Frankfurt (Europe Central)" },
            ]}
          />
        </DemoBox>
      </section>

      <section>
        <DemoLabel>Validation error</DemoLabel>
        <DemoBox>
          <Select
            id="select-error"
            label="Membership plan"
            error="Please select a plan to continue"
            options={[
              { value: "free", label: "Free" },
              { value: "pro", label: "Pro" },
              { value: "ent", label: "Enterprise" },
            ]}
          />
        </DemoBox>
      </section>

      <section>
        <DemoLabel>Disabled</DemoLabel>
        <DemoBox>
          <Select
            id="select-disabled"
            label="Payment gateway (maintenance)"
            defaultValue="stripe"
            disabled
            options={[
              { value: "stripe", label: "Stripe" },
              { value: "paypal", label: "PayPal" },
              { value: "vietqr", label: "VietQR" },
            ]}
          />
        </DemoBox>
      </section>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div style={{ padding: "40px" }}>
      <DemoLabel>Inside a card (real-world)</DemoLabel>
      <Card style={{ width: "400px", padding: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              borderBottom: "1px solid var(--color-border)",
              paddingBottom: "16px",
              marginBottom: "8px",
            }}
          >
            <h3 style={{ fontWeight: 600, fontSize: "16px" }}>
              Project settings
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "var(--color-muted-foreground)",
              }}
            >
              Configure basic parameters for your project.
            </p>
          </div>

          <Select
            id="project-type"
            label="Project type"
            defaultValue="nextjs"
            options={[
              { value: "nextjs", label: "Next.js Web Application" },
              { value: "nestjs", label: "NestJS Backend API" },
              { value: "python", label: "Python Automation" },
            ]}
          />

          <Select
            id="project-visibility"
            label="Visibility"
            defaultValue="private"
            options={[
              { value: "private", label: "Private" },
              { value: "public", label: "Public" },
            ]}
          />

          <div
            style={{
              marginTop: "8px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              style={{
                padding: "8px 16px",
                background: "var(--color-primary)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontWeight: 500,
                fontSize: "14px",
              }}
            >
              Save changes
            </button>
          </div>
        </div>
      </Card>
    </div>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <DemoBox width="220px">
      <DemoLabel>size=&quot;sm&quot; (composer / toolbar)</DemoLabel>
      <Select
        id="composer-provider"
        labelPosition="none"
        size="sm"
        defaultValue="gemini"
        options={[
          { value: "gemini", label: "Google Gemini" },
          { value: "openai", label: "OpenAI" },
        ]}
      />
      <Select
        id="composer-model"
        labelPosition="none"
        size="sm"
        defaultValue="flash"
        options={[
          { value: "flash", label: "Gemini 2.5 Flash" },
          { value: "pro", label: "Gemini 2.5 Pro" },
        ]}
      />
    </DemoBox>
  ),
};
