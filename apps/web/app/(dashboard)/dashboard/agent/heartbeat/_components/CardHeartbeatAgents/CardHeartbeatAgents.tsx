"use client";

import Link from "next/link";
import { useMemo } from "react";

import styles from "./CardHeartbeatAgents.module.css";
import { Typography, Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { DASHBOARD_BASE_PATH, dashboardPath } from "@/lib/routing/dashboard-route";

import type { HeartbeatSummaryEntry } from "@/schemas/project.schema";

function agentHeartbeatHref(agentId: string): string {
  if (agentId === "main") {
    return dashboardPath("agent", "heartbeat");
  }
  return `${DASHBOARD_BASE_PATH}/agent/${encodeURIComponent(agentId)}?tab=heartbeat`;
}

type CardHeartbeatAgentsProps = {
  agents: HeartbeatSummaryEntry[];
};

export function CardHeartbeatAgents({ agents }: CardHeartbeatAgentsProps) {
  const { t } = useI18n();

  const sourceLabel = useMemo(
    () =>
      (source: HeartbeatSummaryEntry["source"]): string => {
        switch (source) {
          case "main":
            return t("agent.heartbeat.agents.sourceMain");
          case "inherit":
            return t("agent.heartbeat.agents.sourceSameAsMain");
          case "custom":
            return t("agent.heartbeat.agents.sourceCustom");
          default:
            return t("agent.heartbeat.agents.sourceOff");
        }
      },
    [t],
  );

  const customAgents = useMemo(
    () => agents.filter((row) => row.agentId !== "main"),
    [agents],
  );

  return (
    <Card className={styles.card}>
      <Typography variant="p" weight="medium">
        {t("agent.heartbeat.agents.title")}
      </Typography>
      <Typography variant="small" color="muted">
        {t("agent.heartbeat.agents.description")}
      </Typography>

      <div className={styles.agentTable}>
        <div className={`${styles.agentRow} ${styles.agentRowHead}`}>
          <span>{t("agent.heartbeat.agents.headers.agent")}</span>
          <span>{t("agent.heartbeat.agents.headers.status")}</span>
          <span>{t("agent.heartbeat.agents.headers.interval")}</span>
          <span>{t("agent.heartbeat.agents.headers.source")}</span>
          <span />
        </div>
        {agents.map((row) => (
          <div key={row.agentId} className={styles.agentRow}>
            <span>{row.name}</span>
            <span>
              {row.enabled
                ? t("agent.heartbeat.agents.on")
                : t("agent.heartbeat.agents.off")}
            </span>
            <span>{row.every ?? "—"}</span>
            <span>{sourceLabel(row.source)}</span>
            <span>
              {row.agentId === "main" ? (
                <span className={styles.muted}>—</span>
              ) : (
                <Link href={agentHeartbeatHref(row.agentId)} className={styles.link}>
                  {t("agent.heartbeat.agents.configure")}
                </Link>
              )}
            </span>
          </div>
        ))}
        {customAgents.length === 0 ? (
          <Typography variant="small" color="muted" className={styles.emptyAgents}>
            {t("agent.heartbeat.agents.empty")}
          </Typography>
        ) : null}
      </div>
    </Card>
  );
}
