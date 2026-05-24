import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Grid } from '@/components/layout/Grid/Grid';

const meta: Meta<typeof Grid> = {
  title: 'Layout/Grid',
  component: Grid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    columns: {
      control: 'text',
      description: 'Số lượng cột (number) hoặc chuỗi CSS grid-template-columns (string)',
    },
    gap: {
      control: 'text',
      description: 'Khoảng cách giữa các phần tử (px, rem hoặc số)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Grid>;

// Label helper cho demo
const DemoLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{ 
    fontSize: '11px', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em', 
    color: 'var(--color-text-subtle)', 
    fontWeight: 600,
    marginBottom: '12px',
  }}>
    {children}
  </p>
);

// Item giả lập
const DummyItem = ({ children }: { children: React.ReactNode }) => (
  <div style={{ 
    padding: '16px', 
    background: 'var(--color-white)', 
    border: '1px solid var(--color-border)', 
    borderRadius: 'var(--radius-md)',
    textAlign: 'center',
    fontWeight: 500
  }}>
    {children}
  </div>
);

export const FixedColumns: Story = {
  render: () => (
    <div>
      <DemoLabel>Sử dụng số để chia cột đều (columns={4}, gap="1rem")</DemoLabel>
      <Grid columns={4} gap="1rem">
        <DummyItem>Item 1</DummyItem>
        <DummyItem>Item 2</DummyItem>
        <DummyItem>Item 3</DummyItem>
        <DummyItem>Item 4</DummyItem>
      </Grid>
    </div>
  ),
};

export const ResponsiveAutoFill: Story = {
  render: () => (
    <div>
      <DemoLabel>Sử dụng chuỗi cho Responsive (columns="repeat(auto-fill, minmax(200px, 1fr))", gap="1rem")</DemoLabel>
      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
        Hãy thử kéo dãn cửa sổ trình duyệt để thấy các item tự động nhảy hàng.
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
};

export const CustomGap: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <DemoLabel>Gap bằng số (gap={32} → 32px)</DemoLabel>
        <Grid columns={3} gap={32}>
          <DummyItem>Item 1</DummyItem>
          <DummyItem>Item 2</DummyItem>
          <DummyItem>Item 3</DummyItem>
        </Grid>
      </div>

      <div>
        <DemoLabel>Gap bằng chuỗi (gap="2rem")</DemoLabel>
        <Grid columns={3} gap="2rem">
          <DummyItem>Item 1</DummyItem>
          <DummyItem>Item 2</DummyItem>
          <DummyItem>Item 3</DummyItem>
        </Grid>
      </div>
    </div>
  ),
};
