import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import { Box } from '@/components/layout/Box/Box'

const meta: Meta<typeof Box> = {
  title: 'Layout/Box',
  component: Box,
  tags: ['autodocs'],
  argTypes: {
    p: { control: 'number' },
    px: { control: 'number' },
    py: { control: 'number' },
    pt: { control: 'number' },
    pb: { control: 'number' },
    pl: { control: 'number' },
    pr: { control: 'number' },
    radius: { control: 'select', options: ['sm', 'md', 'lg', 'xl', 'full'] },
    color: { 
      control: 'select', 
      options: [
        'white', 'subtle', 'surface', 
        'primary-dim', 'danger-dim', 'success-dim',
        'primary', 'success', 'warning', 'danger'
      ] 
    },
    border: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Box>

export const Default: Story = {
  args: {
    p: 4,
    children: 'Một Box đơn giản.',
  },
}

export const BackgroundColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '500px' }}>
      <p style={{ fontSize: '12px', fontWeight: 600 }}>DIM COLORS (NHẠT)</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Box color="primary-dim" p={3}>Primary Dim</Box>
        <Box color="danger-dim" p={3}>Danger Dim</Box>
        <Box color="success-dim" p={3}>Success Dim</Box>
      </div>

      <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '16px' }}>SOLID COLORS (ĐẬM)</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Box color="primary" p={3} width="100px" style={{ textAlign: 'center' }}>Primary</Box>
        <Box color="success" p={3} width="100px" style={{ textAlign: 'center' }}>Success</Box>
        <Box color="warning" p={3} width="100px" style={{ textAlign: 'center' }}>Warning</Box>
        <Box color="danger" p={3} width="100px" style={{ textAlign: 'center' }}>Danger</Box>
      </div>

      <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '16px' }}>CUSTOM COLORS (TỰ CHỌN)</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Box color="#6366f1" p={3} radius="md">Indigo (#6366f1)</Box>
        <Box color="hotpink" p={3} radius="md">Hot Pink</Box>
        <Box color="rgba(0, 128, 128, 0.5)" p={3} radius="md">Teal Alpha</Box>
      </div>
    </div>
  ),
}

export const Combined: Story = {
  args: {
    color: 'primary',
    p: 6,
    width: '100%',
    style: { textAlign: 'center', fontWeight: 'bold' },
    children: 'BOX SOLID PRIMARY',
  },
}

export const ArbitrarySpacing: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '500px' }}>
      <p style={{ fontSize: '12px', fontWeight: 600 }}>SỬ DỤNG GIÁ TRỊ PX (SỐ)</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <Box color="surface" p={10} border>Padding 10 (10px)</Box>
        <Box color="surface" p={32} border>Padding 32 (32px)</Box>
        <Box color="surface" px={30} py={5} border>PX 30, PY 5</Box>
      </div>

      <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '16px' }}>KẾT HỢP CÁC HƯỚNG</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <Box color="surface" p={20} pt={2} border>P=20, PT=2</Box>
        <Box color="surface" py={30} px={10} border>PY=30, PX={10}</Box>
      </div>
    </div>
  ),
}
