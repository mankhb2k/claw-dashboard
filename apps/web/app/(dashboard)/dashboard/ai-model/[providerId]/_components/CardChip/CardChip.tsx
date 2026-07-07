"use client";

import styles from "./CardChip.module.css";
import { Card, Typography } from "@/components/ui";

import type { ModelDef } from "@/utils/ai-model/providers-data";

interface CardChipProps {
  model: ModelDef;
  openclawProviderId: string;
}

const TIER_LABEL: Record<NonNullable<ModelDef["tier"]>, string> = {
  stable: "Stable",
  preview: "Preview",
  deprecated: "Deprecated",
};

export function CardChip({ model, openclawProviderId }: CardChipProps) {
  const fullModel =
    model.openclawId ?? `${openclawProviderId}/${model.id}`;

  return (
    <Card
      className={`${styles.modelChip} ${model.tier === "deprecated" ? styles.modelChipDeprecated : ""}`}
      title={model.description}
    >
      <span className={`material-symbols-outlined ${styles.chipIcon}`}>
        smart_toy
      </span>

      <div className={styles.chipInfo}>
        <code className={styles.chipCode}>{fullModel}</code>
        {model.name && (
          <Typography
            variant="small"
            color="muted"
            as="span"
            className={styles.chipName}
          >
            {model.name}
          </Typography>
        )}
      </div>

      <div className={styles.badges}>
        {model.recommended && (
          <span className={styles.badgeRecommended}>Recommended</span>
        )}
        {model.isFree && <span className={styles.badgeFree}>FREE</span>}
        {model.tier && model.tier !== "stable" && (
          <span
            className={
              model.tier === "deprecated"
                ? styles.badgeDeprecated
                : styles.badgePreview
            }
          >
            {TIER_LABEL[model.tier]}
          </span>
        )}
      </div>
    </Card>
  );
}
