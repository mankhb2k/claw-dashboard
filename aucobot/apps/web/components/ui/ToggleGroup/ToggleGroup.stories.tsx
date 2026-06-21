import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, FileText } from 'lucide-react'
import React from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/ToggleGroup/ToggleGroup'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const meta: Meta<typeof ToggleGroup> = {
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'radio',
      options: ['single', 'multiple'],
      description: 'Single or multiple selection mode',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the entire group',
    },
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
      description: 'Group layout direction',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button group size',
    },
  },
}

export default meta
type Story = StoryObj<typeof ToggleGroup>

const DemoLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-muted-foreground)',
    fontWeight: 600,
    marginBottom: '12px',
  }}>
    {children}
  </p>
)

const DemoBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-background)',
    flexWrap: 'wrap',
  }}>
    {children}
  </div>
)

export const Default: Story = {
  args: {
    type: 'single',
    defaultValue: 'bold',
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="bold" aria-label="Bold">
        <Bold size={16} />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Italic">
        <Italic size={16} />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Underline">
        <Underline size={16} />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <DemoLabel>Text formatting (single select)</DemoLabel>
        <DemoBox>
          <ToggleGroup type="single" defaultValue="bold">
            <ToggleGroupItem value="bold" aria-label="Bold">
              <Bold size={16} />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic">
              <Italic size={16} />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Underline">
              <Underline size={16} />
            </ToggleGroupItem>
          </ToggleGroup>
        </DemoBox>
      </div>

      <div>
        <DemoLabel>Alignment (single select)</DemoLabel>
        <DemoBox>
          <ToggleGroup type="single" defaultValue="left">
            <ToggleGroupItem value="left" aria-label="Align Left">
              <AlignLeft size={16} />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align Center">
              <AlignCenter size={16} />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align Right">
              <AlignRight size={16} />
            </ToggleGroupItem>
          </ToggleGroup>
        </DemoBox>
      </div>

      <div>
        <DemoLabel>Multiple select</DemoLabel>
        <DemoBox>
          <ToggleGroup type="multiple" defaultValue={['bold', 'italic']}>
            <ToggleGroupItem value="bold" aria-label="Bold">
              <Bold size={16} />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic">
              <Italic size={16} />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Underline">
              <Underline size={16} />
            </ToggleGroupItem>
          </ToggleGroup>
        </DemoBox>
      </div>
    </div>
  ),
}

export const Orientations: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '48px' }}>
      <div>
        <DemoLabel>Horizontal (default)</DemoLabel>
        <DemoBox>
          <ToggleGroup type="single" orientation="horizontal" defaultValue="left">
            <ToggleGroupItem value="left"><AlignLeft size={16} /></ToggleGroupItem>
            <ToggleGroupItem value="center"><AlignCenter size={16} /></ToggleGroupItem>
            <ToggleGroupItem value="right"><AlignRight size={16} /></ToggleGroupItem>
          </ToggleGroup>
        </DemoBox>
      </div>

      <div>
        <DemoLabel>Vertical</DemoLabel>
        <DemoBox>
          <ToggleGroup type="single" orientation="vertical" defaultValue="left">
            <ToggleGroupItem value="left"><AlignLeft size={16} /></ToggleGroupItem>
            <ToggleGroupItem value="center"><AlignCenter size={16} /></ToggleGroupItem>
            <ToggleGroupItem value="right"><AlignRight size={16} /></ToggleGroupItem>
          </ToggleGroup>
        </DemoBox>
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <DemoLabel>Small (28px) — headers, compact toolbars</DemoLabel>
        <DemoBox>
          <ToggleGroup type="single" size="sm" defaultValue="editor">
            <ToggleGroupItem value="editor" style={{ gap: '4px' }}>
              <Bold size={13} />
              <span>Editor</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="markdown" style={{ gap: '4px' }}>
              <FileText size={13} />
              <span>Markdown</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </DemoBox>
      </div>

      <div>
        <DemoLabel>Medium (32px) — default</DemoLabel>
        <DemoBox>
          <ToggleGroup type="single" size="md" defaultValue="bold">
            <ToggleGroupItem value="bold"><Bold size={16} /></ToggleGroupItem>
            <ToggleGroupItem value="italic"><Italic size={16} /></ToggleGroupItem>
            <ToggleGroupItem value="underline"><Underline size={16} /></ToggleGroupItem>
          </ToggleGroup>
        </DemoBox>
      </div>

      <div>
        <DemoLabel>Large (40px) — spacious primary areas</DemoLabel>
        <DemoBox>
          <ToggleGroup type="single" size="lg" defaultValue="left">
            <ToggleGroupItem value="left" style={{ gap: '8px' }}>
              <AlignLeft size={18} />
              <span>Align Left</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="center" style={{ gap: '8px' }}>
              <AlignCenter size={18} />
              <span>Align Center</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="right" style={{ gap: '8px' }}>
              <AlignRight size={18} />
              <span>Align Right</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </DemoBox>
      </div>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div>
      <DemoLabel>Disabled</DemoLabel>
      <DemoBox>
        <ToggleGroup type="single" disabled defaultValue="bold">
          <ToggleGroupItem value="bold"><Bold size={16} /></ToggleGroupItem>
          <ToggleGroupItem value="italic"><Italic size={16} /></ToggleGroupItem>
          <ToggleGroupItem value="underline"><Underline size={16} /></ToggleGroupItem>
        </ToggleGroup>
      </DemoBox>
    </div>
  ),
}
