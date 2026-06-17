"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Flex } from "@/components/layout";
import { Spinner } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type { ProjectAgentListRow } from "@/schemas/project.schema";
import type { CronJob } from "@/schemas/cron.schema";
import { cronJobMessage, formatCronSchedule } from "@/utils/agent/cron-format";
import { CardSchedulesOverview } from "../CardSchedulesOverview/CardSchedulesOverview";
import { CardSchedulesFilters } from "../CardSchedulesFilters/CardSchedulesFilters";
import { CardSchedulesJobs } from "../CardSchedulesJobs/CardSchedulesJobs";
import { useI18n } from "@/lib/i18n";
import styles from "./ClientProjectSchedulesPage.module.css";

const ALL_AGENTS = "__all__";

export function ClientProjectSchedulesPage() {
  const { t } = useI18n();
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
      { value: ALL_AGENTS, label: t("agent.schedules.filters.allAgents") },
      ...agents.map((agent) => ({ value: agent.slug, label: agent.name })),
    ],
    [agents, t],
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
      setError(err instanceof Error ? err.message : t("agent.schedules.errors.load"));
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
      await projectApi.updateCronJob(projectId, job.id, {
        enabled: !job.enabled,
      });
      await load();
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
      await load();
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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("agent.schedules.errors.delete"));
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
      <CardSchedulesOverview quotaTotal={quotaTotal} quotaLimit={quotaLimit} />

      <CardSchedulesFilters
        search={search}
        agentFilter={agentFilter}
        agentFilterOptions={agentFilterOptions}
        onSearchChange={setSearch}
        onAgentFilterChange={setAgentFilter}
      />

      <CardSchedulesJobs
        jobs={jobs}
        filteredJobs={filteredJobs}
        agentNameBySlug={agentNameBySlug}
        loading={loading}
        error={error}
        busyJobId={busyJobId}
        onRunNow={(jobId) => void runNow(jobId)}
        onToggleEnabled={(job) => void toggleEnabled(job)}
        onRemove={(jobId) => void removeJob(jobId)}
      />
    </Flex>
  );
}
