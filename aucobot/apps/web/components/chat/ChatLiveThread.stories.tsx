

import { withChatContentArea } from './chat-story.decorators'
import {
  RESEARCH_PRESET_OPTIONS,
  STATUS_OPTIONS,
  TOOL_PRESET_OPTIONS,
  buildResearchEntries,
  buildStoryToolEntry,
  toolCardArgTypes,
  toolCardDefaultArgs,
  type ToolCardStoryArgs,
} from './tool-activity.story-controls'
import { ChatLiveThread } from '@/app/(dashboard)/dashboard/chat/_components/ChatLiveThread/ChatLiveThread'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

type LiveThreadStoryArgs = ToolCardStoryArgs & {
  showToolPreparing: boolean
  researchPreset: (typeof RESEARCH_PRESET_OPTIONS)[number] | 'single_tool'
}

const meta: Meta<LiveThreadStoryArgs> = {
  title: 'Chat/ToolActivity/ChatLiveThread',
  component: ChatLiveThread,
  tags: ['autodocs'],
  decorators: [withChatContentArea],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    ...toolCardArgTypes,
    showToolPreparing: {
      control: 'boolean',
      description: 'Show preparing indicator',
    },
    researchPreset: {
      control: 'select',
      options: ['single_tool', ...RESEARCH_PRESET_OPTIONS],
      description: 'Thread mode — single tool card or web research flow',
    },
  },
  args: {
    ...toolCardDefaultArgs,
    showToolPreparing: false,
    researchPreset: 'single_tool',
  },
  render: ({ toolPreset, status, withArgs, withOutput, showToolPreparing, researchPreset }) => {
    if (showToolPreparing) {
      return <ChatLiveThread liveItems={[]} showToolPreparing />
    }

    if (researchPreset !== 'single_tool') {
      const entries = buildResearchEntries(researchPreset)
      return (
        <ChatLiveThread
          liveItems={entries.map((entry) => ({
            type: 'tool' as const,
            id: entry.id,
            entry,
          }))}
        />
      )
    }

    const entry = buildStoryToolEntry({ toolPreset, status, withArgs, withOutput })
    return (
      <ChatLiveThread
        liveItems={[{ type: 'tool', id: entry.id, entry }]}
      />
    )
  },
}

export default meta
type Story = StoryObj<LiveThreadStoryArgs>

export const Playground: Story = {}

export const Preparing: Story = {
  args: {
    showToolPreparing: true,
    researchPreset: 'single_tool',
  },
}

export const AllToolLabels: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ChatLiveThread
      liveItems={TOOL_PRESET_OPTIONS.flatMap((toolPreset) =>
        STATUS_OPTIONS.map((status) => {
          const entry = buildStoryToolEntry({
            toolPreset,
            status,
            withArgs: false,
            withOutput: false,
          })
          return {
            type: 'tool' as const,
            id: `${entry.id}-${status}`,
            entry: { ...entry, id: `${entry.id}-${status}` },
          }
        }),
      )}
    />
  ),
}
