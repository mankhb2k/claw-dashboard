"use client";

import styles from "./CardCollaborationSettings.module.css";
import { Typography, Switch, Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

type CardCollaborationSettingsProps = {
  enabled: boolean;
  onEnabledChange: (checked: boolean) => void;
};

export function CardCollaborationSettings({
  enabled,
  onEnabledChange,
}: CardCollaborationSettingsProps) {
  const { t } = useI18n();

  return (
    <Card className={styles.card} disableHover>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <Typography variant="p" weight="bold">
            {t("agent.collaboration.settings.title")}
          </Typography>
          <Typography variant="small" color="muted">
            {t("agent.collaboration.settings.description")}
          </Typography>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>
    </Card>
  );
}
