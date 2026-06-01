"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Flex } from "@/components/layout";
import { Typography, Card, Spinner } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type { CronSummary } from "@/schemas/cron.schema";
import { dashboardPath } from "@/lib/dashboard-route";
import styles from "./OverviewSchedulesCard.module.css";

export function OverviewSchedulesCard() {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const [summary, setSummary] = useState<CronSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    setLoading(true);
    void projectApi
      .getCronSummary(projectId)
      .then(setSummary)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Cannot load schedules");
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const failedCount = summary?.failedCount ?? 0;
  const schedulesHref = dashboardPath("agent", "schedules");

  return (
    <Card className={styles.card} disableHover>
      <Flex justify="between" align="start" gap={4}>
        <div>
          <Typography variant="p" weight="bold">
            Scheduled tasks
          </Typography>
          <Typography variant="small" color="muted">
            Cron jobs across all agents in this project (gateway).
          </Typography>
        </div>
        <Link href={schedulesHref} className={styles.link}>
          View all
        </Link>
      </Flex>

      {loading ? (
        <Flex justify="center" className={styles.loading}>
          <Spinner size="sm" />
        </Flex>
      ) : error ? (
        <Typography variant="small" color="muted">
          {error}
        </Typography>
      ) : summary ? (
        <>
          <Flex align="baseline" gap={4} className={styles.stats}>
            <Typography variant="h3" weight="bold">
              {summary.total}
            </Typography>
            <Typography variant="small" color="muted">
              / {summary.limit} jobs used · {summary.remaining} remaining
            </Typography>
          </Flex>
          {failedCount > 0 ? (
            <div className={styles.alertRow}>
              <Typography variant="small" className={styles.alertText}>
                {failedCount} job{failedCount === 1 ? "" : "s"} with a failed last run
              </Typography>
              <Link href={schedulesHref} className={styles.link}>
                Review →
              </Link>
            </div>
          ) : null}
          {summary.recentFailures && summary.recentFailures.length > 0 ? (
            <ul className={styles.failureList}>
              {summary.recentFailures.map((job) => (
                <li key={job.id}>
                  <Typography variant="small">{job.name}</Typography>
                  {job.agentId ? (
                    <Typography variant="small" color="muted">
                      {" "}
                      · {job.agentId}
                    </Typography>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      <Flex gap={4} wrap="wrap" className={styles.footerLinks}>
        <Link href={schedulesHref} className={styles.link}>
          Project schedules →
        </Link>
        <Link href={dashboardPath("agent")} className={styles.link}>
          Manage agents →
        </Link>
      </Flex>
    </Card>
  );
}
