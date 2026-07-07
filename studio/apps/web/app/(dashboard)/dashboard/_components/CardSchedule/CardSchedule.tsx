"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./CardSchedule.module.css";
import { Box, Flex } from "@/components/layout";
import { Button, Card, Spinner, Typography } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";
import { dashboardPath } from "@/lib/routing/dashboard-route";
import { useProjectStore } from "@/stores/project.store";

import type { CronSummary } from "@/schemas/cron.schema";

export function CardSchedule() {
  const { t } = useI18n();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const [summary, setSummary] = useState<CronSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedProjectId, setTrackedProjectId] = useState(projectId);

  if (projectId !== trackedProjectId) {
    setTrackedProjectId(projectId);
    setLoading(Boolean(projectId));
    setSummary(null);
    setError(null);
  }

  useEffect(() => {
    if (!projectId) {
      return;
    }
    void projectApi
      .getCronSummary(projectId)
      .then(setSummary)
      .catch((err) => {
        setError(err instanceof Error ? err.message : t("agent.schedules.errors.load"));
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, [projectId, t]);

  const failedCount = summary?.failedCount ?? 0;
  const schedulesHref = dashboardPath("agent", "schedules");

  return (
    <Card hover="md">
      <Flex direction="column" gap={16}>
        <Flex justify="between" align="start" gap={4}>
          <Flex direction="column" gap={4}>
            <Typography variant="p" weight="bold">
              {t("dashboard.schedule.title")}
            </Typography>
            <Typography variant="small" color="muted">
              {t("dashboard.schedule.subtitle")}
            </Typography>
          </Flex>
          <Button variant="link" size="sm" asChild>
            <Link href={schedulesHref}>{t("dashboard.schedule.viewAll")}</Link>
          </Button>
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
                {t("dashboard.schedule.jobsUsed", {
                  limit: String(summary.limit),
                  remaining: String(summary.remaining),
                })}
              </Typography>
            </Flex>

            {failedCount > 0 ? (
              <Box
                border
                radius="md"
                color="danger-dim"
                className={styles.alertRow}
              >
                <Flex
                  justify="between"
                  align="center"
                  gap={8}
                  wrap="wrap"
                >
                  <Typography variant="small" className={styles.alertText}>
                    {t("dashboard.schedule.failedJobs", {
                      count: String(failedCount),
                      suffix: failedCount === 1 ? "" : "s",
                    })}
                  </Typography>
                  <Button variant="link" size="sm" asChild>
                    <Link href={schedulesHref}>{t("dashboard.schedule.review")}</Link>
                  </Button>
                </Flex>
              </Box>
            ) : null}

            {summary.recentFailures && summary.recentFailures.length > 0 ? (
              <Flex
                as="ul"
                direction="column"
                gap={4}
                className={styles.failureList}
              >
                {summary.recentFailures.map((job) => (
                  <Flex as="li" key={job.id} align="center" gap={4}>
                    <Typography variant="small">{job.name}</Typography>
                    {job.agentId ? (
                      <Typography variant="small" color="muted">
                        · {job.agentId}
                      </Typography>
                    ) : null}
                  </Flex>
                ))}
              </Flex>
            ) : null}
          </>
        ) : null}

        <Flex gap={16} wrap="wrap" className={styles.footerLinks}>
          <Button variant="link" size="sm" asChild>
            <Link href={schedulesHref}>{t("dashboard.schedule.projectSchedules")}</Link>
          </Button>
          <Button variant="link" size="sm" asChild>
            <Link href={dashboardPath("agent")}>{t("dashboard.schedule.manageAgents")}</Link>
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
