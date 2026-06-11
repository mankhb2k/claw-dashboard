import * as React from "react";
import { Flex, Box } from "../../layout";
import { Typography } from "../../ui";
import styles from "./TitleHeader.module.css";

interface TitleHeaderProps {
  title: string;
  badge?: string;
  description?: string;
  actions?: React.ReactNode;
  showBorder?: boolean;
  sticky?: boolean;
  className?: string;
}

/**
 * Page title block with optional description and primary actions.
 * Used at the top of dashboard list pages.
 */
export function TitleHeader({
  title,
  badge,
  description,
  actions,
  showBorder = false,
  sticky = false,
  className = "",
}: TitleHeaderProps) {
  const rootClasses = [
    styles.root,
    sticky ? styles.sticky : "",
    showBorder ? styles.border : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClasses}>
      <Flex direction="column" gap={8} className={styles.content}>
        <Flex align="center" gap={8} className={styles.titleRow}>
          <Typography variant="h3" weight="bold">
            {title}
          </Typography>
          {badge ? <span className={styles.badge}>{badge}</span> : null}
        </Flex>
        {description && (
          <Typography variant="p" color="muted" className={styles.description}>
            {description}
          </Typography>
        )}
      </Flex>

      {actions && (
        <Flex align="center" gap={12} className={styles.actions}>
          {actions}
        </Flex>
      )}
    </div>
  );
}
