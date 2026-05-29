import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { Switch } from '@/components/ui/Switch/Switch';

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Switch>;

const DemoLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{ 
    fontSize: '11px', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em', 
    color: 'var(--color-muted-foreground)', 
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
    gap: '16px', 
    padding: '24px', 
    minWidth: '240px',
    border: '1px dashed var(--color-border)', 
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-background)'
  }}>
    {children}
  </div>
);

export const Default: Story = {
  args: {
    label: 'Enable email notifications',
    id: 'notifications',
  },
};

export const States: Story = {
  render: () => (
    <div>
      <DemoLabel>Switch states</DemoLabel>
      <DemoBox>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Dark mode</span>
          <Switch id="dark-mode" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Auto-update</span>
          <Switch id="auto-update" defaultChecked />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
          <span>Advanced settings (disabled)</span>
          <Switch id="advanced" disabled />
        </div>
      </DemoBox>
    </div>
  ),
};
