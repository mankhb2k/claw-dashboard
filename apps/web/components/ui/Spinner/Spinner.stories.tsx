import * as React from "react";

import { Flex } from "@/components/layout";
import { Typography, Button } from "@/components/ui";
import { Spinner } from "@/components/ui/Spinner/Spinner";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof Spinner> = {
  title: "UI/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Spinner size",
    },
    loading: {
      control: "boolean",
      description: "Loading visibility",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {
    size: "md",
    loading: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <Flex align="center" gap={4}>
      <Flex direction="column" align="center" gap={1}>
        <Spinner size="sm" />
        <Typography variant="small">Small</Typography>
      </Flex>
      <Flex direction="column" align="center" gap={1}>
        <Spinner size="md" />
        <Typography variant="small">Medium</Typography>
      </Flex>
      <Flex direction="column" align="center" gap={1}>
        <Spinner size="lg" />
        <Typography variant="small">Large</Typography>
      </Flex>
    </Flex>
  ),
};

export const LoadingState: Story = {
  render: () => {
    const LoadingDemo = () => {
      const [loading, setLoading] = React.useState(true);
      return (
        <Flex direction="column" gap={2} align="start">
          <button
            onClick={() => setLoading(!loading)}
            style={{
              padding: "var(--space-2) var(--space-3)",
              background: "var(--color-muted)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
            }}
          >
            Toggle Loading: {loading ? "ON" : "OFF"}
          </button>
          <Flex align="center" gap={2}>
            <Spinner loading={loading} />
            <Typography variant="p">
              {loading ? "Loading data..." : "Data loaded!"}
            </Typography>
          </Flex>
        </Flex>
      );
    };
    return <LoadingDemo />;
  },
};

export const InsideButton: Story = {
  render: () => {
    const ButtonDemo = () => {
      const [loading, setLoading] = React.useState(false);
      const handleClick = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
      };
      return (
        <Button onClick={handleClick} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {loading && <Spinner size="sm" />}
          {loading ? "Processing..." : "Click here"}
        </Button>
      );
    };
    return <ButtonDemo />;
  },
};

export const BookmarkAction: Story = {
  render: () => {
    const BookmarkDemo = () => {
      const [loading, setLoading] = React.useState(false);
      const [isBookmarked, setIsBookmarked] = React.useState(false);
      
      const handleBookmark = () => {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setIsBookmarked(!isBookmarked);
        }, 1500);
      };
      
      return (
        <Flex align="center" gap={2}>
          <button
            onClick={handleBookmark}
            disabled={loading}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-2)",
              borderRadius: "50%",
              color: isBookmarked ? "var(--color-primary)" : "var(--color-muted-foreground)",
              transition: "background var(--transition-fast) ease",
            }}
          >
            {loading ? (
              <Spinner size="sm" />
            ) : isBookmarked ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5zm2-2.55l5-2.5 5 2.5V5H7z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            )}
          </button>
          <Typography variant="small" color="muted">
            {loading ? "Saving..." : isBookmarked ? "Saved to bookmarks" : "Save to bookmarks"}
          </Typography>
        </Flex>
      );
    };
    return <BookmarkDemo />;
  },
};
