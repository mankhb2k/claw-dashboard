import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { MessageBox } from "./MessageBox";

const providerOptions = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
];

const modelOptions = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "claude-3-7-sonnet", label: "Claude 3.7 Sonnet" },
];

const composerFrame: Decorator = (Story) => (
  <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
    <Story />
  </div>
);

/** Chat composer (attachments enabled). Controlled value via local state. */
function ChatComposer() {
  const [value, setValue] = useState("");
  return (
    <MessageBox
      enableAttachments
      value={value}
      onChange={setValue}
      onSend={() => setValue("")}
      onAbort={() => {}}
      canSend={value.trim().length > 0}
      sending={false}
      placeholder="Ask the agent to do something…"
      providerId="openai"
      providerOptions={providerOptions}
      onProviderChange={() => {}}
      modelId="gpt-4o"
      modelOptions={modelOptions}
      onModelChange={() => {}}
    />
  );
}

/** Simple composer (no attachments) — e.g. agent quick prompt. */
function SimpleComposer() {
  const [value, setValue] = useState("");
  return (
    <MessageBox
      value={value}
      onChange={setValue}
      onSend={() => setValue("")}
      sending={false}
      placeholder="Type a message…"
      providerId="openai"
      providerOptions={providerOptions}
      onProviderChange={() => {}}
      modelId="gpt-4o"
      modelOptions={modelOptions}
      onModelChange={() => {}}
    />
  );
}

const meta: Meta<typeof MessageBox> = {
  title: "Chat/MessageBox",
  component: MessageBox,
  tags: ["autodocs"],
  decorators: [composerFrame],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof MessageBox>;

export const Chat: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ChatComposer />,
};

export const Simple: Story = {
  parameters: { controls: { disable: true } },
  render: () => <SimpleComposer />,
};

export const Sending: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MessageBox
      enableAttachments
      value="Generating a summary of the workspace…"
      onChange={() => {}}
      onSend={() => {}}
      onAbort={() => {}}
      canSend={false}
      sending
      providerId="openai"
      providerOptions={providerOptions}
      onProviderChange={() => {}}
      modelId="gpt-4o"
      modelOptions={modelOptions}
      onModelChange={() => {}}
    />
  ),
};
