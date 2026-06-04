"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Info } from "lucide-react";
import { Flex } from "@/components/layout";
import {
  Typography,
  Button,
  Card,
  Spinner,
  Input,
  Select,
} from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type { HeartbeatSummaryEntry } from "@/schemas/project.schema";
import { DASHBOARD_BASE_PATH, dashboardPath } from "@/lib/dashboard-route";
import {
  HEARTBEAT_MD_PLACEHOLDER,
  intervalFromPreset,
  presetFromInterval,
  type HeartbeatIntervalPreset,
} from "@/lib/heartbeat-interval";
import styles from "./ClientProjectHeartbeatPage.module.css";

const PRESET_OPTIONS: { value: HeartbeatIntervalPreset; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "15m", label: "Every 15 minutes" },
  { value: "30m", label: "Every 30 minutes" },
  { value: "1h", label: "Every 1 hour" },
  { value: "custom", label: "Custom" },
];

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

export default function ClientProjectHeartbeatPage() {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<HeartbeatIntervalPreset>("off");
  const [customAmount, setCustomAmount] = useState("45");
  const [customUnit, setCustomUnit] = useState<"m" | "h">("m");
  const [heartbeatMd, setHeartbeatMd] = useState("");
  const [agents, setAgents] = useState<HeartbeatSummaryEntry[]>([]);
  const [effectiveEvery, setEffectiveEvery] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await projectApi.getProjectHeartbeat(projectId);
      const mapped = presetFromInterval(data.enabled, data.every);
      setPreset(mapped.preset);
      setCustomAmount(mapped.customAmount);
      setCustomUnit(mapped.customUnit);
      setHeartbeatMd(data.heartbeatMd ?? "");
      setAgents(data.agents);
      setEffectiveEvery(data.effectiveEvery);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load heartbeat settings");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const enabled = preset !== "off";

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    setError(null);
    try {
      const { enabled: nextEnabled, every } = intervalFromPreset(
        preset,
        customAmount,
        customUnit,
      );
      const data = await projectApi.updateProjectHeartbeat(projectId, {
        enabled: nextEnabled,
        every,
        heartbeatMd: heartbeatMd.trim() ? heartbeatMd : null,
      });
      setAgents(data.agents);
      setEffectiveEvery(data.effectiveEvery);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save heartbeat settings");
    } finally {
      setSaving(false);
    }
  };

  const customAgents = useMemo(
    () => agents.filter((row) => row.agentId !== "main"),
    [agents],
  );

  if (loading) {
    return (
      <Flex align="center" justify="center" className={styles.loading}>
        <Spinner size="md" />
      </Flex>
    );
  }

  return (
    <div className={styles.root}>
      {error ? (
        <Typography variant="p" className={styles.error}>
          {error}
        </Typography>
      ) : null}

      <Card className={styles.card}>
        <Flex align="center" gap={8} className={styles.headerRow}>
          <Activity size={18} />
          <div>
            <Typography variant="p" weight="medium">
              Main agent heartbeat
            </Typography>
            <Typography variant="small" color="muted">
              Periodic check-in for the default <code>main</code> session. Not the
              same as scheduled cron jobs or API key tests.
            </Typography>
          </div>
        </Flex>

        <div className={styles.callout}>
          <Info size={16} />
          <Typography variant="small" color="muted">
            When nothing needs attention, OpenClaw replies{" "}
            <code>HEARTBEAT_OK</code> — that is normal and may appear in Chat
            history.
          </Typography>
        </div>

        <div className={styles.fieldGroup}>
          <Typography variant="small" weight="medium">
            Interval
          </Typography>
          <div className={styles.presetRow}>
            {PRESET_OPTIONS.map((option) => (
              <label key={option.value} className={styles.presetOption}>
                <input
                  type="radio"
                  name="heartbeat-preset"
                  checked={preset === option.value}
                  onChange={() => setPreset(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {preset === "custom" ? (
            <Flex align="end" gap={8} className={styles.customRow}>
              <Input
                label="Custom interval"
                type="number"
                min={1}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
              <Select
                label="Unit"
                value={customUnit}
                onValueChange={(value) =>
                  setCustomUnit(value === "h" ? "h" : "m")
                }
                options={[
                  { value: "m", label: "Minutes" },
                  { value: "h", label: "Hours" },
                ]}
              />
            </Flex>
          ) : null}
        </div>

        <div className={styles.fieldGroup}>
          <Typography variant="small" weight="medium">
            HEARTBEAT.md checklist
          </Typography>
          <textarea
            className={styles.textarea}
            value={heartbeatMd}
            onChange={(e) => setHeartbeatMd(e.target.value)}
            placeholder={HEARTBEAT_MD_PLACEHOLDER}
            rows={8}
            disabled={!enabled}
          />
        </div>

        <Flex justify="between" align="center" className={styles.footerRow}>
          <Typography variant="small" color="muted">
            Effective: {effectiveEvery ?? "disabled"}
          </Typography>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSave()}
            disabled={saving || !projectId}
          >
            {saving ? "Saving…" : "Save heartbeat"}
          </Button>
        </Flex>
      </Card>

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
    </div>
  );
}
