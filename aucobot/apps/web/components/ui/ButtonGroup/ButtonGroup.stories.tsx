import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { ButtonGroup } from '@/components/ui/ButtonGroup/ButtonGroup';
import { Button } from '@/components/ui/Button/Button';

const meta: Meta<typeof ButtonGroup> = {
  title: 'UI/ButtonGroup',
  component: ButtonGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

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
    border: '1px dashed var(--color-border)', 
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-white)'
  }}>
    {children}
  </div>
);

export const Default: Story = {
  render: () => (
    <div>
      <DemoLabel>Nút nhóm lại với nhau</DemoLabel>
      <DemoBox>
        <ButtonGroup>
          <Button variant="outline">Tháng</Button>
          <Button variant="outline">Quý</Button>
          <Button variant="outline">Năm</Button>
        </ButtonGroup>

        <ButtonGroup>
          <Button variant="primary">Lưu lại</Button>
          <Button variant="primary" style={{ paddingLeft: '8px', paddingRight: '8px' }}>
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </Button>
        </ButtonGroup>
      </DemoBox>
    </div>
  ),
};
