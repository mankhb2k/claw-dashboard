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
            background: "var(--color-white)",
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
              color: "var(--color-text-muted)",
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
