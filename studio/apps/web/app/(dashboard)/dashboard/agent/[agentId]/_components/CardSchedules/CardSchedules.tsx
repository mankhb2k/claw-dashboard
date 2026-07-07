"use client";

import { CalendarClock, Play, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import styles from "./CardSchedules.module.css";
import { SearchItem } from "@/components/dashboard";
import { Flex } from "@/components/layout";
import {
  Typography,
  Button,
  Card,
  Input,
  Select,
  Switch,
  Spinner,
} from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";
import { dashboardPath } from "@/lib/routing/dashboard-route";
import { useProjectStore } from "@/stores/project.store";
import {
  cronJobMessage,
  formatCronSchedule,
  formatNextRun,
  lastRunStatus,
} from "@/utils/agent/cron-format";

import type { CronJob } from "@/schemas/cron.schema";

interface CardSchedulesProps {
  agentId: string;
  isEditing: boolean;
}

type ScheduleKind = "cron" | "every" | "at";

const SCHEDULE_OPTION_KEYS = [
  { value: "cron", labelKey: "agent.schedules.tab.typeCron" },
  { value: "every", labelKey: "agent.schedules.tab.typeInterval" },
  { value: "at", labelKey: "agent.schedules.tab.typeOnce" },
] as const;

export function CardSchedules({ agentId, isEditing }: CardSchedulesProps) {
  const { t } = useI18n();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");

  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [quotaLimit, setQuotaLimit] = useState(20);
  const [quotaTotal, setQuotaTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [scheduleKind, setScheduleKind] = useState<ScheduleKind>("cron");
  const [cronExpr, setCronExpr] = useState("0 9 * * *");
  const [everyMinutes, setEveryMinutes] = useState("60");
  const [at, setAt] = useState("");

  const loadKey = projectId && isEditing ? `${projectId}:${agentId}` : "";
  const [trackedLoadKey, setTrackedLoadKey] = useState(loadKey);

  if (loadKey !== trackedLoadKey) {
    setTrackedLoadKey(loadKey);
    setLoading(Boolean(loadKey));
    if (!loadKey) {
      setJobs([]);
      setError(null);
    }
  }

  const scheduleOptions = useMemo(
    () =>
      SCHEDULE_OPTION_KEYS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );

  const loadJobs = useCallback(async () => {
    if (!projectId || !isEditing) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [summary, list] = await Promise.all([
        projectApi.getCronSummary(projectId),
        projectApi.listCronJobs(projectId, agentId),
      ]);
      setQuotaLimit(summary.limit);
      setQuotaTotal(summary.total);
      setJobs(list.jobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("agent.schedules.errors.load"));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, agentId, isEditing, t]);

  useEffect(() => {
    if (!projectId || !isEditing) {
      return;
    }
    void Promise.all([
      projectApi.getCronSummary(projectId),
      projectApi.listCronJobs(projectId, agentId),
    ])
      .then(([summary, list]) => {
        setQuotaLimit(summary.limit);
        setQuotaTotal(summary.total);
        setJobs(list.jobs);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t("agent.schedules.errors.load"));
        setJobs([]);
      })
      .finally(() => setLoading(false));
  }, [projectId, agentId, isEditing, t]);

  const filteredJobs = jobs.filter((job) => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return true;
    }
    const haystack = `${job.name} ${cronJobMessage(job)} ${formatCronSchedule(job)}`.toLowerCase();
    return haystack.includes(q);
  });

  const resetForm = () => {
    setName("");
    setMessage("");
    setScheduleKind("cron");
    setCronExpr("0 9 * * *");
    setEveryMinutes("60");
    setAt("");
  };

  const handleCreate = async () => {
    if (!projectId) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await projectApi.createCronJob(projectId, {
        name,
        agentId,
        message,
        scheduleKind,
        cronExpr: scheduleKind === "cron" ? cronExpr : undefined,
        everyMinutes:
          scheduleKind === "every" ? Number.parseInt(everyMinutes, 10) || 60 : undefined,
        at: scheduleKind === "at" ? at : undefined,
        enabled: true,
      });
      resetForm();
      setShowForm(false);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("agent.schedules.errors.create"));
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (job: CronJob) => {
    if (!projectId) {
      return;
    }
    setBusyJobId(job.id);
    try {
      await projectApi.updateCronJob(projectId, job.id, { enabled: !job.enabled });
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("agent.schedules.errors.update"));
    } finally {
      setBusyJobId(null);
    }
  };

  const runNow = async (jobId: string) => {
    if (!projectId) {
      return;
    }
    setBusyJobId(jobId);
    try {
      await projectApi.runCronJob(projectId, jobId);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("agent.schedules.errors.run"));
    } finally {
      setBusyJobId(null);
    }
  };

  const removeJob = async (jobId: string) => {
    if (!projectId) {
      return;
    }
    setBusyJobId(jobId);
    try {
      await projectApi.deleteCronJob(projectId, jobId);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("agent.schedules.errors.delete"));
    } finally {
      setBusyJobId(null);
    }
  };

  if (!isEditing) {
    return (
      <Card className={styles.card} disableHover>
        <Typography variant="p" weight="bold">
          {t("agent.editPanel.tabs.schedules")}
        </Typography>
        <Typography variant="small" color="muted">
          {t("agent.schedules.tab.saveFirst")}
        </Typography>
      </Card>
    );
  }

  const atQuota = quotaTotal >= quotaLimit;

  return (
    <div className={styles.stack}>
      <Card className={styles.card} disableHover>
        <Flex justify="between" align="start" gap={4} className={styles.headerRow}>
          <div className={styles.header}>
            <Typography variant="p" weight="bold">
              {t("agent.editPanel.tabs.schedules")}
            </Typography>
            <Typography variant="small" color="muted">
              {t("agent.schedules.tab.description")}
            </Typography>
            <Typography variant="small" className={styles.quota}>
              {t("agent.schedules.tab.jobsUsed", {
                total: String(quotaTotal),
                limit: String(quotaLimit),
              })}
            </Typography>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={atQuota}
            onClick={() => setShowForm((open) => !open)}
          >
            <Plus size={14} aria-hidden />
            {t("agent.schedules.tab.add")}
          </Button>
        </Flex>

        <SearchItem
          id="agent-schedule-search"
          value={search}
          onChange={setSearch}
          placeholder={t("agent.schedules.tab.searchPlaceholder")}
          maxWidth="100%"
        />

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

        {showForm ? (
          <div className={styles.formGrid}>
            <div className={styles.formFull}>
              <Input
                id="schedule-name"
                label={t("agent.schedules.tab.name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("agent.schedules.tab.namePlaceholder")}
              />
            </div>
            <div className={styles.formFull}>
              <Input
                id="schedule-message"
                label={t("agent.schedules.tab.prompt")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("agent.schedules.tab.promptPlaceholder")}
              />
            </div>
            <Select
              id="schedule-kind"
              label="Schedule type"
              options={scheduleOptions}
              value={scheduleKind}
              onValueChange={(value) => setScheduleKind(value as ScheduleKind)}
            />
            {scheduleKind === "cron" ? (
              <div className={styles.formFull}>
                <Input
                  id="schedule-cron-expr"
                  label={t("agent.schedules.tab.cronExpression")}
                  value={cronExpr}
                  onChange={(e) => setCronExpr(e.target.value)}
                  placeholder="0 9 * * *"
                />
              </div>
            ) : null}
            {scheduleKind === "every" ? (
              <Input
                id="schedule-every"
                label={t("agent.schedules.tab.everyMinutes")}
                type="number"
                min={1}
                value={everyMinutes}
                onChange={(e) => setEveryMinutes(e.target.value)}
              />
            ) : null}
            {scheduleKind === "at" ? (
              <Input
                id="schedule-at"
                label={t("agent.schedules.tab.runAt")}
                value={at}
                onChange={(e) => setAt(e.target.value)}
                placeholder={t("agent.schedules.tab.runAtPlaceholder")}
              />
            ) : null}
            <div className={styles.formFull}>
              <Flex align="center" gap={3} className={styles.createRow}>
                <Button
                  type="button"
                  size="sm"
                  loading={saving}
                  disabled={!name.trim() || !message.trim() || atQuota}
                  onClick={() => void handleCreate()}
                >
                  {t("agent.schedules.tab.create")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  {t("agent.schedules.tab.cancel")}
                </Button>
              </Flex>
            </div>
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
                ? t("agent.schedules.tab.empty")
                : t("agent.schedules.tab.noMatch")}
            </Typography>
          </div>
        ) : (
          <div className={styles.jobList}>
            {filteredJobs.map((job) => {
              const status = lastRunStatus(job);
              return (
                <div key={job.id} className={styles.jobRow}>
                  <div className={styles.jobMain}>
                    <Typography variant="p" weight="medium">
                      {job.name}
                    </Typography>
                    <Typography variant="small" className={styles.messagePreview}>
                      {cronJobMessage(job)}
                    </Typography>
                    <div className={styles.jobMeta}>
                      <span className={styles.scheduleBadge}>{formatCronSchedule(job)}</span>
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
                      {status === "error" ? (
                        <span className={styles.statusError}>
                          {t("agent.schedules.jobs.lastFailed")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.jobActions}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      disabled={busyJobId === job.id}
                      onClick={() => void runNow(job.id)}
                      aria-label={t("agent.schedules.jobs.runNowAria", { name: job.name })}
                    >
                      <Play size={14} />
                    </Button>
                    <Switch
                      checked={job.enabled}
                      disabled={busyJobId === job.id}
                      onCheckedChange={() => void toggleEnabled(job)}
                      aria-label={t("agent.schedules.jobs.enableAria", { name: job.name })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      disabled={busyJobId === job.id}
                      onClick={() => void removeJob(job.id)}
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

      <Typography variant="small" color="muted">
        {t("agent.schedules.tab.footerPrefix")}{" "}
        <Link href={dashboardPath("agent", "schedules")}>
          {t("agent.schedules.tab.projectSchedules")}
        </Link>{" "}
        {t("agent.schedules.tab.footerSuffix")}
      </Typography>
    </div>
  );
}
