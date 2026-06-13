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
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Checkbox and label size',
    },
    label: {
      control: 'text',
      description: 'Label shown beside the checkbox',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable interaction',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'Default checked state (uncontrolled)',
    },
    checked: {
      control: 'boolean',
      description: 'Checked state (controlled — used in stateful demos)',
    },
  },
  args: {
    id: 'checkbox-demo',
    label: 'Accept terms of service',
    size: 'md',
    disabled: false,
    defaultChecked: false,
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

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
      flexDirection: 'column',
      gap: '12px',
      padding: '24px',
      minWidth: '240px',
      border: '1px dashed var(--color-border)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-background)',
    }}
  >
    {children}
  </div>
);

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <DemoLabel>Small (sm)</DemoLabel>
        <DemoBox>
          <Checkbox {...args} id="checkbox-sm" size="sm" label="Small checkbox" />
        </DemoBox>
      </div>
      <div>
        <DemoLabel>Medium (md) — default</DemoLabel>
        <DemoBox>
          <Checkbox {...args} id="checkbox-md" size="md" label="Medium checkbox" />
        </DemoBox>
      </div>
      <div>
        <DemoLabel>Large (lg)</DemoLabel>
        <DemoBox>
          <Checkbox {...args} id="checkbox-lg" size="lg" label="Large checkbox" />
        </DemoBox>
      </div>
    </div>
  ),
  args: {
    defaultChecked: true,
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

export const WithoutLabel: Story = {
  args: {
    label: undefined,
    'aria-label': 'Toggle option',
  },
};

export const Controlled: Story = {
  render: function ControlledCheckbox() {
    const [checked, setChecked] = React.useState(false);
    return (
      <DemoBox>
        <Checkbox
          id="controlled"
          label={checked ? 'Enabled' : 'Disabled'}
          checked={checked}
          onCheckedChange={(value) => setChecked(value === true)}
        />
      </DemoBox>
    );
  },
};
