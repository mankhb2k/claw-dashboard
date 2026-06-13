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
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    labelPosition: {
      control: 'select',
      options: ['top', 'left', 'right', 'none'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

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
    background: 'var(--color-background)',
  }}>
    {children}
  </div>
);

export const Default: Story = {
  args: {
    label: 'Email address',
    placeholder: 'Enter your email...',
    type: 'email',
    size: 'md',
    labelPosition: 'top',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <DemoLabel>Sizes</DemoLabel>
        <DemoBox>
          <Input label="Medium (default)" size="md" placeholder="Enter text..." />
          <Input label="Small" size="sm" placeholder="Enter text..." />
        </DemoBox>
      </div>
    </div>
  ),
};

export const LabelPositions: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <section>
        <DemoLabel>Label on top (top)</DemoLabel>
        <DemoBox>
          <Input
            id="input-label-top"
            label="Email"
            labelPosition="top"
            placeholder="name@example.com"
          />
        </DemoBox>
      </section>

      <section>
        <DemoLabel>Label on left (left)</DemoLabel>
        <DemoBox>
          <Input
            id="input-label-left"
            label="Region"
            labelPosition="left"
            defaultValue="Singapore"
          />
        </DemoBox>
      </section>

      <section>
        <DemoLabel>Label on right (right)</DemoLabel>
        <DemoBox>
          <Input
            id="input-label-right"
            label="Plan"
            labelPosition="right"
            defaultValue="Pro"
          />
        </DemoBox>
      </section>

      <section>
        <DemoLabel>No label (none)</DemoLabel>
        <DemoBox>
          <Input
            id="input-label-none"
            label="Hidden label"
            labelPosition="none"
            placeholder="Search..."
          />
        </DemoBox>
      </section>
    </div>
  ),
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
