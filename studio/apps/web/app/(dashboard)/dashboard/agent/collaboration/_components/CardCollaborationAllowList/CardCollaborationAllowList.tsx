"use client";

import { useMemo } from "react";

import styles from "./CardCollaborationAllowList.module.css";
import { Typography, Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

import type { ProjectAgentListRow } from "@/schemas/project.schema";

type CardCollaborationAllowListProps = {
  enabled: boolean;
  dirty: boolean;
  memberSlugs: string[];
  effectiveAllow: string[];
  agents: ProjectAgentListRow[];
};

export function CardCollaborationAllowList({
  enabled,
  dirty,
  memberSlugs,
  effectiveAllow,
  agents,
}: CardCollaborationAllowListProps) {
  const { t } = useI18n();

  const previewSlugs = useMemo(() => {
    if (!enabled) return [];

    if (dirty) {
      return [
        "main",
        ...memberSlugs.filter((slug) =>
          agents.some((a) => a.slug === slug && a.enabled),
        ),
      ].sort();
    }

    return effectiveAllow;
  }, [enabled, dirty, memberSlugs, effectiveAllow, agents]);

  return (
    <Card className={styles.card} disableHover>
      <Typography variant="small" weight="medium">
        {t("agent.collaboration.allowList.title")}
      </Typography>
      <Typography variant="small" color="muted" className={styles.previewHint}>
        {enabled
          ? t("agent.collaboration.allowList.on")
          : t("agent.collaboration.allowList.off")}
      </Typography>
      <div className={styles.chips}>
        {previewSlugs.length === 0 ? (
          <Typography variant="small" color="muted">
            —
          </Typography>
        ) : (
          previewSlugs.map((slug) => (
            <span key={slug} className={styles.chip}>
              {slug}
            </span>
          ))
        )}
      </div>
    </Card>
  );
}
