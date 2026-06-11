"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Flex } from "@/components/layout";
import { Button, Card, Spinner, Typography } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { dashboardPath } from "@/lib/routing/dashboard-route";
import type { CronSummary } from "@/schemas/cron.schema";
import { useProjectStore } from "@/stores/project.store";
import styles from "./ScheduleCard.module.css";

export function ScheduleCard() {
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
    <Card hover="md">
      <Flex direction="column" gap={16}>
        <Flex justify="between" align="start" gap={4}>
          <Flex direction="column" gap={4}>
            <Typography variant="p" weight="bold">
              Scheduled tasks
            </Typography>
            <Typography variant="small" color="muted">
              Cron jobs across all agents in this project (gateway).
            </Typography>
          </Flex>
          <Button variant="link" size="sm" asChild>
            <Link href={schedulesHref}>View all</Link>
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
                / {summary.limit} jobs used · {summary.remaining} remaining
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
                    {failedCount} job{failedCount === 1 ? "" : "s"} with a
                    failed last run
                  </Typography>
                  <Button variant="link" size="sm" asChild>
                    <Link href={schedulesHref}>Review →</Link>
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
            <Link href={schedulesHref}>Project schedules →</Link>
          </Button>
          <Button variant="link" size="sm" asChild>
            <Link href={dashboardPath("agent")}>Manage agents →</Link>
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
