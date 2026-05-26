import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { Select } from '@/components/ui/Select/Select';
import { Card } from '@/components/ui/Card/Card';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Select>;

/* =============================================================================
   HELPER COMPONENTS (Self-contained for Demo)
   ============================================================================= */

const DemoLabel = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--color-text-subtle)',
      fontWeight: 600,
      marginBottom: '12px',
    }}
  >
    {children}
  </p>
);

const DemoBox = ({ children, width = '450px' }: { children: React.ReactNode; width?: string }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      padding: '40px',
      width: width,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
    }}
  >
    {children}
  </div>
);

/* =============================================================================
   STORIES
   ============================================================================= */

export const Default: Story = {
  args: {
    id: 'select-default',
    label: 'Chọn mô hình AI',
    placeholder: 'Chọn một mô hình...',
    options: [
      { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
      { value: 'claude-3-5', label: 'Claude 3.5 Sonnet (Anthropic)' },
      { value: 'gemini-1-5', label: 'Gemini 1.5 Pro (Google)' },
      { value: 'deepseek-v3', label: 'DeepSeek V3 (DeepSeek)' },
    ],
  },
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <section>
        <DemoLabel>Trạng thái bình thường & Placeholder</DemoLabel>
        <DemoBox>
          <Select
            id="select-normal"
            label="Khu vực triển khai"
            placeholder="Chọn server..."
            options={[
              { value: 'sg', label: 'Singapore (Asia Southeast)' },
              { value: 'us', label: 'United States (North America)' },
              { value: 'eu', label: 'Frankfurt (Europe Central)' },
            ]}
          />
        </DemoBox>
      </section>

      <section>
        <DemoLabel>Trạng thái có lỗi (Validation Error)</DemoLabel>
        <DemoBox>
          <Select
            id="select-error"
            label="Gói thành viên"
            error="Vui lòng chọn gói dịch vụ để tiếp tục"
            options={[
              { value: 'free', label: 'Miễn phí' },
              { value: 'pro', label: 'Chuyên nghiệp' },
              { value: 'ent', label: 'Doanh nghiệp' },
            ]}
          />
        </DemoBox>
      </section>

      <section>
        <DemoLabel>Trạng thái vô hiệu hóa (Disabled)</DemoLabel>
        <DemoBox>
          <Select
            id="select-disabled"
            label="Cổng thanh toán (Đang bảo trì)"
            defaultValue="stripe"
            disabled
            options={[
              { value: 'stripe', label: 'Stripe' },
              { value: 'paypal', label: 'PayPal' },
              { value: 'vietqr', label: 'VietQR' },
            ]}
          />
        </DemoBox>
      </section>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div style={{ padding: '40px' }}>
      <DemoLabel>Sử dụng trong Card (Thực tế)</DemoLabel>
      <Card style={{ width: '400px', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '8px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '16px' }}>Cấu hình dự án</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Thiết lập các thông số cơ bản cho project của bạn.
            </p>
          </div>
          
          <Select
            id="project-type"
            label="Loại dự án"
            defaultValue="nextjs"
            options={[
              { value: 'nextjs', label: 'Next.js Web Application' },
              { value: 'nestjs', label: 'NestJS Backend API' },
              { value: 'python', label: 'Python Automation' },
            ]}
          />
          
          <Select
            id="project-visibility"
            label="Chế độ hiển thị"
            defaultValue="private"
            options={[
              { value: 'private', label: 'Riêng tư (Private)' },
              { value: 'public', label: 'Công khai (Public)' },
            ]}
          />

          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <button style={{ 
              padding: '8px 16px', 
              background: 'var(--color-primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
              fontSize: '14px'
            }}>
              Lưu thay đổi
            </button>
          </div>
        </div>
      </Card>
    </div>
  ),
};
