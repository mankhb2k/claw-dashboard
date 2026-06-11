"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { dashboardPath } from "@/lib/routing/dashboard-route";
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
import { SearchItem } from "@/components/dashboard";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import {
  cronJobMessage,
  formatCronSchedule,
  formatNextRun,
  lastRunStatus,
} from "@/utils/agent/cron-format";
import type { CronJob } from "@/schemas/cron.schema";
import { CalendarClock, Play, Trash2, Plus } from "lucide-react";
import styles from "./CardSchedules.module.css";

interface CardSchedulesProps {
  agentId: string;
  isEditing: boolean;
}

type ScheduleKind = "cron" | "every" | "at";

const SCHEDULE_OPTIONS = [
  { value: "cron", label: "Cron expression" },
  { value: "every", label: "Interval" },
  { value: "at", label: "One-shot" },
];

export function CardSchedules({ agentId, isEditing }: CardSchedulesProps) {
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
      setError(err instanceof Error ? err.message : "Cannot load schedules");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, agentId, isEditing]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

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
      setError(err instanceof Error ? err.message : "Cannot create schedule");
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
      setError(err instanceof Error ? err.message : "Cannot update schedule");
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
      setError(err instanceof Error ? err.message : "Cannot run schedule");
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
      setError(err instanceof Error ? err.message : "Cannot delete schedule");
    } finally {
      setBusyJobId(null);
    }
  };

  if (!isEditing) {
    return (
      <Card className={styles.card} disableHover>
        <Typography variant="p" weight="bold">
          Schedules
        </Typography>
        <Typography variant="small" color="muted">
          Save the agent first, then add scheduled tasks for this bot.
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
              Schedules
            </Typography>
            <Typography variant="small" color="muted">
              Run this agent on a schedule (gateway cron). Permissions for tools and
              channels are configured in Connect and Channel tabs.
            </Typography>
            <Typography variant="small" className={styles.quota}>
              {quotaTotal} / {quotaLimit} jobs in project
            </Typography>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={atQuota}
            onClick={() => setShowForm((open) => !open)}
          >
            <Plus size={14} aria-hidden />
            Add schedule
          </Button>
        </Flex>

        <SearchItem
          id="agent-schedule-search"
          value={search}
          onChange={setSearch}
          placeholder="Search schedules..."
          maxWidth="100%"
        />

        {error ? (
          <div className={styles.gatewayHint} role="alert">
            <Typography variant="small">{error}</Typography>
            {error.includes("not available") || error.includes("GATEWAY") ? (
              <Typography variant="small" color="muted">
                Start the project gateway, then try again.
              </Typography>
            ) : null}
          </div>
        ) : null}

        {showForm ? (
          <div className={styles.formGrid}>
            <div className={styles.formFull}>
              <Input
                id="schedule-name"
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Daily report"
              />
            </div>
            <div className={styles.formFull}>
              <Input
                id="schedule-message"
                label="Agent prompt"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Summarize inbox and post to Slack"
              />
            </div>
            <Select
              id="schedule-kind"
              label="Schedule type"
              options={SCHEDULE_OPTIONS}
              value={scheduleKind}
              onValueChange={(value) => setScheduleKind(value as ScheduleKind)}
            />
            {scheduleKind === "cron" ? (
              <div className={styles.formFull}>
                <Input
                  id="schedule-cron-expr"
                  label="Cron expression"
                  value={cronExpr}
                  onChange={(e) => setCronExpr(e.target.value)}
                  placeholder="0 9 * * *"
                />
              </div>
            ) : null}
            {scheduleKind === "every" ? (
              <Input
                id="schedule-every"
                label="Every (minutes)"
                type="number"
                min={1}
                value={everyMinutes}
                onChange={(e) => setEveryMinutes(e.target.value)}
              />
            ) : null}
            {scheduleKind === "at" ? (
              <Input
                id="schedule-at"
                label="Run at (ISO datetime)"
                value={at}
                onChange={(e) => setAt(e.target.value)}
                placeholder="2026-06-01T09:00:00"
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
                  Create schedule
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
                  Cancel
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
                ? "No schedules for this agent yet."
                : "No schedules match your search."}
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
                        Next: {formatNextRun(job)}
                      </Typography>
                      {status === "ok" ? (
                        <span className={styles.statusOk}>Last run OK</span>
                      ) : null}
                      {status === "error" ? (
                        <span className={styles.statusError}>Last run failed</span>
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
                      aria-label={`Run ${job.name} now`}
                    >
                      <Play size={14} />
                    </Button>
                    <Switch
                      checked={job.enabled}
                      disabled={busyJobId === job.id}
                      onCheckedChange={() => void toggleEnabled(job)}
                      aria-label={`Enable ${job.name}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      disabled={busyJobId === job.id}
                      onClick={() => void removeJob(job.id)}
                      aria-label={`Delete ${job.name}`}
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
        <Link href={dashboardPath("agent", "schedules")}>Project schedules</Link> lists all
        jobs across agents; <Link href="/dashboard">Overview</Link> shows quota and failures.
      </Typography>
    </div>
  );
}
