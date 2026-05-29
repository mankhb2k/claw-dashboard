import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import { Grid } from '@/components/layout/Grid/Grid'
import { Box, BoxProps } from '@/components/layout/Box/Box'

const meta: Meta<typeof Grid> = {
  title: 'Layout/Grid',
  component: Grid,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    columns: { control: 'select', options: [1, 2, 3, 4, 5, 6, 12] },
    gap: { control: 'select', options: [0, 1, 2, 3, 4, 6, 8] },
    align: { control: 'select', options: ['start', 'center', 'end', 'stretch'] },
    justify: { control: 'select', options: ['start', 'center', 'end', 'stretch'] },
  },
}

export default meta
type Story = StoryObj<typeof Grid>

const TestBox = ({ color = 'primary', children = 'Box', ...props }: BoxProps) => (
  <Box 
    color={color} 
    radius="md" 
    p={4}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', minHeight: '80px' }}
    {...props}
  >
    {children}
  </Box>
)

export const Default: Story = {
  args: {
    columns: 3,
    gap: 4,
    children: (
      <>
        <TestBox color="primary">1</TestBox>
        <TestBox color="success">2</TestBox>
        <TestBox color="danger">3</TestBox>
        <TestBox color="warning">4</TestBox>
        <TestBox color="surface" border>5</TestBox>
        <TestBox color="subtle" border>6</TestBox>
      </>
    ),
  },
}

export const TwoColumns: Story = {
  args: {
    columns: 2,
    gap: 6,
    children: (
      <>
        <TestBox color="primary-dim" style={{ color: 'var(--color-primary)' }}>Sidebar/Panel</TestBox>
        <TestBox color="white" border>Main Content Area</TestBox>
      </>
    ),
  },
}

export const TwelveColumns: Story = {
  args: {
    columns: 12,
    gap: 2,
    children: Array.from({ length: 12 }).map((_, i) => (
      <TestBox key={i} color="surface" border style={{ minHeight: '40px', fontSize: '10px' }}>
        {i + 1}
      </TestBox>
    )),
  },
}

export const ComplexLayout: Story = {
  render: () => (
    <Grid columns={3} gap={4} p={4} border radius="lg" color="subtle">
      <TestBox color="primary" style={{ gridColumn: 'span 2' }}>Span 2 Columns</TestBox>
      <TestBox color="success">Span 1</TestBox>
      <TestBox color="warning">Span 1</TestBox>
      <TestBox color="danger" style={{ gridColumn: 'span 2' }}>Span 2 Columns</TestBox>
      <TestBox color="white" border style={{ gridColumn: 'span 3' }}>Span All 3 Columns</TestBox>
    </Grid>
  ),
}

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

const DummyItem = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      padding: '16px',
      background: 'var(--color-background)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      textAlign: 'center',
      fontWeight: 500,
    }}
  >
    {children}
  </div>
)

export const FixedColumns: Story = {
  render: () => (
    <div>
      <DemoLabel>Equal columns with a number (columns={4}, gap=&quot;1rem&quot;)</DemoLabel>
      <Grid columns={4} gap="1rem">
        <DummyItem>Item 1</DummyItem>
        <DummyItem>Item 2</DummyItem>
        <DummyItem>Item 3</DummyItem>
        <DummyItem>Item 4</DummyItem>
      </Grid>
    </div>
  ),
}

export const ResponsiveAutoFill: Story = {
  render: () => (
    <div>
      <DemoLabel>
        Responsive string (columns=&quot;repeat(auto-fill, minmax(200px, 1fr))&quot;)
      </DemoLabel>
      <p style={{ fontSize: '13px', color: 'var(--color-muted-foreground)', marginBottom: '16px' }}>
        Resize the browser window to see items wrap automatically.
      </p>
      <Grid columns="repeat(auto-fill, minmax(200px, 1fr))" gap="1rem">
        <DummyItem>Item 1</DummyItem>
        <DummyItem>Item 2</DummyItem>
        <DummyItem>Item 3</DummyItem>
        <DummyItem>Item 4</DummyItem>
        <DummyItem>Item 5</DummyItem>
        <DummyItem>Item 6</DummyItem>
      </Grid>
    </div>
  ),
}

export const CustomGap: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <DemoLabel>Numeric gap (gap={'{32}'} → 32px)</DemoLabel>
        <Grid columns={3} gap={32}>
          <DummyItem>Item 1</DummyItem>
          <DummyItem>Item 2</DummyItem>
          <DummyItem>Item 3</DummyItem>
        </Grid>
      </div>
      <div>
        <DemoLabel>String gap (gap=&quot;2rem&quot;)</DemoLabel>
        <Grid columns={3} gap="2rem">
          <DummyItem>Item 1</DummyItem>
          <DummyItem>Item 2</DummyItem>
          <DummyItem>Item 3</DummyItem>
        </Grid>
      </div>
    </div>
  ),
}
