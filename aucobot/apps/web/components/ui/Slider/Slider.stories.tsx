import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { Slider } from '@/components/ui/Slider/Slider';

const meta: Meta<typeof Slider> = {
  title: 'UI/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Slider>;

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
    gap: '32px', 
    padding: '40px', 
    minWidth: '400px',
    border: '1px dashed var(--color-border)', 
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-background)'
  }}>
    {children}
  </div>
);

export const Default: Story = {
  args: {
    label: 'Volume',
    defaultValue: [50],
    max: 100,
    step: 1,
  },
};

export const States: Story = {
  render: () => (
    <div>
      <DemoLabel>Slider examples</DemoLabel>
      <DemoBox>
        <Slider label="Default (0-100)" defaultValue={[30]} />
        <Slider label="Step: 10" defaultValue={[50]} step={10} min={0} max={100} />
        <Slider label="Disabled" defaultValue={[70]} disabled />
      </DemoBox>
    </div>
  ),
};
