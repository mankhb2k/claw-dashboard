import React from 'react'

import { Textarea } from '@/components/ui/Textarea/Textarea'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-line text field with optional label, error, and hint — mirrors the `Input` field API for forms.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label shown above the textarea',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    hint: {
      control: 'text',
      description: 'Helper text below the field (hidden when `error` is set)',
    },
    error: {
      control: 'text',
      description: 'Validation error message',
    },
    rows: {
      control: { type: 'number', min: 2, max: 20, step: 1 },
      description: 'Visible row count',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable editing',
    },
    readOnly: {
      control: 'boolean',
      description: 'Read-only mode',
    },
    id: {
      control: 'text',
      description: 'Associates label via htmlFor',
    },
    fill: {
      control: 'boolean',
      description: 'Stretch to fill remaining flex space in parent container',
    },
  },
  args: {
    id: 'textarea-demo',
    label: 'Description',
    placeholder: 'Enter a description…',
    rows: 4,
    disabled: false,
    readOnly: false,
    fill: false,
  },
}

export default meta
type Story = StoryObj<typeof Textarea>

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

const DemoBox = ({ children, width = 420 }: { children: React.ReactNode; width?: number }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      padding: '32px',
      width,
      border: '1px dashed var(--color-border)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-background)',
    }}
  >
    {children}
  </div>
)

/** Interactive playground — tweak label, rows, error, hint via Controls */
export const Default: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a description…',
    rows: 4,
  },
}

export const WithHint: Story = {
  args: {
    id: 'textarea-hint',
    label: 'Environment notes (optional)',
    placeholder: 'e.g. Camera name, SSH host, preferred TTS voice…',
    hint: 'Setup-specific notes — does not replace configuration in openclaw.json.',
    rows: 4,
  },
}

export const WithError: Story = {
  args: {
    id: 'textarea-error',
    label: 'AGENTS.md (Markdown)',
    placeholder: '# Role\n…',
    error: 'Markdown content is required.',
    defaultValue: '',
    rows: 6,
  },
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <DemoLabel>Default</DemoLabel>
        <DemoBox>
          <Textarea
            id="state-default"
            label="Rules (one line per rule)"
            placeholder={'Always confirm before deleting data\nPrefer concise replies'}
            rows={5}
          />
        </DemoBox>
      </div>

      <div>
        <DemoLabel>With hint</DemoLabel>
        <DemoBox>
          <Textarea
            id="state-hint"
            label="Environment notes (optional)"
            placeholder="e.g. Camera name, SSH host…"
            hint="Shown only when there is no error."
            rows={4}
          />
        </DemoBox>
      </div>

      <div>
        <DemoLabel>Error</DemoLabel>
        <DemoBox>
          <Textarea
            id="state-error"
            label="Output format"
            error="Please provide at least one line."
            defaultValue=""
            rows={3}
          />
        </DemoBox>
      </div>

      <div>
        <DemoLabel>Disabled & read-only</DemoLabel>
        <DemoBox>
          <Textarea
            id="state-disabled"
            label="Disabled"
            disabled
            defaultValue="Cannot edit this content."
            rows={3}
          />
          <Textarea
            id="state-readonly"
            label="Read only"
            readOnly
            defaultValue={'Line one\nLine two'}
            rows={3}
          />
        </DemoBox>
      </div>
    </div>
  ),
}

export const RowHeights: Story = {
  render: () => (
    <DemoBox width={480}>
      <Textarea
        id="rows-2"
        label="Compact (2 rows)"
        placeholder="Short answer…"
        rows={2}
      />
      <Textarea
        id="rows-5"
        label="Standard (5 rows)"
        placeholder="One idea per line…"
        rows={5}
      />
      <Textarea
        id="rows-10"
        label="Tall (10 rows)"
        placeholder="Long-form content…"
        rows={10}
      />
    </DemoBox>
  ),
}

export const AgentInstructions: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Patterns used in `CardInstructions` — rules list and markdown editor.',
      },
    },
  },
  render: () => (
    <DemoBox width={520}>
      <Textarea
        id="agent-rules"
        label="Rules (one line per rule)"
        rows={5}
        placeholder={'Always confirm before deleting data\nPrefer concise replies'}
      />
      <Textarea
        id="agent-markdown"
        label="AGENTS.md (Markdown)"
        rows={12}
        placeholder={'# Role\n\nWhat does this agent do? Who does it serve?'}
        style={{
          minHeight: 280,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        }}
      />
    </DemoBox>
  ),
}

export const WithoutLabel: Story = {
  args: {
    id: 'textarea-no-label',
    label: undefined,
    placeholder: 'Textarea without label…',
    rows: 4,
  },
}

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\n' +
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\n' +
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n\n' +
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\n' +
  'Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit.'

export const OverflowScroll: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Fixed height via `rows` — when content exceeds the box, scroll **inside** the textarea (`overflow-y: auto`). ' +
          'Try typing or use the pre-filled lorem text.',
      },
    },
  },
  render: () => (
    <DemoBox width={480}>
      <Textarea
        id="overflow-scroll"
        label="Long content (rows=4)"
        rows={4}
        defaultValue={LOREM}
        hint="Scroll inside the field — the frame height does not grow with content."
      />
    </DemoBox>
  ),
}

export const FillRemainingSpace: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Use `fill` when the parent is a flex column with fixed height — the textarea fills the remaining space.',
      },
    },
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 360,
        width: 480,
        padding: 24,
        gap: 12,
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-background)',
      }}
    >
      <DemoLabel>Panel header (fixed)</DemoLabel>
      <Textarea
        id="fill-remaining"
        fill
        label="Notes"
        rows={3}
        placeholder="Textarea expands to fill remaining height…"
        defaultValue={LOREM}
        hint="Parent: flex column, height 360px. Textarea: fill=true."
      />
    </div>
  ),
}
