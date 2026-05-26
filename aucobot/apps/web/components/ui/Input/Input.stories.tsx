import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { Input } from '@/components/ui/Input/Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

const DemoLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{ 
    fontSize: '11px', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em', 
    color: 'var(--color-text-subtle)', 
    fontWeight: 600,
    marginBottom: '12px'
  }}>
    {children}
  </p>
);

const DemoBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    gap: '24px', 
    padding: '32px', 
    minWidth: '400px',
    border: '1px dashed var(--color-border)', 
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-white)'
  }}>
    {children}
  </div>
);

export const Default: Story = {
  args: {
    label: 'Email address',
    placeholder: 'Enter your email...',
    type: 'email',
  },
};

export const States: Story = {
  render: () => (
    <div>
      <DemoLabel>Các trạng thái của Input</DemoLabel>
      <DemoBox>
        <Input label="Bình thường" placeholder="Nhập văn bản..." />
        <Input label="Mật khẩu" type="password" defaultValue="123456" />
        <Input label="Bị lỗi" error="Vui lòng nhập đúng định dạng email" defaultValue="invalid-email" />
        <Input label="Bị vô hiệu hóa" disabled defaultValue="Dữ liệu không thể sửa" />
      </DemoBox>
    </div>
  ),
};
