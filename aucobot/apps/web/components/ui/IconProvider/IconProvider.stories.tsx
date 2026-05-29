import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { IconProvider } from "@/components/ui/IconProvider/IconProvider";

const demoIcons = [
  {
    name: "Discord",
    src: "/channel-icon/Discord-icon.svg",
  },
  {
    name: "Slack",
    src: "/channel-icon/Slack-icon.svg",
  },
  {
    name: "Telegram",
    src: "/channel-icon/Telegram-icon.svg",
  },
  {
    name: "Lark",
    src: "/channel-icon/Lark-icon.svg",
  },
];

const externalIcons = [
  {
    name: "GitHub",
    src: "https://cdn.simpleicons.org/github/171515",
  },
  {
    name: "Notion",
    src: "https://cdn.simpleicons.org/notion/000000",
  },
  {
    name: "Google Drive",
    src: "https://cdn.simpleicons.org/googledrive/4285F4",
  },
  {
    name: "Figma",
    src: "https://cdn.simpleicons.org/figma/F24E1E",
  },
];

const meta = {
  title: "UI/IconProvider",
  component: IconProvider,
  tags: ["autodocs"],
  args: {
    src: "/channel-icon/Discord-icon.svg",
    label: "Discord",
    size: "md",
    shape: "square",
    withBackground: true,
  },
  argTypes: {
    src: { control: "text" },
    label: { control: "text" },
    fallbackText: { control: "text" },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg", "xl"],
    },
    shape: {
      control: "inline-radio",
      options: ["square", "circle"],
    },
    withBackground: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof IconProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

function DemoGrid({ withBackground = true }: { withBackground?: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(124px, 1fr))",
        gap: "12px",
        width: "100%",
      }}
    >
      {demoIcons.map((icon) => (
        <div
          key={icon.name}
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-background)",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <IconProvider
            src={icon.src}
            label={icon.name}
            withBackground={withBackground}
          />
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-muted-foreground)",
            }}
          >
            {icon.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export const Playground: Story = {};

export const AllProviders: Story = {
  render: () => <DemoGrid />,
};

export const NoBackground: Story = {
  render: () => <DemoGrid withBackground={false} />,
};

export const FallbackText: Story = {
  args: {
    src: "",
    label: "Notion",
    fallbackText: "NO",
  },
};

export const ExternalImageLinks: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "12px",
        width: "100%",
      }}
    >
      {externalIcons.map((icon) => (
        <div
          key={icon.name}
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-background)",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <IconProvider src={icon.src} label={icon.name} withBackground />
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-muted-foreground)",
            }}
          >
            {icon.name}
          </span>
        </div>
      ))}
    </div>
  ),
};
