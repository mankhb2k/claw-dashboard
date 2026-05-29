import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { Button } from '@/components/ui/Button/Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'outline', 'secondary', 'ghost', 'danger', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon_xs', 'icon_sm', 'icon_lg'],
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Label helper for demos
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

// Container helper for demos
const DemoBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '16px', 
    padding: '24px', 
    border: '1px dashed var(--color-border)', 
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-background)',
    flexWrap: 'wrap'
  }}>
    {children}
  </div>
);

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <DemoLabel>Color variants</DemoLabel>
        <DemoBox>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link Button</Button>
        </DemoBox>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <DemoLabel>Sizes</DemoLabel>
        <DemoBox>
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </DemoBox>
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <DemoLabel>States</DemoLabel>
        <DemoBox>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button variant="outline" loading>Loading Outline</Button>
        </DemoBox>
      </div>
    </div>
  ),
};

export const Icons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <DemoLabel>Icon buttons</DemoLabel>
        <DemoBox>
          <Button size="icon_xs">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </Button>
          <Button size="icon_sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </Button>
          <Button size="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </Button>
          <Button size="icon_lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </Button>
        </DemoBox>
      </div>
    </div>
  ),
};
