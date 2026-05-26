import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { Card } from '@/components/ui/Card/Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

// Label helper cho demo
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

// Container helper cho demo
const DemoBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '16px', 
    padding: '40px', 
    background: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)'
  }}>
    {children}
  </div>
);

export const Default: Story = {
  args: {
    children: (
      <div style={{ width: '300px' }}>
        <h3 style={{ marginBottom: '8px', fontWeight: 600 }}>Tiêu đề Card</h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Đây là nội dung mẫu bên trong Card. Card này đã được áp dụng bo góc radius-lg (14px) và có hiệu ứng hover shadow.
        </p>
      </div>
    ),
  },
};

export const Interactive: Story = {
  render: () => (
    <div>
      <DemoLabel>Hover vào để xem hiệu ứng Shadow</DemoLabel>
      <DemoBox>
        <Card style={{ width: '240px', cursor: 'pointer' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'var(--color-primary-dim)', 
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'var(--color-primary)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
            </div>
            <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Dự án mới</h4>
            <p style={{ fontSize: '12px', color: 'var(--color-text-subtle)' }}>Tạo project ngay lập tức</p>
          </div>
        </Card>
      </DemoBox>
    </div>
  ),
};
