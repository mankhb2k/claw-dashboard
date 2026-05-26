import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { Avatar } from '@/components/ui/Avatar/Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: ['circle', 'square'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

// Label helper cho demo
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
);

// Container helper cho demo
const DemoBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '16px', 
    padding: '24px', 
    border: '1px dashed var(--color-border)', 
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-white)'
  }}>
    {children}
  </div>
);

export const Default: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    alt: 'User Avatar',
    size: 'md',
    variant: 'circle',
  },
};

export const Fallback: Story = {
  args: {
    fallback: 'JD',
    size: 'md',
    variant: 'circle',
  },
};

export const Sizes: Story = {
  render: () => (
    <div>
      <DemoLabel>Các kích thước hiển thị</DemoLabel>
      <DemoBox>
        <Avatar size="sm" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128" fallback="S" />
        <Avatar size="md" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256" fallback="M" />
        <Avatar size="lg" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256" fallback="L" />
        <Avatar size="xl" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256" fallback="X" />
      </DemoBox>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div>
      <DemoLabel>Các kiểu dáng (Variants)</DemoLabel>
      <DemoBox>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Avatar variant="circle" size="lg" src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=256" />
          <span style={{ fontSize: '12px' }}>Circle</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Avatar variant="square" size="lg" src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=256" />
          <span style={{ fontSize: '12px' }}>Square</span>
        </div>
      </DemoBox>
    </div>
  ),
};
