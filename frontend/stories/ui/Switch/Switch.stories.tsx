import type { Meta, StoryObj } from '@storybook/react';
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
    gap: '16px', 
    padding: '24px', 
    minWidth: '240px',
    border: '1px dashed var(--color-border)', 
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-white)'
  }}>
    {children}
  </div>
);

export const Default: Story = {
  args: {
    label: 'Bật thông báo email',
    id: 'notifications',
  },
};

export const States: Story = {
  render: () => (
    <div>
      <DemoLabel>Các trạng thái của Switch</DemoLabel>
      <DemoBox>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Chế độ tối</span>
          <Switch id="dark-mode" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Tự động cập nhật</span>
          <Switch id="auto-update" defaultChecked />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
          <span>Cài đặt nâng cao (Disabled)</span>
          <Switch id="advanced" disabled />
        </div>
      </DemoBox>
    </div>
  ),
};
