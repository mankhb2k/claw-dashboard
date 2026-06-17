"use client";

import React from "react";
import Link from "next/link";
import { Flex } from "@/components/layout";
import { Typography, Button, Card, Switch, Spinner } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { CronJob } from "@/schemas/cron.schema";
import {
  cronJobMessage,
  formatCronSchedule,
  formatNextRun,
  isCronJobFailed,
  lastRunStatus,
} from "@/utils/agent/cron-format";
import { DASHBOARD_BASE_PATH } from "@/lib/routing/dashboard-route";
import { CalendarClock, Play, Trash2 } from "lucide-react";
import styles from "./CardSchedulesJobs.module.css";

function agentSchedulesHref(slug: string): string {
  return `${DASHBOARD_BASE_PATH}/agent/${encodeURIComponent(slug)}?tab=schedules`;
}

type CardSchedulesJobsProps = {
  jobs: CronJob[];
  filteredJobs: CronJob[];
  agentNameBySlug: Map<string, string>;
  loading: boolean;
  error: string | null;
  busyJobId: string | null;
  onRunNow: (jobId: string) => void;
  onToggleEnabled: (job: CronJob) => void;
  onRemove: (jobId: string) => void;
};

export function CardSchedulesJobs({
  jobs,
  filteredJobs,
  agentNameBySlug,
  loading,
  error,
  busyJobId,
  onRunNow,
  onToggleEnabled,
  onRemove,
}: CardSchedulesJobsProps) {
  const { t } = useI18n();

  return (
    <Card className={styles.card} disableHover>
      {error ? (
        <div className={styles.gatewayHint} role="alert">
          <Typography variant="small">{error}</Typography>
          {error.includes("not available") || error.includes("GATEWAY") ? (
            <Typography variant="small" color="muted">
              {t("agent.schedules.jobs.gatewayHint")}
            </Typography>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <Flex justify="center" className={styles.loadingBox}>
          <Spinner size="md" />
        </Flex>
      ) : filteredJobs.length === 0 ? (
        <div className={styles.emptyBox}>
          <CalendarClock size={28} aria-hidden />
          <Typography variant="small" color="muted">
            {jobs.length === 0
              ? t("agent.schedules.jobs.empty")
              : t("agent.schedules.jobs.noMatch")}
          </Typography>
        </div>
      ) : (
        <div className={styles.jobList}>
          {filteredJobs.map((job) => {
            const status = lastRunStatus(job);
            const slug = job.agentId?.trim();
            const agentName = slug
              ? (agentNameBySlug.get(slug) ?? slug)
              : t("agent.schedules.jobs.unassigned");

            return (
              <div key={job.id} className={styles.jobRow}>
                <div className={styles.jobMain}>
                  <Typography variant="p" weight="medium">
                    {job.name}
                  </Typography>
                  {slug ? (
                    <Link href={agentSchedulesHref(slug)} className={styles.agentLink}>
                      {agentName}
                    </Link>
                  ) : (
                    <Typography variant="small" color="muted">
                      {agentName}
                    </Typography>
                  )}
                  <Typography variant="small" className={styles.messagePreview}>
                    {cronJobMessage(job)}
                  </Typography>
                  <div className={styles.jobMeta}>
                    <span className={styles.scheduleBadge}>
                      {formatCronSchedule(job)}
                    </span>
                    <Typography variant="small" color="muted">
                      {t("agent.schedules.jobs.next", {
                        time: formatNextRun(job),
                      })}
                    </Typography>
                    {status === "ok" ? (
                      <span className={styles.statusOk}>
                        {t("agent.schedules.jobs.lastOk")}
                      </span>
                    ) : null}
                    {isCronJobFailed(job) ? (
                      <span className={styles.statusError}>
                        {t("agent.schedules.jobs.lastFailed")}
                      </span>
                    ) : null}
                  </div>
                  {job.state?.lastError ? (
                    <Typography variant="small" className={styles.errorDetail}>
                      {job.state.lastError}
                    </Typography>
                  ) : null}
                </div>
                <div className={styles.jobActions}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    iconOnly
                    disabled={busyJobId === job.id}
                    onClick={() => onRunNow(job.id)}
                    aria-label={t("agent.schedules.jobs.runNowAria", { name: job.name })}
                  >
                    <Play size={14} />
                  </Button>
                  <Switch
                    checked={job.enabled}
                    disabled={busyJobId === job.id}
                    onCheckedChange={() => onToggleEnabled(job)}
                    aria-label={t("agent.schedules.jobs.enableAria", { name: job.name })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    iconOnly
                    disabled={busyJobId === job.id}
                    onClick={() => onRemove(job.id)}
                    aria-label={t("agent.schedules.jobs.deleteAria", { name: job.name })}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
