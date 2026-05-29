import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { Input } from '@/components/ui/Input/Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

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

const DemoBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    gap: '24px', 
    padding: '32px', 
    minWidth: '400px',
    border: '1px dashed var(--color-border)', 
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-white)'
  }}>
    {children}
  </div>
);

export const Default: Story = {
  args: {
    label: 'Email address',
    placeholder: 'Enter your email...',
    type: 'email',
  },
};

export const States: Story = {
  render: () => (
    <div>
      <DemoLabel>Input states</DemoLabel>
      <DemoBox>
        <Input label="Default" placeholder="Enter text..." />
        <Input label="Password" type="password" defaultValue="123456" />
        <Input label="Error" error="Please enter a valid email address" defaultValue="invalid-email" />
        <Input label="Disabled" disabled defaultValue="Read-only data" />
      </DemoBox>
    </div>
  ),
};
