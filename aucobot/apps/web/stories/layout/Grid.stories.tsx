import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import { Grid } from '@/components/layout/Grid/Grid'
import { Box, BoxProps } from '@/components/layout/Box/Box'

const meta: Meta<typeof Grid> = {
  title: 'Layout/Grid',
  component: Grid,
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
