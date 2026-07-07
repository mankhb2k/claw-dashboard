"use client";

import styles from "./CardSkillStore.module.css";
import { Flex } from "@/components/layout";
import { Button, Card, Typography } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { formatCompactCount } from "@/utils/common/format-compact-count";

import type { SkillStoreItem } from "@/schemas/project.schema";

export interface CardSkillStoreProps {
  item: SkillStoreItem;
  installingSlug: string | null;
  onInstall: (slug: string, openAfterInstall?: boolean) => void;
  onOpenSkill: (slug: string) => void;
  spanFull?: boolean;
}

export function CardSkillStore({
  item,
  installingSlug,
  onInstall,
  onOpenSkill,
  spanFull,
}: CardSkillStoreProps) {
  const busy = installingSlug === item.slug;
  const hasStats = item.downloads != null || item.stars != null;
  const hasTags = item.tags.length > 0;
  const hasMeta = hasStats || hasTags;

  return (
    <Card
      hover="md"
      className={`${styles.card} ${spanFull ? styles.spanFull : ""}`}
    >
      <Flex align="start" gap="var(--space-3)" fullWidth className={styles.inner}>
        <Flex direction="column" gap="var(--space-2)" fullWidth className={styles.main}>
          <Typography variant="p" weight="bold" className={styles.title}>
            {item.heading}
          </Typography>
          <Typography variant="small" color="muted" className={styles.desc}>
            {item.description}
          </Typography>
          {hasMeta ? (
            <Flex wrap="wrap" align="center" gap="var(--space-2)" fullWidth className={styles.metaRow}>
              {hasStats ? (
                <Flex align="center" gap="var(--space-2)" className={styles.stats}>
                  {item.stars != null ? (
                    <Typography
                      variant="small"
                      color="muted"
                      className={styles.stat}
                      title={`${item.stars} stars`}
                    >
                      ★ {formatCompactCount(item.stars)}
                    </Typography>
                  ) : null}
                  {item.downloads != null ? (
                    <Typography
                      variant="small"
                      color="muted"
                      className={styles.stat}
                      title={`${item.downloads} downloads`}
                    >
                      ↓ {formatCompactCount(item.downloads)}
                    </Typography>
                  ) : null}
                </Flex>
              ) : null}
              {hasTags ? (
                <Flex wrap="wrap" align="center" gap="var(--space-1)" className={styles.tagRow}>
                  {item.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </Flex>
              ) : null}
            </Flex>
          ) : null}
        </Flex>
        {item.installed ? (
          <Button
            size="sm"
            variant="secondary"
            className={styles.action}
            onClick={() => onOpenSkill(item.slug)}
          >
            Open editor
          </Button>
        ) : (
          <Button
            size="sm"
            className={styles.action}
            disabled={busy}
            onClick={() => onInstall(item.slug, true)}
          >
            {busy ? "Installing..." : "Install"}
          </Button>
        )}
      </Flex>
    </Card>
  );
}

export function CardSkillStoreSkeleton({ pulse = true }: { pulse?: boolean }) {
  return (
    <Card disableHover className={styles.card} aria-hidden>
      <Flex align="start" gap="var(--space-3)" fullWidth className={styles.inner}>
        <Flex direction="column" gap="var(--space-2)" fullWidth className={styles.main}>
          <Skeleton variant="text" width="72%" height={16} pulse={pulse} />
          <Skeleton variant="textSm" width="100%" pulse={pulse} />
          <Flex wrap="wrap" align="center" gap="var(--space-2)" fullWidth className={styles.metaRow}>
            <Skeleton variant="textSm" width={56} pulse={pulse} />
            <Skeleton variant="textSm" width={72} pulse={pulse} />
          </Flex>
        </Flex>
        <Skeleton variant="block" width={72} height={32} pulse={pulse} />
      </Flex>
    </Card>
  );
}
