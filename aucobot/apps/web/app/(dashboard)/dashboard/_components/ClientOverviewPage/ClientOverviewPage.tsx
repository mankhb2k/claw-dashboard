"use client";

import { useEffect, useState } from "react";
import { Flex, Grid } from "@/components/layout";
import { Spinner, Typography } from "@/components/ui";
import { useProjectStore } from "@/stores/project.store";
import { MetricCard } from "../MetricCard/MetricCard";
import { OverviewChart } from "../OverviewChart/OverviewChart";
import { UsageTable } from "../UsageTable/UsageTable";
import { ScheduleCard } from "../ScheduleCard/ScheduleCard";
import {
  TOKEN_DATA,
  LATENCY_DATA,
  RECENT_CALLS,
  METRIC_STATS,
} from "../../fakedatadashboard";
import styles from "./ClientOverviewPage.module.css";

export function ClientOverviewPage() {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const projectsLoading = useProjectStore((s) => s.isLoading);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchProjects({ silent: true });
  }, [fetchProjects]);

  useEffect(() => {
    if (!projectId) {
      setLoading(projectsLoading);
      if (!projectsLoading) {
        setLoading(false);
      }
      return;
    }
    setLoading(false);
  }, [projectId, projectsLoading]);

  if (loading) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap={3}
        className={styles.loadingContainer}
      >
        <Spinner size="md" />
        <Typography variant="p" color="muted">
          Loading data...
        </Typography>
      </Flex>
    );
  }

  if (!projectId) {
    return (
      <Typography variant="p" className={styles.errorText}>
        No project yet. Create a project before viewing the overview.
      </Typography>
    );
  }

  return (
    <div className={styles.scrollArea}>
      <Flex direction="column" gap={32} py="var(--space-8)">
        <Grid columns={3} gap={24}>
          {METRIC_STATS.map((stat, idx) => (
            <MetricCard key={idx} {...stat} />
          ))}
        </Grid>

        <ScheduleCard />

        <Grid columns={2} gap={24}>
          <OverviewChart
            title="Token Usage"
            data={TOKEN_DATA}
            color="var(--color-primary)"
          />
          <OverviewChart
            title="Planned Income"
            data={LATENCY_DATA}
            color="#8b5cf6"
          />
        </Grid>

        <UsageTable title="Recent Model Calls" data={RECENT_CALLS} />
      </Flex>
    </div>
  );
}
