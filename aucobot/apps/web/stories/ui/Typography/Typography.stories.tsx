import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import { Typography } from '@/components/ui/Typography/Typography'

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
      options: ['light', 'regular', 'medium', 'bold'],
    },
    italic: {
      control: 'boolean',
      description: 'Bật chữ nghiêng (font-style: italic)',
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
    color: 'var(--color-text-subtle)', 
    fontWeight: 600,
    marginBottom: '12px'
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
    background: 'var(--color-white)'
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
      <DemoLabel>Các cấp tiêu đề (Headings)</DemoLabel>
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
      <DemoLabel>Văn bản nội dung (Body)</DemoLabel>
      <DemoBox>
        <Typography variant="p">
          Body Text (Default) - 15px. Đây là văn bản mặc định được sử dụng cho phần lớn nội dung trong ứng dụng.
        </Typography>
        <Typography variant="small">
          Small Text - 13px. Thường dùng cho các ghi chú hoặc thông tin phụ.
        </Typography>
        <Typography variant="xs">
          Extra Small Text - 11px. Dùng cho caption, nhãn nhỏ hoặc meta data.
        </Typography>
      </DemoBox>
    </div>
  ),
}

export const Colors: Story = {
  render: () => (
    <div>
      <DemoLabel>Màu sắc (Colors)</DemoLabel>
      <DemoBox>
        <Typography color="default">Default Text Color</Typography>
        <Typography color="muted">Muted Text Color (var--color-text-muted)</Typography>
        <Typography color="subtle">Subtle Text Color (var--color-text-subtle)</Typography>
        <Typography color="primary">Primary Accent Color (var--color-primary)</Typography>
      </DemoBox>
    </div>
  ),
}

export const Italic: Story = {
  render: () => (
    <div>
      <DemoLabel>Chữ nghiêng (italic)</DemoLabel>
      <DemoBox>
        <Typography variant="p">Văn bản thường</Typography>
        <Typography variant="p" italic>
          Văn bản nghiêng — italic
        </Typography>
        <Typography variant="small" color="muted" italic>
          Ghi chú phụ nghiêng
        </Typography>
      </DemoBox>
    </div>
  ),
}

export const Weights: Story = {
  render: () => (
    <div>
      <DemoLabel>Trọng số chữ (Weights)</DemoLabel>
      <DemoBox>
        <Typography weight="light">Light Weight (300)</Typography>
        <Typography weight="regular">Regular Weight (400)</Typography>
        <Typography weight="medium">Medium Weight (500)</Typography>
        <Typography weight="bold">Bold Weight (700)</Typography>
      </DemoBox>
    </div>
  ),
}
