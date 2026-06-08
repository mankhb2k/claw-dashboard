"use client";

import React, { useMemo } from "react";
import { Typography, Card } from "@/components/ui";
import type { ProjectAgentListRow } from "@/schemas/project.schema";
import styles from "./CardCollaborationAllowList.module.css";

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
        Gateway allow list (preview)
      </Typography>
      <Typography variant="small" color="muted" className={styles.previewHint}>
        {enabled
          ? "After save, these agents (plus main) can use agent-to-agent tools."
          : "Collaboration is off — allow list will be empty."}
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
