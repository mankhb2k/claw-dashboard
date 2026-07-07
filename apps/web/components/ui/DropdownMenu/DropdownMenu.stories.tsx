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
import React from 'react';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSubItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
} from '@/components/ui/DropdownMenu/DropdownMenu';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

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
      description: 'Menu popup alignment relative to the trigger',
    },
    triggerVariant: {
      control: 'select',
      options: ['default', 'kebab', 'unstyled'],
      description: 'Trigger button style',
    },
    triggerText: {
      control: 'text',
      description: 'Trigger label (default variant only)',
    },
    sideOffset: {
      control: 'number',
      description: 'Gap between menu popup and trigger (px)',
    },
    contentWidth: {
      control: { type: 'number', min: 120, max: 400, step: 10 },
      description: 'Minimum menu popup width (px)',
    },
    subContentWidth: {
      control: { type: 'number', min: 120, max: 400, step: 10 },
      description: 'Minimum submenu popup width (px)',
    },
    select: {
      control: 'boolean',
      description: 'DropdownMenuSub — single-select submenu (checkmark)',
    },
    theme: {
      control: 'select',
      options: ['light', 'dark', 'system'],
      description: 'Selected value in Appearance submenu',
    },
  },
};

export default meta;

const DemoLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-muted-foreground)',
    fontWeight: 600,
    marginBottom: '12px',
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
    background: 'var(--color-background)',
    alignItems: 'center',
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
    triggerText: 'Options',
    sideOffset: 4,
    contentWidth: 180,
  },
  render: (args) => (
    <div>
      <DemoLabel>Click the button to open the menu (hover changes background and text)</DemoLabel>
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
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DemoBox>
    </div>
  ),
};

export const KebabMenu: StoryObj<Pick<CustomStoryArgs, 'align' | 'contentWidth' | 'sideOffset'>> = {
  args: {
    align: 'end',
    sideOffset: 4,
    contentWidth: 180,
  },
  render: (args) => (
    <div>
      <DemoLabel>Kebab menu (open: transparent background, icon color only)</DemoLabel>
      <DemoBox>
        <DropdownMenu>
          <DropdownMenuTrigger variant="kebab">
            <Ellipsis size={20} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={args.align}
            sideOffset={args.sideOffset}
            width={args.contentWidth}
          >
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Copy ID</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger">Delete permanently</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DemoBox>
    </div>
  ),
};

const THEME_LABELS = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
} as const;

type ThemeOption = keyof typeof THEME_LABELS;

type SubMenuStoryArgs = {
  align: 'start' | 'center' | 'end';
  triggerText: string;
  sideOffset: number;
  contentWidth: number;
  subContentWidth: number;
  select: boolean;
  theme: ThemeOption;
};

export const ItemExtend: StoryObj<SubMenuStoryArgs> = {
  args: {
    align: 'start',
    triggerText: 'Account',
    sideOffset: 4,
    contentWidth: 220,
    subContentWidth: 180,
    select: true,
    theme: 'light',
  },
  render: function ItemExtendStory(args) {
    const [theme, setTheme] = React.useState<ThemeOption>(args.theme);

    React.useEffect(() => {
      setTheme(args.theme);
    }, [args.theme]);

    return (
      <div>
        <DemoLabel>
          SubItem + submenu — chevron on the right, `select` enables checkmark
        </DemoLabel>
        <DemoBox>
          <DropdownMenu>
            <DropdownMenuTrigger variant="default">{args.triggerText}</DropdownMenuTrigger>
            <DropdownMenuContent
              align={args.align}
              sideOffset={args.sideOffset}
              width={args.contentWidth}
            >
              <DropdownMenuItem>
                <Settings size={14} aria-hidden />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSub select={args.select}>
                <DropdownMenuSubItem detail={THEME_LABELS[theme]}>
                  <Sun size={14} aria-hidden />
                  Appearance
                </DropdownMenuSubItem>
                <DropdownMenuSubContent width={args.subContentWidth}>
                  <DropdownMenuItem
                    selected={theme === 'light'}
                    onSelect={() => setTheme('light')}
                  >
                    <Sun size={14} aria-hidden />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    selected={theme === 'dark'}
                    onSelect={() => setTheme('dark')}
                  >
                    <Moon size={14} aria-hidden />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    selected={theme === 'system'}
                    onSelect={() => setTheme('system')}
                  >
                    <Settings size={14} aria-hidden />
                    System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubItem>
                  <HelpCircle size={14} aria-hidden />
                  Help
                </DropdownMenuSubItem>
                <DropdownMenuSubContent width={200}>
                  <DropdownMenuItem>Documentation</DropdownMenuItem>
                  <DropdownMenuItem>Get support</DropdownMenuItem>
                  <DropdownMenuItem>Contact</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="danger">
                <LogOut size={14} aria-hidden />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DemoBox>
      </div>
    );
  },
};

export const WithIcons: StoryObj<Pick<CustomStoryArgs, 'align' | 'triggerText' | 'contentWidth' | 'sideOffset'>> = {
  args: {
    align: 'end',
    triggerText: 'Account',
    sideOffset: 4,
    contentWidth: 200,
  },
  render: (args) => (
    <div>
      <DemoLabel>Menu items with icon + text (gap from .item)</DemoLabel>
      <DemoBox>
        <DropdownMenu>
          <DropdownMenuTrigger variant="default">{args.triggerText}</DropdownMenuTrigger>
          <DropdownMenuContent
            align={args.align}
            sideOffset={args.sideOffset}
            width={args.contentWidth}
          >
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User size={14} aria-hidden />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings size={14} aria-hidden />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users size={14} aria-hidden />
              Team
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Moon size={14} aria-hidden />
              Dark mode
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Sun size={14} aria-hidden />
              Light mode
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger">
              <LogOut size={14} aria-hidden />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DemoBox>
    </div>
  ),
};
