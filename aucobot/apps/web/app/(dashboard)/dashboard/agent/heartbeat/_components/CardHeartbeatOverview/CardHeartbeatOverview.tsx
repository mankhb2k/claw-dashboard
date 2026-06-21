"use client";

import { Activity, Info } from "lucide-react";

import styles from "./CardHeartbeatOverview.module.css";
import { Flex } from "@/components/layout";
import { Typography, Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export function CardHeartbeatOverview() {
  const { t } = useI18n();

  return (
    <Card className={styles.card}>
      <Flex align="center" gap={8} className={styles.headerRow}>
        <Activity size={18} />
        <div>
          <Typography variant="p" weight="medium">
            {t("agent.heartbeat.overview.title")}
          </Typography>
          <Typography variant="small" color="muted">
            {t("agent.heartbeat.overview.description")}
          </Typography>
        </div>
      </Flex>

      <div className={styles.callout}>
        <Info size={16} />
        <Typography variant="small" color="muted">
          {t("agent.heartbeat.overview.hint")}
        </Typography>
      </div>
    </Card>
  );
}
