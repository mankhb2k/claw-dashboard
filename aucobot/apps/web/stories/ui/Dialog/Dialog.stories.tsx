import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/Dialog/Dialog';
import { Button } from '@/components/ui/Button/Button';

// Tạo interface mở rộng để Storybook nhận diện các props ảo cho việc demo
interface InteractiveProps extends React.ComponentProps<typeof DialogContent> {
  title: string;
  description: string;
  content: string;
}

const meta: Meta<InteractiveProps> = {
  title: 'UI/Dialog',
  component: DialogContent as any,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    showClose: {
      control: 'boolean',
      description: 'Hiển thị nút X đóng modal ở góc trên bên phải',
    },
    title: {
      control: 'text',
      description: 'Tiêu đề của Modal (Dùng cho Demo)',
    },
    description: {
      control: 'text',
      description: 'Mô tả của Modal (Dùng cho Demo)',
    },
    content: {
      control: 'text',
      description: 'Nội dung bên trong Modal (Dùng cho Demo)',
    },
  },
};

export default meta;
type Story = StoryObj<InteractiveProps>;

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
const DemoBox = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    gap: '16px', 
    padding: '32px', 
    border: '1px dashed var(--color-border)', 
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-white)',
    ...style
  }}>
    {children}
  </div>
);

export const Interactive: Story = {
  args: {
    showClose: true,
    title: 'Tiêu đề Modal',
    description: 'Bạn có thể thay đổi văn bản này ở bảng Controls bên dưới.',
    content: 'Nội dung chính của modal nằm ở đây. Bạn cũng có thể sửa nó!',
  },
  render: (args) => (
    <div>
      <DemoLabel>Bấm vào nút bên dưới để mở Dialog và test Props ở bảng Controls:</DemoLabel>
      <DemoBox>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="primary">Mở Dialog</Button>
          </DialogTrigger>
          <DialogContent showClose={args.showClose}>
            <DialogHeader>
              <DialogTitle>{args.title}</DialogTitle>
              <DialogDescription>
                {args.description}
              </DialogDescription>
            </DialogHeader>
            <div style={{ padding: 'var(--space-4) 0' }}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-foreground)' }}>
                {args.content}
              </p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Hủy bỏ</Button>
              </DialogClose>
              <Button variant="primary">Lưu lại</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DemoBox>
    </div>
  ),
};

export const CustomContent: Story = {
  args: {
    showClose: false,
    title: 'Xác nhận hành động',
    description: '',
    content: 'Bạn có chắc chắn muốn thực hiện hành động này không?',
  },
  render: (args) => (
    <div>
      <DemoLabel>Modal tùy chỉnh (Ẩn nút Close mặc định bằng props):</DemoLabel>
      <DemoBox>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Mở Modal Tùy Chỉnh</Button>
          </DialogTrigger>
          <DialogContent showClose={args.showClose}>
            <DialogHeader>
              <DialogTitle>{args.title}</DialogTitle>
            </DialogHeader>
            <div style={{ padding: 'var(--space-4) 0', textAlign: 'center' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: 'var(--color-primary-dim)', 
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                ℹ️
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-foreground)' }}>
                {args.content}
              </p>
            </div>
            <DialogFooter style={{ justifyContent: 'center' }}>
              <DialogClose asChild>
                <Button variant="ghost">Quay lại</Button>
              </DialogClose>
              <Button variant="primary">Tôi đồng ý</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DemoBox>
    </div>
  ),
};


