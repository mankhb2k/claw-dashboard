

import { withChatContentArea } from './chat-story.decorators'
import { StoryDemoBox, StorySectionLabel } from './story-demo-ui'
import {
  RESEARCH_PRESET_OPTIONS,
  buildResearchEntries,
  researchBlockArgTypes,
  researchBlockDefaultArgs,
  type ResearchBlockStoryArgs,
} from './tool-activity.story-controls'
import { ToolResearchBlock } from '@/app/(dashboard)/dashboard/chat/_components/ToolResearchBlock/ToolResearchBlock'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const meta: Meta<ResearchBlockStoryArgs> = {
  title: 'Chat/ToolActivity/ToolResearchBlock',
  component: ToolResearchBlock,
  tags: ['autodocs'],
  decorators: [withChatContentArea],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: researchBlockArgTypes,
  args: researchBlockDefaultArgs,
  render: ({ researchPreset }) => (
    <ToolResearchBlock entries={buildResearchEntries(researchPreset)} />
  ),
}

export default meta
type Story = StoryObj<ResearchBlockStoryArgs>

export const Playground: Story = {}

export const AllResearchPresets: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {RESEARCH_PRESET_OPTIONS.map((researchPreset) => (
        <div key={researchPreset}>
          <StorySectionLabel>{researchPreset.replace(/_/g, ' ')}</StorySectionLabel>
          <StoryDemoBox>
            <ToolResearchBlock entries={buildResearchEntries(researchPreset)} />
          </StoryDemoBox>
        </div>
      ))}
    </div>
  ),
}
