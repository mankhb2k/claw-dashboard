"use client";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React, { useState } from "react";
import { CodeBlock } from "@/components/ui/CodeBlock/CodeBlock";
import { Code, FileCode, Rocket, Terminal } from "lucide-react";

const SAMPLE_SCRIPT = `<script src="https://cdn.example.com/widget.js" data-agent="agent-1"></script>`;

const SNIPPETS = {
  curl: `curl https://api.example.com/v1/chat \\
  -H "Authorization: Bearer sk-..." \\
  -d '{"messages":[{"role":"user","content":"Hello"}]}'`,
  node: `import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.API_KEY });
const res = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello" }],
});`,
  python: `from openai import OpenAI

client = OpenAI(api_key="sk-...")
res = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)`,
};

const SNIPPET_TABS = [
  { value: "curl" as const, label: "cURL", icon: <Terminal size={12} aria-hidden /> },
  { value: "node" as const, label: "Node.js", icon: <Code size={12} aria-hidden /> },
  { value: "python" as const, label: "Python", icon: <FileCode size={12} aria-hidden /> },
];

const meta: Meta<typeof CodeBlock> = {
  title: "UI/CodeBlock",
  component: CodeBlock,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "compact"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

const StoryWrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: "min(640px, 100%)", maxWidth: "100%" }}>{children}</div>
);

export const Default: Story = {
  render: () => (
    <StoryWrap>
      <CodeBlock
        title="Chat widget script"
        icon={<Rocket size={16} aria-hidden />}
        code={SAMPLE_SCRIPT}
      />
    </StoryWrap>
  ),
};

export const WithTabs: Story = {
  render: function WithTabsStory() {
    const [tab, setTab] = useState<"curl" | "node" | "python">("curl");

    return (
      <StoryWrap>
        <CodeBlock
          code={SNIPPETS[tab]}
          tabs={SNIPPET_TABS}
          activeTab={tab}
          onTabChange={setTab}
        />
      </StoryWrap>
    );
  },
};

export const WithTabsTrailing: Story = {
  render: function WithTabsTrailingStory() {
    const [tab, setTab] = useState<"curl" | "node" | "python">("curl");

    return (
      <StoryWrap>
        <CodeBlock
          code={SNIPPETS[tab]}
          tabs={SNIPPET_TABS}
          activeTab={tab}
          onTabChange={setTab}
          tabTrailing="REST API"
        />
      </StoryWrap>
    );
  },
};

export const Compact: Story = {
  render: () => (
    <StoryWrap>
      <CodeBlock
        variant="compact"
        title="Short snippet"
        code={`export const AGENT_ID = "agent-1";`}
      />
    </StoryWrap>
  ),
};

export const Scrollable: Story = {
  render: () => (
    <StoryWrap>
      <CodeBlock
        title="Long output"
        code={SNIPPETS.node}
        maxHeight={160}
      />
    </StoryWrap>
  ),
};

export const NoHeader: Story = {
  render: () => (
    <StoryWrap>
      <CodeBlock code={`console.log("plain block");`} showHeader={false} showCopy={false} />
    </StoryWrap>
  ),
};

export const CopyDisabled: Story = {
  render: () => (
    <StoryWrap>
      <CodeBlock title="Read only" code={SAMPLE_SCRIPT} showCopy={false} />
    </StoryWrap>
  ),
};
