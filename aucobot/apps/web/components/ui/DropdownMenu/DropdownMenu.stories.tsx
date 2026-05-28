import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import {
  Ellipsis,
  HelpCircle,
  LogOut,
  Moon,
  Settings,
  Sun,
  User,
  Users,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemExtend,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
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
    contentWidth: {
      control: { type: 'number', min: 120, max: 400, step: 10 },
      description: 'Độ rộng tối thiểu của menu popup (px)',
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
  contentWidth: number;
};

export const Default: StoryObj<CustomStoryArgs> = {
  args: {
    align: 'end',
    triggerVariant: 'default',
    triggerText: 'Tùy chọn',
    sideOffset: 4,
    contentWidth: 180,
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
          <DropdownMenuContent
            align={args.align}
            sideOffset={args.sideOffset}
            width={args.contentWidth}
          >
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

export const ItemExtend: StoryObj = {
  render: () => (
    <div>
      <DemoLabel>
        Item mở rộng — luôn có chevron bên phải, hỗ trợ submenu
      </DemoLabel>
      <DemoBox>
        <DropdownMenu>
          <DropdownMenuTrigger variant="default">Tài khoản</DropdownMenuTrigger>
          <DropdownMenuContent align="start" width={220}>
            <DropdownMenuItem>
              <Settings size={14} aria-hidden />
              Cài đặt
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuItemExtend detail="Light">
                <Sun size={14} aria-hidden />
                Giao diện
              </DropdownMenuItemExtend>
              <DropdownMenuSubContent width={180}>
                <DropdownMenuItem>
                  <Sun size={14} aria-hidden />
                  Chế độ sáng
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Moon size={14} aria-hidden />
                  Chế độ tối
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings size={14} aria-hidden />
                  Theo hệ thống
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuItemExtend>
                <HelpCircle size={14} aria-hidden />
                Trợ giúp
              </DropdownMenuItemExtend>
              <DropdownMenuSubContent width={200}>
                <DropdownMenuItem>Tài liệu</DropdownMenuItem>
                <DropdownMenuItem>Nhận trợ giúp</DropdownMenuItem>
                <DropdownMenuItem>Liên hệ</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger">
              <LogOut size={14} aria-hidden />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DemoBox>
    </div>
  ),
};

export const WithIcons: StoryObj = {
  render: () => (
    <div>
      <DemoLabel>Menu item có icon + text (gap tự động từ .item)</DemoLabel>
      <DemoBox>
        <DropdownMenu>
          <DropdownMenuTrigger variant="default">Tài khoản</DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User size={14} aria-hidden />
              Hồ sơ cá nhân
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings size={14} aria-hidden />
              Cài đặt
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users size={14} aria-hidden />
              Team
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Moon size={14} aria-hidden />
              Chế độ tối
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Sun size={14} aria-hidden />
              Chế độ sáng
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger">
              <LogOut size={14} aria-hidden />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DemoBox>
    </div>
  ),
};
