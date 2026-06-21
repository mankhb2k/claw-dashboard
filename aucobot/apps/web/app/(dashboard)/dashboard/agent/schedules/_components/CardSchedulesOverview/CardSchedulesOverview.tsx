"use client";

import Link from "next/link";

import styles from "./CardSchedulesOverview.module.css";
import { Flex } from "@/components/layout";
import { Typography, Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { dashboardPath } from "@/lib/routing/dashboard-route";

type CardSchedulesOverviewProps = {
  quotaTotal: number;
  quotaLimit: number;
};

export function CardSchedulesOverview({
  quotaTotal,
  quotaLimit,
}: CardSchedulesOverviewProps) {
  const { t } = useI18n();

  return (
    <Card className={styles.card} disableHover>
      <Flex justify="between" align="start" gap={4} className={styles.headerRow}>
        <div className={styles.header}>
          <Typography variant="h2" weight="bold">
            {t("agent.schedules.overview.title")}
          </Typography>
          <Typography variant="small" color="muted">
            {t("agent.schedules.overview.description")}
          </Typography>
          <Typography variant="small" className={styles.quota}>
            {t("agent.schedules.overview.jobsUsed", {
              total: String(quotaTotal),
              limit: String(quotaLimit),
            })}
          </Typography>
        </div>
        <Link href={dashboardPath("agent")} className={styles.agentLink}>
          {t("agent.schedules.overview.manageAgents")}
        </Link>
      </Flex>
    </Card>
  );
}
