

import { withChatContentArea } from './chat-story.decorators'
import { StoryDemoBox, StorySectionLabel } from './story-demo-ui'
import {
  STATUS_OPTIONS,
  TOOL_PRESET_OPTIONS,
  buildStoryToolActivity,
  toolBarArgTypes,
  toolBarDefaultArgs,
  type ToolBarStoryArgs,
} from './tool-activity.story-controls'
import { ToolActivityBar } from '@/app/(dashboard)/dashboard/chat/_components/ToolActivityBar/ToolActivityBar'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const meta: Meta<ToolBarStoryArgs> = {
  title: 'Chat/ToolActivity/ToolActivityBar',
  component: ToolActivityBar,
  tags: ['autodocs'],
  decorators: [withChatContentArea],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: toolBarArgTypes,
  args: toolBarDefaultArgs,
  render: ({ toolPreset, status, showPreparing }) => (
    <ToolActivityBar
      activities={
        showPreparing ? [] : [buildStoryToolActivity(toolPreset, status)]
      }
      showPreparing={showPreparing}
    />
  ),
}

export default meta
type Story = StoryObj<ToolBarStoryArgs>

export const Playground: Story = {}

export const Preparing: Story = {
  args: {
    showPreparing: true,
    toolPreset: 'exec',
    status: 'running',
  },
}

export const AllToolLabels: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {STATUS_OPTIONS.map((status) => (
        <div key={status}>
          <StorySectionLabel>Inline bar — {status}</StorySectionLabel>
          <StoryDemoBox>
            <ToolActivityBar
              activities={TOOL_PRESET_OPTIONS.map((toolPreset) =>
                buildStoryToolActivity(toolPreset, status),
              )}
            />
          </StoryDemoBox>
        </div>
      ))}
    </div>
  ),
}
