import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import {
  ToastProvider,
  useToast,
  toast,
  type ToastVariant,
} from '@/components/ui/Toast/Toast';
import { Button } from '@/components/ui/Button/Button';

type ToastStoryArgs = {
  variant: ToastVariant;
  title: string;
  description: string;
  duration: number;
};

const meta: Meta<ToastStoryArgs> = {
  title: 'UI/Toast',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  argTypes: {
    variant: {
      control: 'radio',
      options: ['success', 'error'],
      description: 'Loại toast (thành công / lỗi)',
    },
    title: {
      control: 'text',
      description: 'Tiêu đề hiển thị trên toast',
    },
    description: {
      control: 'text',
      description: 'Mô tả phụ (để trống nếu không cần)',
    },
    duration: {
      control: { type: 'number', min: 1000, max: 10000, step: 500 },
      description: 'Thời gian tự ẩn (ms)',
    },
  },
};

export default meta;
type Story = StoryObj<ToastStoryArgs>;

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
);

const DemoBox = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '24px',
      border: '1px dashed var(--color-border)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-card)',
      flexWrap: 'wrap',
    }}
  >
    {children}
  </div>
);

function ToastPlayground({ variant, title, description, duration }: ToastStoryArgs) {
  const { toast: showToast } = useToast();

  const handleShow = () => {
    showToast({
      variant,
      title,
      description: description.trim() || undefined,
      duration,
    });
  };

  return (
    <DemoBox>
      <Button variant={variant === 'error' ? 'danger' : 'primary'} onClick={handleShow}>
        Hiện toast
      </Button>
    </DemoBox>
  );
}

export const Default: Story = {
  args: {
    variant: 'success',
    title: 'Lưu thành công',
    description: 'Cấu hình Agent đã được cập nhật.',
    duration: 3000,
  },
  render: (args) => <ToastPlayground {...args} />,
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Đã lưu',
    description: 'Thay đổi của bạn đã được lưu lại.',
    duration: 3000,
  },
  render: (args) => <ToastPlayground {...args} />,
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Lưu thất bại',
    description: 'Không thể kết nối tới worker. Thử lại sau.',
    duration: 3000,
  },
  render: (args) => <ToastPlayground {...args} />,
};

export const TitleOnly: Story = {
  args: {
    variant: 'success',
    title: 'Hoàn tất',
    description: '',
    duration: 3000,
  },
  render: (args) => <ToastPlayground {...args} />,
};

function ToastDemoImperative() {
  return (
    <DemoBox>
      <Button
        variant="outline"
        onClick={() =>
          toast.success('Đã sao chép', 'API key đã được copy vào clipboard.')
        }
      >
        toast.success()
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error('Không hợp lệ', 'Tên Agent không được để trống.')
        }
      >
        toast.error()
      </Button>
    </DemoBox>
  );
}

export const ImperativeApi: Story = {
  render: () => (
    <div>
      <DemoLabel>toast — gọi trực tiếp (cần ToastProvider)</DemoLabel>
      <ToastDemoImperative />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div>
      <DemoLabel>Nhiều toast liên tiếp</DemoLabel>
      <DemoBox>
        <Button
          variant="secondary"
          onClick={() => {
            toast.success('Bước 1', 'Đã xác thực phiên đăng nhập.');
            setTimeout(
              () => toast.success('Bước 2', 'Đã đồng bộ cấu hình.'),
              400,
            );
            setTimeout(
              () => toast.error('Bước 3', 'Worker timeout sau 30 giây.'),
              800,
            );
          }}
        >
          Kích hoạt chuỗi toast
        </Button>
      </DemoBox>
    </div>
  ),
};
