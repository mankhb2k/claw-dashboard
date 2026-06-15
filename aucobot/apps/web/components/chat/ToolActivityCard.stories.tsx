import type { Meta, StoryObj } from '@storybook/react'

import { ToolActivityCard } from '@/app/(dashboard)/dashboard/chat/_components/ToolActivityCard/ToolActivityCard'

import { withChatContentArea } from './chat-story.decorators'
import { StoryDemoBox, StorySectionLabel } from './story-demo-ui'
import {
  STATUS_OPTIONS,
  TOOL_PRESET_OPTIONS,
  buildStoryToolEntry,
  toolCardArgTypes,
  toolCardDefaultArgs,
  type ToolCardStoryArgs,
} from './tool-activity.story-controls'

const meta: Meta<ToolCardStoryArgs> = {
  title: 'Chat/ToolActivity/ToolActivityCard',
  component: ToolActivityCard,
  tags: ['autodocs'],
  decorators: [withChatContentArea],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: toolCardArgTypes,
  args: toolCardDefaultArgs,
  render: (args) => (
    <ToolActivityCard entry={buildStoryToolEntry(args)} />
  ),
}

export default meta
type Story = StoryObj<ToolCardStoryArgs>

export const Playground: Story = {}

export const AllStatuses: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <StorySectionLabel>Exec — all status labels</StorySectionLabel>
        <StoryDemoBox>
          {STATUS_OPTIONS.map((status) => (
            <ToolActivityCard
              key={status}
              entry={buildStoryToolEntry({
                toolPreset: 'exec',
                status,
                withArgs: true,
                withOutput: true,
              })}
            />
          ))}
        </StoryDemoBox>
      </div>
    </div>
  ),
}

export const AllToolLabels: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {STATUS_OPTIONS.map((status) => (
        <div key={status}>
          <StorySectionLabel>All tool presets — {status}</StorySectionLabel>
          <StoryDemoBox>
            {TOOL_PRESET_OPTIONS.map((toolPreset) => (
              <ToolActivityCard
                key={`${status}-${toolPreset}`}
                entry={buildStoryToolEntry({
                  toolPreset,
                  status,
                  withArgs: false,
                  withOutput: status === 'done',
                })}
              />
            ))}
          </StoryDemoBox>
        </div>
      ))}
    </div>
  ),
}
