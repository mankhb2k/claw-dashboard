"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Typography, Card } from "@/components/ui";
import type { HeartbeatSummaryEntry } from "@/schemas/project.schema";
import { DASHBOARD_BASE_PATH, dashboardPath } from "@/lib/routing/dashboard-route";
import styles from "./CardHeartbeatAgents.module.css";

function agentHeartbeatHref(agentId: string): string {
  if (agentId === "main") {
    return dashboardPath("agent", "heartbeat");
  }
  return `${DASHBOARD_BASE_PATH}/agent/${encodeURIComponent(agentId)}?tab=heartbeat`;
}

function sourceLabel(source: HeartbeatSummaryEntry["source"]): string {
  switch (source) {
    case "main":
      return "Main default";
    case "inherit":
      return "Same as Main";
    case "custom":
      return "Custom";
    default:
      return "Off";
  }
}

type CardHeartbeatAgentsProps = {
  agents: HeartbeatSummaryEntry[];
};

export function CardHeartbeatAgents({ agents }: CardHeartbeatAgentsProps) {
  const customAgents = useMemo(
    () => agents.filter((row) => row.agentId !== "main"),
    [agents],
  );

  return (
    <Card className={styles.card}>
      <Typography variant="p" weight="medium">
        Agents
      </Typography>
      <Typography variant="small" color="muted">
        Custom agents are off by default. Override on each agent&apos;s Heartbeat
        tab.
      </Typography>

      <div className={styles.agentTable}>
        <div className={`${styles.agentRow} ${styles.agentRowHead}`}>
          <span>Agent</span>
          <span>Status</span>
          <span>Interval</span>
          <span>Source</span>
          <span />
        </div>
        {agents.map((row) => (
          <div key={row.agentId} className={styles.agentRow}>
            <span>{row.name}</span>
            <span>{row.enabled ? "On" : "Off"}</span>
            <span>{row.every ?? "—"}</span>
            <span>{sourceLabel(row.source)}</span>
            <span>
              {row.agentId === "main" ? (
                <span className={styles.muted}>—</span>
              ) : (
                <Link href={agentHeartbeatHref(row.agentId)} className={styles.link}>
                  Configure
                </Link>
              )}
            </span>
          </div>
        ))}
        {customAgents.length === 0 ? (
          <Typography variant="small" color="muted" className={styles.emptyAgents}>
            No custom agents yet.
          </Typography>
        ) : null}
      </div>
    </Card>
  );
}
