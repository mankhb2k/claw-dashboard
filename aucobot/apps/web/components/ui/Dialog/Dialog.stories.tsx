import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/Dialog/Dialog';
import { Button } from '@/components/ui/Button/Button';

interface InteractiveProps extends React.ComponentProps<typeof DialogContent> {
  title: string;
  description: string;
  content: string;
}

const meta: Meta<InteractiveProps> = {
  title: 'UI/Dialog',
  component: DialogContent as any,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    showClose: {
      control: 'boolean',
      description: 'Show X close button in the top-right corner',
    },
    title: {
      control: 'text',
      description: 'Modal title (demo only)',
    },
    description: {
      control: 'text',
      description: 'Modal description (demo only)',
    },
    content: {
      control: 'text',
      description: 'Modal body content (demo only)',
    },
  },
};

export default meta;
type Story = StoryObj<InteractiveProps>;

const DemoLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-text-subtle)',
    fontWeight: 600,
    marginBottom: '12px',
  }}>
    {children}
  </p>
);

const DemoBox = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '32px',
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-white)',
    ...style,
  }}>
    {children}
  </div>
);

export const Interactive: Story = {
  args: {
    showClose: true,
    title: 'Modal title',
    description: 'You can change this text in the Controls panel below.',
    content: 'Main modal content goes here. You can edit this too!',
  },
  render: (args) => (
    <div>
      <DemoLabel>Click the button to open the dialog and test Controls props:</DemoLabel>
      <DemoBox>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="primary">Open dialog</Button>
          </DialogTrigger>
          <DialogContent showClose={args.showClose}>
            <DialogHeader>
              <DialogTitle>{args.title}</DialogTitle>
              <DialogDescription>
                {args.description}
              </DialogDescription>
            </DialogHeader>
            <div style={{ padding: 'var(--space-4) 0' }}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-foreground)' }}>
                {args.content}
              </p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button variant="primary">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DemoBox>
    </div>
  ),
};

export const CustomContent: Story = {
  args: {
    showClose: false,
    title: 'Confirm action',
    description: '',
    content: 'Are you sure you want to perform this action?',
  },
  render: (args) => (
    <div>
      <DemoLabel>Custom modal (hide default close button via props):</DemoLabel>
      <DemoBox>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open custom modal</Button>
          </DialogTrigger>
          <DialogContent showClose={args.showClose}>
            <DialogHeader>
              <DialogTitle>{args.title}</DialogTitle>
            </DialogHeader>
            <div style={{ padding: 'var(--space-4) 0', textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--color-primary-dim)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                ℹ️
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-foreground)' }}>
                {args.content}
              </p>
            </div>
            <DialogFooter style={{ justifyContent: 'center' }}>
              <DialogClose asChild>
                <Button variant="ghost">Go back</Button>
              </DialogClose>
              <Button variant="primary">I agree</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DemoBox>
    </div>
  ),
};
