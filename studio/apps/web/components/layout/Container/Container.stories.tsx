import React from 'react';

import { Container } from '@/components/layout/Container/Container';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof Container> = {
  title: 'Layout/Container',
  component: Container,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'full'],
    },
    display: {
      control: 'text',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Container>;

const DemoLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-muted-foreground)',
    fontWeight: 600,
    marginBottom: '12px',
    padding: '0 24px',
  }}>
    {children}
  </p>
);

const DummyContent = () => (
  <div style={{
    padding: '24px',
    background: 'var(--color-primary-dim)',
    border: '1px solid var(--color-primary)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-primary)',
    fontWeight: 500,
    textAlign: 'center',
  }}>
    Content area (constrained by Container)
  </div>
);

export const Default: Story = {
  args: {
    size: 'lg',
    children: <DummyContent />,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '24px 0' }}>
      <div>
        <DemoLabel>Size: XS (640px)</DemoLabel>
        <Container size="xs">
          <DummyContent />
        </Container>
      </div>

      <div>
        <DemoLabel>Size: SM (768px)</DemoLabel>
        <Container size="sm">
          <DummyContent />
        </Container>
      </div>

      <div>
        <DemoLabel>Size: MD (1024px)</DemoLabel>
        <Container size="md">
          <DummyContent />
        </Container>
      </div>

      <div>
        <DemoLabel>Size: LG (1440px — default)</DemoLabel>
        <Container size="lg">
          <DummyContent />
        </Container>
      </div>

      <div>
        <DemoLabel>Size: Full (100%)</DemoLabel>
        <Container size="full">
          <DummyContent />
        </Container>
      </div>
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '24px 0' }}>
      <div>
        <DemoLabel>Align: left</DemoLabel>
        <Container size="xs" align="left">
          <DummyContent />
        </Container>
      </div>

      <div>
        <DemoLabel>Align: center (default)</DemoLabel>
        <Container size="xs" align="center">
          <DummyContent />
        </Container>
      </div>

      <div>
        <DemoLabel>Align: right</DemoLabel>
        <Container size="xs" align="right">
          <DummyContent />
        </Container>
      </div>
    </div>
  ),
};

export const FlexLayout: Story = {
  render: () => (
    <div>
      <DemoLabel>Container as flexbox</DemoLabel>
      <Container size="md" display="flex" align="center" style={{ gap: '16px', justifyContent: 'space-between' }}>
        <div style={{ padding: '16px', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', flex: 1 }}>
          Column 1
        </div>
        <div style={{ padding: '16px', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', flex: 1 }}>
          Column 2
        </div>
        <div style={{ padding: '16px', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', flex: 1 }}>
          Column 3
        </div>
      </Container>
    </div>
  ),
};
