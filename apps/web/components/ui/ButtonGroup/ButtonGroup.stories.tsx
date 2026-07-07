import {
  ChevronDown,
  FileText,
  LayoutList,
  ListChecks,
  ShieldAlert,
  TextQuote,
  Wrench,
} from 'lucide-react'
import React, { useState } from 'react'

import { Button, type ButtonProps } from '@/components/ui/Button/Button'
import { ButtonGroup } from '@/components/ui/ButtonGroup/ButtonGroup'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

type ButtonGroupStoryArgs = {
  /** Button size applied to every child in the playground group */
  buttonSize: NonNullable<ButtonProps['size']>
  /** Variant for every item — active state uses `aria-pressed` + ButtonGroup styles */
  inactiveVariant: NonNullable<ButtonProps['variant']>
  /** @deprecated Use the same variant + `aria-pressed`; kept to avoid breaking legacy controls */
  activeVariant?: NonNullable<ButtonProps['variant']>
  /** Disable all buttons in the playground group */
  disabled: boolean
  /** Allow the group to wrap onto multiple lines (narrow layouts) */
  wrap: boolean
  className?: string
}

const meta: Meta<ButtonGroupStoryArgs> = {
  title: 'UI/ButtonGroup',
  component: ButtonGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Visual container that merges adjacent `Button` borders and radii. ' +
          'Selection state, variants, and sizes are controlled on each `Button` child — ' +
          'not on `ButtonGroup` itself.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    buttonSize: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Size passed to each Button in the interactive playground',
      table: { category: 'Button children' },
    },
    inactiveVariant: {
      control: 'select',
      options: ['outline', 'ghost', 'secondary', 'primary'],
      description: 'Variant for unselected segmented-control items',
      table: { category: 'Button children' },
    },
    activeVariant: {
      control: 'select',
      options: ['secondary', 'primary', 'outline', 'ghost'],
      description: 'Deprecated — active state uses aria-pressed with the same outline variant',
      table: { category: 'Button children' },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable every button in the playground group',
      table: { category: 'Button children' },
    },
    wrap: {
      control: 'boolean',
      description: 'Apply flex-wrap so long label groups can break lines',
      table: { category: 'Layout' },
    },
    className: {
      control: 'text',
      description: 'Optional className on ButtonGroup root',
      table: { category: 'Layout' },
    },
  },
  args: {
    buttonSize: 'sm',
    inactiveVariant: 'outline',
    disabled: false,
    wrap: false,
  },
}

export default meta
type Story = StoryObj<ButtonGroupStoryArgs>

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
)

const DemoBox = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '24px',
      border: '1px dashed var(--color-border)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-background)',
      flexWrap: 'wrap',
    }}
  >
    {children}
  </div>
)

const iconGap: React.CSSProperties = { gap: 'var(--space-2)' }

function SegmentedButtons({
  items,
  defaultValue,
  size = 'sm',
  inactiveVariant = 'outline',
  disabled = false,
  wrap = false,
  className,
}: {
  items: { value: string; label: string; icon?: React.ReactNode }[]
  defaultValue: string
  size?: ButtonProps['size']
  inactiveVariant?: ButtonProps['variant']
  disabled?: boolean
  wrap?: boolean
  className?: string
}) {
  const [value, setValue] = useState(defaultValue)

  return (
    <ButtonGroup
      className={className}
      style={wrap ? { flexWrap: 'wrap', maxWidth: 320 } : undefined}
    >
      {items.map((item) => (
        <Button
          key={item.value}
          type="button"
          size={size}
          variant={inactiveVariant}
          disabled={disabled}
          aria-pressed={value === item.value}
          style={item.icon ? iconGap : undefined}
          onClick={() => setValue(item.value)}
        >
          {item.icon}
          {item.label}
        </Button>
      ))}
    </ButtonGroup>
  )
}

/** Interactive playground — args control child Button props */
export const Default: Story = {
  render: ({ buttonSize, inactiveVariant, disabled, wrap, className }) => (
    <SegmentedButtons
      items={[
        { value: 'month', label: 'Month' },
        { value: 'quarter', label: 'Quarter' },
        { value: 'year', label: 'Year' },
      ]}
      defaultValue="month"
      size={buttonSize}
      inactiveVariant={inactiveVariant}
      disabled={disabled}
      wrap={wrap}
      className={className}
    />
  ),
}

export const SegmentedControl: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Single-select tabs using `aria-pressed` and variant swap. ' +
          'Used in agent instructions (Editor / Markdown) and section pickers.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <DemoLabel>Mode switch (CardInstructions header)</DemoLabel>
        <DemoBox>
          <SegmentedButtons
            items={[
              { value: 'simple', label: 'Editor', icon: <LayoutList size={14} aria-hidden /> },
              { value: 'advanced', label: 'Markdown', icon: <FileText size={14} aria-hidden /> },
            ]}
            defaultValue="simple"
          />
        </DemoBox>
      </div>

      <div>
        <DemoLabel>Instruction sections (CardInstructions body)</DemoLabel>
        <DemoBox>
          <SegmentedButtons
            items={[
              { value: 'rules', label: 'Rules', icon: <ListChecks size={14} aria-hidden /> },
              { value: 'constraints', label: 'Constraints', icon: <ShieldAlert size={14} aria-hidden /> },
              { value: 'output', label: 'Output format', icon: <TextQuote size={14} aria-hidden /> },
              { value: 'tools', label: 'Tool notes', icon: <Wrench size={14} aria-hidden /> },
            ]}
            defaultValue="rules"
            wrap
          />
        </DemoBox>
      </div>
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <DemoLabel>Outline group — filters / period pickers</DemoLabel>
        <DemoBox>
          <ButtonGroup>
            <Button variant="outline" size="sm">
              Day
            </Button>
            <Button variant="outline" size="sm">
              Week
            </Button>
            <Button variant="outline" size="sm" aria-pressed>
              Month
            </Button>
            <Button variant="outline" size="sm">
              Year
            </Button>
          </ButtonGroup>
        </DemoBox>
      </div>

      <div>
        <DemoLabel>Primary split action — main CTA + menu affordance</DemoLabel>
        <DemoBox>
          <ButtonGroup>
            <Button variant="primary" size="sm">
              Save changes
            </Button>
            <Button
              variant="primary"
              size="sm"
              aria-label="More save options"
              style={{ paddingLeft: 8, paddingRight: 8 }}
            >
              <ChevronDown size={16} aria-hidden />
            </Button>
          </ButtonGroup>
        </DemoBox>
      </div>

      <div>
        <DemoLabel>Ghost toolbar — low-emphasis grouped actions</DemoLabel>
        <DemoBox>
          <ButtonGroup>
            <Button variant="ghost" size="sm">
              Copy
            </Button>
            <Button variant="ghost" size="sm">
              Duplicate
            </Button>
            <Button variant="ghost" size="sm">
              Delete
            </Button>
          </ButtonGroup>
        </DemoBox>
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <DemoLabel>Small — compact headers & forms</DemoLabel>
        <DemoBox>
          <ButtonGroup>
            <Button variant="outline" size="sm" aria-pressed>
              Active
            </Button>
            <Button variant="outline" size="sm">
              Option B
            </Button>
            <Button variant="outline" size="sm">
              Option C
            </Button>
          </ButtonGroup>
        </DemoBox>
      </div>

      <div>
        <DemoLabel>Default — standard density</DemoLabel>
        <DemoBox>
          <ButtonGroup>
            <Button variant="outline" size="md" aria-pressed>
              Active
            </Button>
            <Button variant="outline" size="md">
              Option B
            </Button>
            <Button variant="outline" size="md">
              Option C
            </Button>
          </ButtonGroup>
        </DemoBox>
      </div>

      <div>
        <DemoLabel>Large — spacious primary areas</DemoLabel>
        <DemoBox>
          <ButtonGroup>
            <Button variant="outline" size="lg" aria-pressed>
              Active
            </Button>
            <Button variant="outline" size="lg">
              Option B
            </Button>
          </ButtonGroup>
        </DemoBox>
      </div>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <DemoLabel>Entire group disabled</DemoLabel>
        <DemoBox>
          <ButtonGroup>
            <Button variant="outline" size="sm" disabled>
              Month
            </Button>
            <Button variant="outline" size="sm" disabled>
              Quarter
            </Button>
            <Button variant="outline" size="sm" disabled>
              Year
            </Button>
          </ButtonGroup>
        </DemoBox>
      </div>

      <div>
        <DemoLabel>Single disabled item in group</DemoLabel>
        <DemoBox>
          <ButtonGroup>
            <Button variant="outline" size="sm" aria-pressed>
              Enabled
            </Button>
            <Button variant="outline" size="sm" disabled>
              Locked
            </Button>
            <Button variant="outline" size="sm">
              Enabled
            </Button>
          </ButtonGroup>
        </DemoBox>
      </div>

      <div>
        <DemoLabel>Loading action in split button</DemoLabel>
        <DemoBox>
          <ButtonGroup>
            <Button variant="primary" size="sm" loading>
              Saving…
            </Button>
            <Button variant="primary" size="sm" disabled aria-label="More options">
              <ChevronDown size={16} aria-hidden />
            </Button>
          </ButtonGroup>
        </DemoBox>
      </div>
    </div>
  ),
}

export const Wrapping: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Apply `flex-wrap` on `ButtonGroup` when labels are long or the panel is narrow. ' +
          'Border overlap still works per row; test in agent editor with preview closed.',
      },
    },
  },
  render: () => (
    <div style={{ width: 360 }}>
      <DemoLabel>Narrow container (360px)</DemoLabel>
      <DemoBox>
        <SegmentedButtons
          items={[
            { value: 'rules', label: 'Rules', icon: <ListChecks size={14} aria-hidden /> },
            { value: 'constraints', label: 'Constraints', icon: <ShieldAlert size={14} aria-hidden /> },
            { value: 'output', label: 'Output format', icon: <TextQuote size={14} aria-hidden /> },
            { value: 'tools', label: 'Tool notes', icon: <Wrench size={14} aria-hidden /> },
          ]}
          defaultValue="rules"
          wrap
        />
      </DemoBox>
    </div>
  ),
}

export const SingleChild: Story = {
  parameters: {
    docs: {
      description: {
        story: 'One child keeps full border radius — useful when the group may grow later.',
      },
    },
  },
  render: () => (
    <DemoBox>
      <ButtonGroup>
        <Button variant="outline" size="sm">
          Only button
        </Button>
      </ButtonGroup>
    </DemoBox>
  ),
}
