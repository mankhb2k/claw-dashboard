import React from 'react'

import { Box, BoxProps } from '@/components/layout/Box/Box'
import { Flex } from '@/components/layout/Flex/Flex'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const meta: Meta<typeof Flex> = {
  title: 'Layout/Flex',
  component: Flex,
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'select', options: ['row', 'column', 'row-reverse', 'column-reverse'] },
    align: { control: 'select', options: ['start', 'center', 'end', 'stretch', 'baseline'] },
    justify: { control: 'select', options: ['start', 'center', 'end', 'between', 'around', 'evenly'] },
    gap: { control: 'number' },
    gapX: { control: 'number' },
    gapY: { control: 'number' },
    p: { control: 'number' },
    px: { control: 'number' },
    py: { control: 'number' },
  },
}

export default meta
type Story = StoryObj<typeof Flex>

/* =============================================================================
   HELPER — Use Box as items to test composition
   ============================================================================= */
const TestBox = ({ color = 'primary', children = 'Box', ...props }: BoxProps) => (
  <Box 
    color={color} 
    width="100px" 
    height="60px" 
    radius="sm" 
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}
    {...props}
  >
    {children}
  </Box>
)

export const Default: Story = {
  args: {
    gap: 4,
    children: (
      <>
        <TestBox color="primary" />
        <TestBox color="success" />
        <TestBox color="danger" />
      </>
    ),
  },
}

export const MixedGaps: Story = {
  args: {
    wrap: 'wrap',
    gapX: 8,
    gapY: 2,
    style: { width: '340px', border: '1px dashed var(--color-border)', padding: '12px' },
    children: (
      <>
        <TestBox color="primary">GapX: 8</TestBox>
        <TestBox color="success">GapY: 2</TestBox>
        <TestBox color="warning">Item 3</TestBox>
        <TestBox color="danger">Item 4</TestBox>
        <TestBox color="surface" border>Item 5</TestBox>
        <TestBox color="subtle" border>Item 6</TestBox>
      </>
    ),
  },
}

export const Column: Story = {
  args: {
    direction: 'column',
    gap: 2,
    children: (
      <>
        <TestBox color="primary">Item 1</TestBox>
        <TestBox color="success">Item 2</TestBox>
        <TestBox color="warning">Item 3</TestBox>
      </>
    ),
  },
}

export const Centered: Story = {
  args: {
    center: true,
    fullWidth: true,
    style: { height: '200px', border: '1px dashed var(--color-border)' },
    children: <TestBox color="primary">Centered</TestBox>,
  },
}

export const JustifyBetween: Story = {
  args: {
    justify: 'between',
    fullWidth: true,
    p: 4,
    border: true,
    radius: 'md',
    children: (
      <>
        <TestBox color="primary">Start</TestBox>
        <TestBox color="warning">Middle</TestBox>
        <TestBox color="danger">End</TestBox>
      </>
    ),
  },
}

export const NestedLayout: Story = {
  render: () => (
    <Flex direction="column" gap={6} p={4} border radius="lg" style={{ width: '100%' }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>NESTED COMPOSITION TEST</p>
      
      <Flex justify="between" align="center" fullWidth>
        <Box color="white" border p={2} radius="md">Left Content</Box>
        <Flex gap={2}>
          <Box color="primary" px={4} py={2} radius="sm">Action 1</Box>
          <Box color="subtle" border px={4} py={2} radius="sm">Action 2</Box>
        </Flex>
      </Flex>

      <Flex gap={4} wrap="wrap">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <Box key={`flex-card-${n}`} color="surface" border p={6} radius="lg" width="120px" style={{ textAlign: 'center' }}>
            Card {n}
          </Box>
        ))}
      </Flex>
    </Flex>
  )
}

export const CustomPixelSpacing: Story = {
  args: {
    gap: 25,
    p: 40,
    border: true,
    radius: 'lg',
    color: 'surface',
    children: (
      <>
        <TestBox color="primary">Gap: 25px</TestBox>
        <TestBox color="success">P: 40px</TestBox>
        <TestBox color="danger">Flex!</TestBox>
      </>
    ),
  },
}
