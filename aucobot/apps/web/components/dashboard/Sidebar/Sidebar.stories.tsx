import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar/Sidebar';
import { I18nProvider } from '@/lib/i18n';
import { LayoutDashboard, Brain, MessageSquareCodeIcon, Sparkles, Cable, Settings as SettingsIcon } from 'lucide-react';

const meta: Meta<typeof Sidebar> = {
  title: 'Dashboard/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <I18nProvider defaultLocale="en">
        <div style={{ height: '100vh', display: 'flex' }}>
          <Story />
        </div>
      </I18nProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

const mockItems = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: LayoutDashboard,
    isActive: (p: string) => p === '/dashboard',
  },
  {
    href: '/dashboard/model',
    label: 'AI Model',
    icon: Brain,
    isActive: (p: string) => p === '/dashboard/model',
  },
  {
    href: '/dashboard/channel',
    label: 'Channels',
    icon: MessageSquareCodeIcon,
    isActive: (p: string) => p === '/dashboard/channel',
  },
  {
    href: '/dashboard/skill',
    label: 'Skill',
    icon: Sparkles,
    isActive: (p: string) => p === '/dashboard/skill',
  },
  {
    href: '/dashboard/connect',
    label: 'Connect',
    icon: Cable,
    isActive: (p: string) => p === '/dashboard/connect',
  },
  {
    href: '/dashboard/setting',
    label: 'Settings',
    icon: SettingsIcon,
    isActive: (p: string) => p === '/dashboard/setting',
  },
];

export const Default: Story = {
  args: {
    items: mockItems,
    collapsed: false,
    onToggle: () => console.log('Toggle sidebar'),
  },
};

export const Collapsed: Story = {
  args: {
    items: mockItems,
    collapsed: true,
    onToggle: () => console.log('Toggle sidebar'),
  },
};

// Extra items to test scroll overflow
const manyItems = [
  ...mockItems,
  ...mockItems.map(item => ({ ...item, href: item.href + '-2' })),
  ...mockItems.map(item => ({ ...item, href: item.href + '-3' })),
];

export const Overflow: Story = {
  args: {
    items: manyItems,
    collapsed: false,
    onToggle: () => console.log('Toggle sidebar'),
  },
};
