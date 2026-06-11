"use client";

import React from "react";
import Link from "next/link";
import { Flex } from "@/components/layout";
import { Typography, Card } from "@/components/ui";
import { dashboardPath } from "@/lib/routing/dashboard-route";
import styles from "./CardSchedulesOverview.module.css";

type CardSchedulesOverviewProps = {
  quotaTotal: number;
  quotaLimit: number;
};

export function CardSchedulesOverview({
  quotaTotal,
  quotaLimit,
}: CardSchedulesOverviewProps) {
  return (
    <Card className={styles.card} disableHover>
      <Flex justify="between" align="start" gap={4} className={styles.headerRow}>
        <div className={styles.header}>
          <Typography variant="h2" weight="bold">
            Project schedules
          </Typography>
          <Typography variant="small" color="muted">
            All cron jobs in this project. Create or edit schedules per agent
            from each agent&apos;s Schedules tab.
          </Typography>
          <Typography variant="small" className={styles.quota}>
            {quotaTotal} / {quotaLimit} jobs used
          </Typography>
        </div>
        <Link href={dashboardPath("agent")} className={styles.agentLink}>
          Manage agents
        </Link>
      </Flex>
    </Card>
  );
}
