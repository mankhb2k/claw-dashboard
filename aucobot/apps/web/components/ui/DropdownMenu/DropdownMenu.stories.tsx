import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { Ellipsis } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu/DropdownMenu';

const meta: Meta = {
  title: 'UI/DropdownMenu',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: 'select',
      options: ['start', 'center', 'end'],
      description: 'Căn lề của menu popup so với nút trigger',
    },
    triggerVariant: {
      control: 'select',
      options: ['default', 'kebab', 'unstyled'],
      description: 'Kiểu hiển thị của nút trigger',
    },
    triggerText: {
      control: 'text',
      description: 'Chữ hiển thị trên nút (chỉ áp dụng khi variant là default)',
    },
    sideOffset: {
      control: 'number',
      description: 'Khoảng cách giữa menu popup và nút trigger (px)',
    },
  },
};

export default meta;

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
    gap: '16px', 
    padding: '60px', 
    minWidth: '300px',
    border: '1px dashed var(--color-border)', 
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-white)',
    alignItems: 'center'
  }}>
    {children}
  </div>
);

type CustomStoryArgs = {
  align: 'start' | 'center' | 'end';
  triggerVariant: 'default' | 'kebab' | 'unstyled';
  triggerText: string;
  sideOffset: number;
};

export const Default: StoryObj<CustomStoryArgs> = {
  args: {
    align: 'end',
    triggerVariant: 'default',
    triggerText: 'Tùy chọn',
    sideOffset: 4,
  },
  render: (args) => (
    <div>
      <DemoLabel>Bấm vào nút để mở Menu (Hover thay đổi cả nền và màu chữ)</DemoLabel>
      <DemoBox>
        <DropdownMenu>
          <DropdownMenuTrigger variant={args.triggerVariant}>
            {args.triggerVariant === 'kebab' ? (
              <Ellipsis size={20} />
            ) : (
              args.triggerText
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align={args.align} sideOffset={args.sideOffset}>
            <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Hồ sơ cá nhân</DropdownMenuItem>
            <DropdownMenuItem>Cài đặt</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger">Đăng xuất</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DemoBox>
    </div>
  ),
};

export const KebabMenu: StoryObj = {
  render: () => (
    <div>
      <DemoLabel>Kebab Menu (Khi Mở: Nền trong suốt, chỉ đổi màu Icon)</DemoLabel>
      <DemoBox>
        <DropdownMenu>
          <DropdownMenuTrigger variant="kebab">
            <Ellipsis size={20} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
            <DropdownMenuItem>Sao chép ID</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger">Xóa vĩnh viễn</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DemoBox>
    </div>
  ),
};
