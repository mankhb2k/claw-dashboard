import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { Checkbox } from '@/components/ui/Checkbox/Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

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
    gap: '12px', 
    padding: '24px', 
    minWidth: '200px',
    border: '1px dashed var(--color-border)', 
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-white)'
  }}>
    {children}
  </div>
);

export const Default: Story = {
  args: {
    label: 'Accept terms of service',
    id: 'terms',
  },
};

export const States: Story = {
  render: () => (
    <div>
      <DemoLabel>Checkbox states</DemoLabel>
      <DemoBox>
        <Checkbox id="unselected" label="Unchecked" />
        <Checkbox id="selected" label="Checked" defaultChecked />
        <Checkbox id="disabled" label="Disabled" disabled />
        <Checkbox id="disabled-checked" label="Disabled (checked)" disabled defaultChecked />
      </DemoBox>
    </div>
  ),
};
