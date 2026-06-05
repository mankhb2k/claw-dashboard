"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Flex } from "@/components/layout";
import {
  Typography,
  Button,
  Card,
  Select,
  Switch,
  Spinner,
} from "@/components/ui";
import { SearchItem } from "@/components/dashboard";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type { ProjectAgentListRow } from "@/schemas/project.schema";
import type { CronJob } from "@/schemas/cron.schema";
import {
  cronJobMessage,
  formatCronSchedule,
  formatNextRun,
  isCronJobFailed,
  lastRunStatus,
} from "@/lib/cron-format";
import { DASHBOARD_BASE_PATH, dashboardPath } from "@/lib/dashboard-route";
import { CalendarClock, Play, Trash2 } from "lucide-react";
import styles from "./ClientProjectSchedulesPage.module.css";

const ALL_AGENTS = "__all__";

function agentSchedulesHref(slug: string): string {
  return `${DASHBOARD_BASE_PATH}/agent/${encodeURIComponent(slug)}?tab=schedules`;
}

export default function ClientProjectSchedulesPage() {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const [agents, setAgents] = useState<ProjectAgentListRow[]>([]);
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [quotaLimit, setQuotaLimit] = useState(20);
  const [quotaTotal, setQuotaTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState(ALL_AGENTS);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  useEffect(() => {
    void fetchProjects({ silent: true });
  }, [fetchProjects]);

  const agentNameBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of agents) {
      map.set(agent.slug, agent.name);
    }
    return map;
  }, [agents]);

  const agentFilterOptions = useMemo(
    () => [
      { value: ALL_AGENTS, label: "All agents" },
      ...agents.map((agent) => ({ value: agent.slug, label: agent.name })),
    ],
    [agents],
  );

  const load = useCallback(async () => {
    if (!projectId) {
      setAgents([]);
      setJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [summary, list, agentRows] = await Promise.all([
        projectApi.getCronSummary(projectId),
        projectApi.listCronJobs(projectId),
        projectApi.listAgents(projectId),
      ]);
      setQuotaLimit(summary.limit);
      setQuotaTotal(summary.total);
      setJobs(list.jobs);
      setAgents(agentRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load schedules");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (agentFilter !== ALL_AGENTS) {
        const slug = job.agentId?.trim() ?? "";
        if (slug !== agentFilter) {
          return false;
        }
      }
      const q = search.trim().toLowerCase();
      if (!q) {
        return true;
      }
      const agentLabel = job.agentId
        ? (agentNameBySlug.get(job.agentId) ?? job.agentId)
        : "";
      const haystack =
        `${job.name} ${cronJobMessage(job)} ${formatCronSchedule(job)} ${agentLabel}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [jobs, agentFilter, search, agentNameBySlug]);

  const toggleEnabled = async (job: CronJob) => {
    if (!projectId) {
      return;
    }
    setBusyJobId(job.id);
    try {
      await projectApi.updateCronJob(projectId, job.id, { enabled: !job.enabled });
      await load();
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
      await load();
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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot delete schedule");
    } finally {
      setBusyJobId(null);
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <Flex align="center" justify="center" className={styles.loading}>
        <Spinner />
      </Flex>
    );
  }

  return (
    <Flex direction="column" className={styles.root}>
      <Card className={styles.card} disableHover>
        <Flex justify="between" align="start" gap={4} className={styles.headerRow}>
          <div className={styles.header}>
            <Typography variant="h2" weight="bold">
              Project schedules
            </Typography>
            <Typography variant="small" color="muted">
              All cron jobs in this project. Create or edit schedules per agent from
              each agent&apos;s Schedules tab.
            </Typography>
            <Typography variant="small" className={styles.quota}>
              {quotaTotal} / {quotaLimit} jobs used
            </Typography>
          </div>
          <Link href={dashboardPath("agent")} className={styles.agentLink}>
            Manage agents
          </Link>
        </Flex>

        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <SearchItem
              id="project-schedule-search"
              value={search}
              onChange={setSearch}
              placeholder="Search schedules..."
              maxWidth="100%"
            />
          </div>
          <div className={styles.agentFilter}>
            <Select
              id="project-schedule-agent-filter"
              label="Agent"
              options={agentFilterOptions}
              value={agentFilter}
              onValueChange={setAgentFilter}
            />
          </div>
        </div>

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

        {loading ? (
          <Flex justify="center" className={styles.loadingBox}>
            <Spinner size="md" />
          </Flex>
        ) : filteredJobs.length === 0 ? (
          <div className={styles.emptyBox}>
            <CalendarClock size={28} aria-hidden />
            <Typography variant="small" color="muted">
              {jobs.length === 0
                ? "No schedules in this project yet. Open an agent and use the Schedules tab to add one."
                : "No schedules match your filters."}
            </Typography>
          </div>
        ) : (
          <div className={styles.jobList}>
            {filteredJobs.map((job) => {
              const status = lastRunStatus(job);
              const slug = job.agentId?.trim();
              const agentName = slug
                ? (agentNameBySlug.get(slug) ?? slug)
                : "Unassigned";
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
                      <span className={styles.scheduleBadge}>{formatCronSchedule(job)}</span>
                      <Typography variant="small" color="muted">
                        Next: {formatNextRun(job)}
                      </Typography>
                      {status === "ok" ? (
                        <span className={styles.statusOk}>Last run OK</span>
                      ) : null}
                      {isCronJobFailed(job) ? (
                        <span className={styles.statusError}>Last run failed</span>
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
    </Flex>
  );
}
