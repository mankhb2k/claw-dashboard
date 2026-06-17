import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ChatMessageBubble } from '@/app/(dashboard)/dashboard/chat/_components/ChatMessageBubble/ChatMessageBubble'

import { withChatContentArea } from './chat-story.decorators'

type MessageBubbleStoryArgs = {
  role: 'user' | 'assistant'
  text: string
  streaming: boolean
}

const meta: Meta<MessageBubbleStoryArgs> = {
  title: 'Chat/Message/ChatMessageBubble',
  component: ChatMessageBubble,
  tags: ['autodocs'],
  decorators: [withChatContentArea],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    role: {
      control: 'select',
      options: ['user', 'assistant'],
    },
    text: {
      control: 'text',
    },
    streaming: {
      control: 'boolean',
    },
  },
  args: {
    role: 'user',
    text: 'Explain tool events in the OpenClaw gateway.',
    streaming: false,
  },
  render: (args) => <ChatMessageBubble {...args} />,
}

export default meta
type Story = StoryObj<MessageBubbleStoryArgs>

export const Playground: Story = {}

export const UserMessage: Story = {
  args: {
    role: 'user',
    text: 'Explain tool events in the OpenClaw gateway.',
  },
}

export const AssistantMarkdown: Story = {
  args: {
    role: 'assistant',
    text: `The gateway sends \`agent\` and \`session.tool\` events over WebSocket.

- **running** — tool is executing
- **done** — completed
- **error** — failed

See [docs](https://docs.openclaw.dev/chat) for more.`,
  },
}

export const AssistantStreaming: Story = {
  args: {
    role: 'assistant',
    text: 'Analyzing search results',
    streaming: true,
  },
}

export const Conversation: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      <ChatMessageBubble
        role="user"
        text="Run ls in the workspace and summarize the output."
      />
      <ChatMessageBubble
        role="assistant"
        text="I will run `ls` and read the output."
      />
      <ChatMessageBubble
        role="assistant"
        text={`Output:\n\n\`\`\`\npackage.json\nsrc/\n\`\`\``}
      />
    </>
  ),
}
