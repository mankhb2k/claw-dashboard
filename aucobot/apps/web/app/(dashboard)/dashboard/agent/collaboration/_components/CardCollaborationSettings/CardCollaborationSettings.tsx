"use client";

import React from "react";
import { Typography, Switch, Card } from "@/components/ui";
import styles from "./CardCollaborationSettings.module.css";

type CardCollaborationSettingsProps = {
  enabled: boolean;
  onEnabledChange: (checked: boolean) => void;
};

export function CardCollaborationSettings({
  enabled,
  onEnabledChange,
}: CardCollaborationSettingsProps) {
  return (
    <Card className={styles.card} disableHover>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <Typography variant="p" weight="bold">
            Agent collaboration
          </Typography>
          <Typography variant="small" color="muted">
            Members can message and spawn each other. OpenClaw uses one shared
            allow list for the project (not one-way permissions).
          </Typography>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>
    </Card>
  );
}
