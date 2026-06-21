
import styles from "./SetupSectionHeader.module.css";
import { Box, Flex } from "@/components/layout";
import { Typography } from "@/components/ui";

import type { ReactNode } from "react";

interface SetupSectionHeaderProps {
  badge: string;
  title: string;
  description: ReactNode;
}

export function SetupSectionHeader({ badge, title, description }: SetupSectionHeaderProps) {
  return (
    <Flex direction="column" gap={16}>
      <Box
        color="primary-dim"
        px={12}
        py={4}
        radius="full"
        className={styles.badge}
      >
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
