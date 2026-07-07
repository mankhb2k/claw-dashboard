import React from 'react'

import { Typography } from '@/components/ui/Typography/Typography'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const meta: Meta<typeof Typography> = {
  title: 'UI/Typography',
  component: Typography,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'p', 'small', 'xs'],
    },
    color: {
      control: 'select',
      options: ['default', 'muted', 'subtle', 'primary'],
    },
    weight: {
      control: 'select',
      options: ['extralight', 'light', 'regular', 'medium', 'semibold', 'bold'],
    },
    italic: {
      control: 'boolean',
      description: 'Enable italic (font-style: italic)',
    },
  },
}

export default meta
type Story = StoryObj<typeof Typography>

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
    flexDirection: 'column',
    gap: '16px',
    padding: '24px',
    minWidth: '400px',
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-background)',
  }}>
    {children}
  </div>
)

export const Default: Story = {
  args: {
    variant: 'p',
    children: 'The quick brown fox jumps over the lazy dog.',
  },
}

export const Headings: Story = {
  render: () => (
    <div>
      <DemoLabel>Headings</DemoLabel>
      <DemoBox>
        <Typography variant="h1">Heading 1 - 32px Bold</Typography>
        <Typography variant="h2">Heading 2 - 24px Semibold</Typography>
        <Typography variant="h3">Heading 3 - 18px Semibold</Typography>
        <Typography variant="h4">Heading 4 - 15px Semibold</Typography>
      </DemoBox>
    </div>
  ),
}

export const Body: Story = {
  render: () => (
    <div>
      <DemoLabel>Body text</DemoLabel>
      <DemoBox>
        <Typography variant="p">
          Body Text (Default) - 15px. Default text used for most application content.
        </Typography>
        <Typography variant="small">
          Small Text - 13px. Often used for notes or secondary information.
        </Typography>
        <Typography variant="xs">
          Extra Small Text - 11px. Used for captions, small labels, or metadata.
        </Typography>
      </DemoBox>
    </div>
  ),
}

export const Colors: Story = {
  render: () => (
    <div>
      <DemoLabel>Colors</DemoLabel>
      <DemoBox>
        <Typography color="default">Default Text Color</Typography>
        <Typography color="muted">Muted Text Color (var(--color-muted-foreground))</Typography>
        <Typography color="subtle">Subtle Text Color (var(--color-muted-foreground))</Typography>
        <Typography color="primary">Primary Accent Color (var(--color-primary))</Typography>
      </DemoBox>
    </div>
  ),
}

export const Italic: Story = {
  render: () => (
    <div>
      <DemoLabel>Italic</DemoLabel>
      <DemoBox>
        <Typography variant="p">Regular text</Typography>
        <Typography variant="p" italic>
          Italic text
        </Typography>
        <Typography variant="small" color="muted" italic>
          Muted italic note
        </Typography>
      </DemoBox>
    </div>
  ),
}

export const Weights: Story = {
  render: () => (
    <div>
      <DemoLabel>Font weights</DemoLabel>
      <DemoBox>
        <Typography weight="extralight">Extralight (200)</Typography>
        <Typography weight="light">Light (300)</Typography>
        <Typography weight="regular">Regular (400)</Typography>
        <Typography weight="medium">Medium (500)</Typography>
        <Typography weight="semibold">Semibold (600)</Typography>
        <Typography weight="bold">Bold (700)</Typography>
      </DemoBox>
    </div>
  ),
}
