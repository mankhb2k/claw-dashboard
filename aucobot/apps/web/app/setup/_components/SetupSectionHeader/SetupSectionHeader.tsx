import type { ReactNode } from "react";
import { Box, Flex } from "@/components/layout";
import { Typography } from "@/components/ui";

interface SetupSectionHeaderProps {
  badge: string;
  title: string;
  description: ReactNode;
}

export function SetupSectionHeader({ badge, title, description }: SetupSectionHeaderProps) {
  return (
    <Flex direction="column" gap={16}>
      <Box color="primary-dim" px={12} py={4} radius="full" style={{ width: "fit-content" }}>
        <Typography variant="xs" color="primary" weight="medium">
          {badge}
        </Typography>
      </Box>
      <Typography variant="h2">{title}</Typography>
      <Typography variant="small" color="muted">
        {description}
      </Typography>
    </Flex>
  );
}
