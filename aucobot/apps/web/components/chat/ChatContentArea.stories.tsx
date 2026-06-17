import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ChatLiveThread } from '@/app/(dashboard)/dashboard/chat/_components/ChatLiveThread/ChatLiveThread'
import { ChatMessageBubble } from '@/app/(dashboard)/dashboard/chat/_components/ChatMessageBubble/ChatMessageBubble'
import { ToolActivityCard } from '@/app/(dashboard)/dashboard/chat/_components/ToolActivityCard/ToolActivityCard'

import { withChatContentArea } from './chat-story.decorators'
import { StorySectionLabel } from './story-demo-ui'
import {
  RESEARCH_PRESET_OPTIONS,
  STATUS_OPTIONS,
  buildResearchEntries,
  buildStoryToolEntry,
  toolCardArgTypes,
  toolCardDefaultArgs,
  type ToolCardStoryArgs,
} from './tool-activity.story-controls'

type ContentAreaStoryArgs = ToolCardStoryArgs & {
  scenario: 'tool_flow' | 'tool_error' | 'research' | 'preparing'
  researchPreset: (typeof RESEARCH_PRESET_OPTIONS)[number]
}

const meta: Meta<ContentAreaStoryArgs> = {
  title: 'Chat/ContentArea',
  tags: ['autodocs'],
  decorators: [withChatContentArea],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    scenario: {
      control: 'select',
      options: ['tool_flow', 'tool_error', 'research', 'preparing'],
      description: 'Thread scenario preset',
    },
    researchPreset: {
      control: 'select',
      options: [...RESEARCH_PRESET_OPTIONS],
    },
    ...toolCardArgTypes,
  },
  args: {
    ...toolCardDefaultArgs,
    scenario: 'tool_flow',
    researchPreset: 'full_flow',
  },
  render: ({ scenario, researchPreset, toolPreset, status, withArgs, withOutput }) => {
    if (scenario === 'preparing') {
      return <ChatLiveThread liveItems={[]} showToolPreparing />
    }

    if (scenario === 'research') {
      const entries = buildResearchEntries(researchPreset)
      return (
        <>
          <ChatMessageBubble
            role="user"
            text="Search OpenClaw docs for tool events."
          />
          <ChatLiveThread
            liveItems={entries.map((entry) => ({
              type: 'tool' as const,
              id: entry.id,
              entry,
            }))}
          />
        </>
      )
    }

    if (scenario === 'tool_error') {
      const entry = buildStoryToolEntry({
        toolPreset: 'exec',
        status: 'error',
        withArgs: true,
        withOutput: false,
      })
      return (
        <>
          <ChatMessageBubble role="user" text="Delete the entire workspace folder." />
          <ChatMessageBubble role="assistant" text="Let me try that in the sandbox." />
          <ToolActivityCard entry={entry} />
        </>
      )
    }

    const running = buildStoryToolEntry({
      toolPreset,
      status: 'running',
      withArgs,
      withOutput: false,
    })
    const done = buildStoryToolEntry({
      toolPreset,
      status: 'done',
      withArgs,
      withOutput,
    })

    return (
      <>
        <ChatMessageBubble
          role="user"
          text="Run tests and read the chat config file."
        />
        <ChatMessageBubble
          role="assistant"
          text="Running the test command, then reading the file."
        />
        <ToolActivityCard entry={status === 'running' ? running : done} />
        {status === 'done' ? (
          <ChatMessageBubble role="assistant" text="All done — tests passed." />
        ) : null}
      </>
    )
  },
}

export default meta
type Story = StoryObj<ContentAreaStoryArgs>

export const Playground: Story = {}

export const AllStatusLabels: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {STATUS_OPTIONS.map((status) => (
        <div key={status}>
          <StorySectionLabel>ContentArea — {status}</StorySectionLabel>
          <ToolActivityCard
            entry={buildStoryToolEntry({
              toolPreset: 'exec',
              status,
              withArgs: true,
              withOutput: status === 'done',
            })}
          />
        </div>
      ))}
    </div>
  ),
}
