"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "./ClientOverviewPage.module.css";
import { CardMetric } from "../CardMetric/CardMetric";
import { CardSchedule } from "../CardSchedule/CardSchedule";
import { OverviewChart } from "../OverviewChart/OverviewChart";
import { UsageTable } from "../UsageTable/UsageTable";
import { Flex, Grid } from "@/components/layout";
import { DateRangePicker, Spinner, Typography } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";
import { useProjectStore } from "@/stores/project.store";
import {
  chartPointsToRecharts,
  formatCostUsd,
  formatTokenCount,
  mapRecentCalls,
} from "@/utils/overview/overview-mappers";

import type {
  OverviewChartPeriod,
  OverviewResponse,
} from "@/schemas/overview.schema";

function formatMetricsRange(dateFrom: string, dateTo: string): string {
  if (dateFrom === dateTo) return dateFrom
  return `${dateFrom} → ${dateTo}`
}

export function ClientOverviewPage() {
  const { t } = useI18n();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const projectsLoading = useProjectStore((s) => s.isLoading);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [pickedDateFrom, setPickedDateFrom] = useState<string | undefined>(
    undefined,
  );
  const [pickedDateTo, setPickedDateTo] = useState<string | undefined>(
    undefined,
  );
  const [chartPeriod, setChartPeriod] = useState<OverviewChartPeriod>("week");
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadKey = projectId
    ? `${projectId}|${pickedDateFrom ?? ""}|${pickedDateTo ?? ""}|${chartPeriod}`
    : "";
  const [trackedLoadKey, setTrackedLoadKey] = useState(loadKey);

  if (loadKey !== trackedLoadKey) {
    setTrackedLoadKey(loadKey);
    if (loadKey) {
      setFetchLoading(true);
      setOverview(null);
      setError(null);
    }
  }

  const loading = !projectId ? projectsLoading : fetchLoading;

  useEffect(() => {
    void fetchProjects({ silent: true });
  }, [fetchProjects]);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    void projectApi
      .getOverview(projectId, {
        dateFrom: pickedDateFrom,
        dateTo: pickedDateTo,
        chartPeriod,
      })
      .then(setOverview)
      .catch((err) => {
        setError(err instanceof Error ? err.message : t("overview.loadError"));
        setOverview(null);
      })
      .finally(() => setFetchLoading(false));
  }, [projectId, pickedDateFrom, pickedDateTo, chartPeriod, t]);

  const inputChartData = useMemo(
    () =>
      overview ? chartPointsToRecharts(overview.charts.input, chartPeriod) : [],
    [overview, chartPeriod],
  );

  const outputChartData = useMemo(
    () =>
      overview
        ? chartPointsToRecharts(overview.charts.output, chartPeriod)
        : [],
    [overview, chartPeriod],
  );

  const recentCalls = useMemo(
    () =>
      overview ? mapRecentCalls(overview.recentCalls, overview.timezone) : [],
    [overview],
  );

  const metricsFrom = pickedDateFrom ?? overview?.dateFrom ?? "";
  const metricsTo = pickedDateTo ?? overview?.dateTo ?? "";
  const metricsRangeLabel =
    metricsFrom && metricsTo ? formatMetricsRange(metricsFrom, metricsTo) : "";

  if (!projectId && !projectsLoading) {
    return (
      <Typography variant="p" className={styles.errorText}>
        {t("overview.noProject")}
      </Typography>
    );
  }

  if (loading && !overview) {
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
          {t("overview.loading")}
        </Typography>
      </Flex>
    );
  }

  return (
    <div className={styles.scrollArea}>
      <Flex direction="column" gap={32}>
        {error ? (
          <Typography variant="p" className={styles.errorText}>
            {error}
          </Typography>
        ) : null}

        <Flex direction="column" gap={12} className={styles.metricsSection}>
          <Flex justify="end">
            <DateRangePicker
              from={metricsFrom}
              to={metricsTo}
              onFromChange={setPickedDateFrom}
              onToChange={setPickedDateTo}
              size="sm"
              disabled={loading}
            />
          </Flex>

          <Grid columns={3} gap={24}>
            <CardMetric
              title={t("overview.metrics.totalInput")}
              value={formatTokenCount(overview?.metrics.totalInput ?? 0)}
              subtitle={metricsRangeLabel || t("overview.metrics.selectedRange")}
              color="var(--color-overview-input)"
            />
            <CardMetric
              title={t("overview.metrics.totalOutput")}
              value={formatTokenCount(overview?.metrics.totalOutput ?? 0)}
              subtitle={metricsRangeLabel || t("overview.metrics.selectedRange")}
              color="var(--color-overview-output)"
            />
            <CardMetric
              title={t("overview.metrics.totalCost")}
              value={formatCostUsd(overview?.metrics.totalCostUsd ?? "0")}
              subtitle={metricsRangeLabel || t("overview.metrics.selectedRange")}
              color="var(--color-overview-cost)"
            />
          </Grid>
        </Flex>

        <CardSchedule />

        <Grid columns={2} gap={24}>
          <OverviewChart
            title={t("overview.charts.inputUsage")}
            data={inputChartData}
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
            color="var(--color-primary)"
          />
          <OverviewChart
            title={t("overview.charts.outputUsage")}
            data={outputChartData}
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
            color="var(--color-overview-chart-secondary)"
          />
        </Grid>

        <UsageTable title={t("overview.usageTable.title")} data={recentCalls} />
      </Flex>
    </div>
  );
}
