"use client";

import * as React from "react";

import styles from "./TitleHeader.module.css";
import { Flex } from "../../layout";
import { Typography } from "../../ui";
import { useI18n } from "@/lib/i18n";

type TitleHeaderBaseProps = {
  badge?: string;
  description?: string;
  descriptionKey?: string;
  actions?: React.ReactNode;
  showBorder?: boolean;
  sticky?: boolean;
  className?: string;
};

type TitleHeaderProps = TitleHeaderBaseProps &
  (
    | { title: string; titleKey?: never }
    | { titleKey: string; title?: never }
  );

/**
 * Page title block with optional description and primary actions.
 * Pass `title` / `description` for plain strings, or `titleKey` / `descriptionKey` for i18n.
 */
export function TitleHeader({
  title,
  titleKey,
  badge,
  description,
  descriptionKey,
  actions,
  showBorder = false,
  sticky = false,
  className = "",
}: TitleHeaderProps) {
  const { t } = useI18n();
  const resolvedTitle = titleKey ? t(titleKey) : title;
  const resolvedDescription = descriptionKey ? t(descriptionKey) : description;

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
            {resolvedTitle}
          </Typography>
          {badge ? <span className={styles.badge}>{badge}</span> : null}
        </Flex>
        {resolvedDescription ? (
          <Typography variant="p" color="muted" className={styles.description}>
            {resolvedDescription}
          </Typography>
        ) : null}
      </Flex>

      {actions ? (
        <Flex align="center" gap={12} className={styles.actions}>
          {actions}
        </Flex>
      ) : null}
    </div>
  );
}
