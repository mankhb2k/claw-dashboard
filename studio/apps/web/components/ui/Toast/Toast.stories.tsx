import React from 'react';

import { Button } from '@/components/ui/Button/Button';
import {
  ToastProvider,
  useToast,
  toast,
  type ToastVariant,
} from '@/components/ui/Toast/Toast';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

type ToastStoryArgs = {
  variant: ToastVariant;
  title: string;
  description: string;
  duration: number;
};

const meta: Meta<ToastStoryArgs> = {
  title: 'UI/Toast',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  argTypes: {
    variant: {
      control: 'radio',
      options: ['success', 'error'],
      description: 'Toast type (success / error)',
    },
    title: {
      control: 'text',
      description: 'Toast title',
    },
    description: {
      control: 'text',
      description: 'Optional description (leave empty to omit)',
    },
    duration: {
      control: { type: 'number', min: 1000, max: 10000, step: 500 },
      description: 'Auto-dismiss duration (ms)',
    },
  },
};

export default meta;
type Story = StoryObj<ToastStoryArgs>;

const DemoLabel = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--color-muted-foreground)',
      fontWeight: 600,
      marginBottom: '12px',
    }}
  >
    {children}
  </p>
);

const DemoBox = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '24px',
      border: '1px dashed var(--color-border)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-card-background)',
      flexWrap: 'wrap',
    }}
  >
    {children}
  </div>
);

function ToastPlayground({ variant, title, description, duration }: ToastStoryArgs) {
  const { toast: showToast } = useToast();

  const handleShow = () => {
    showToast({
      variant,
      title,
      description: description.trim() || undefined,
      duration,
    });
  };

  return (
    <DemoBox>
      <Button variant={variant === 'error' ? 'danger' : 'primary'} onClick={handleShow}>
        Show toast
      </Button>
    </DemoBox>
  );
}

export const Default: Story = {
  args: {
    variant: 'success',
    title: 'Saved successfully',
    description: 'Agent configuration has been updated.',
    duration: 3000,
  },
  render: (args) => <ToastPlayground {...args} />,
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Saved',
    description: 'Your changes have been saved.',
    duration: 3000,
  },
  render: (args) => <ToastPlayground {...args} />,
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Save failed',
    description: 'Could not connect to the worker. Try again later.',
    duration: 3000,
  },
  render: (args) => <ToastPlayground {...args} />,
};

export const TitleOnly: Story = {
  args: {
    variant: 'success',
    title: 'Complete',
    description: '',
    duration: 3000,
  },
  render: (args) => <ToastPlayground {...args} />,
};

function ToastDemoImperative() {
  return (
    <DemoBox>
      <Button
        variant="outline"
        onClick={() =>
          toast.success('Copied', 'API key copied to clipboard.')
        }
      >
        toast.success()
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error('Invalid', 'Agent name cannot be empty.')
        }
      >
        toast.error()
      </Button>
    </DemoBox>
  );
}

export const ImperativeApi: Story = {
  render: () => (
    <div>
      <DemoLabel>toast — imperative API (requires ToastProvider)</DemoLabel>
      <ToastDemoImperative />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div>
      <DemoLabel>Multiple toasts in sequence</DemoLabel>
      <DemoBox>
        <Button
          variant="secondary"
          onClick={() => {
            toast.success('Step 1', 'Login session verified.');
            setTimeout(
              () => toast.success('Step 2', 'Configuration synced.'),
              400,
            );
            setTimeout(
              () => toast.error('Step 3', 'Worker timed out after 30 seconds.'),
              800,
            );
          }}
        >
          Trigger toast chain
        </Button>
      </DemoBox>
    </div>
  ),
};
