import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/AlertDialog/AlertDialog';
import { Button } from '@/components/ui/Button/Button';

const meta: Meta<typeof AlertDialog> = {
  title: 'UI/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

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

export const Default: StoryObj = {
  render: () => (
    <div>
      <DemoLabel>Bấm vào nút bên dưới để xem hộp thoại:</DemoLabel>
      <DemoBox>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="primary">Mở Alert Dialog</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này không thể hoàn tác. Dữ liệu của bạn sẽ bị xóa vĩnh viễn khỏi máy chủ.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
              <AlertDialogAction>Tiếp tục</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DemoBox>
    </div>
  ),
};

export const Danger: StoryObj = {
  render: () => (
    <div>
      <DemoLabel>Trường hợp hành động nguy hiểm:</DemoLabel>
      <DemoBox style={{ borderColor: 'var(--color-danger-dim)' }}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="danger">Xóa tài khoản</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa tài khoản vĩnh viễn?</AlertDialogTitle>
              <AlertDialogDescription>
                Tất cả các project và dữ liệu liên quan sẽ bị xóa ngay lập tức. Hãy chắc chắn rằng bạn đã sao lưu dữ liệu quan trọng.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Để tôi suy nghĩ lại</AlertDialogCancel>
              <AlertDialogAction variant="danger">
                Tôi hiểu, hãy xóa đi
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DemoBox>
    </div>
  ),
};
