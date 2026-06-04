"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Flex } from "@/components/layout";
import {
  Typography,
  Button,
  Card,
  Input,
  Select,
  Spinner,
} from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import { dashboardPath } from "@/lib/dashboard-route";
import {
  HEARTBEAT_MD_PLACEHOLDER,
  intervalFromPreset,
  presetFromInterval,
  type HeartbeatIntervalPreset,
} from "@/lib/heartbeat-interval";
import styles from "./CardHeartbeat.module.css";

interface CardHeartbeatProps {
  agentId: string;
  isEditing?: boolean;
}

const MODE_OPTIONS = [
  { value: "off", label: "Off" },
  { value: "inherit", label: "Same as Main" },
  { value: "custom", label: "Custom interval" },
];

const PRESET_OPTIONS: { value: HeartbeatIntervalPreset; label: string }[] = [
  { value: "15m", label: "Every 15 minutes" },
  { value: "30m", label: "Every 30 minutes" },
  { value: "1h", label: "Every 1 hour" },
  { value: "custom", label: "Custom" },
];

export function CardHeartbeat({ agentId, isEditing }: CardHeartbeatProps) {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"off" | "inherit" | "custom">("off");
  const [preset, setPreset] = useState<HeartbeatIntervalPreset>("30m");
  const [customAmount, setCustomAmount] = useState("45");
  const [customUnit, setCustomUnit] = useState<"m" | "h">("m");
  const [heartbeatMd, setHeartbeatMd] = useState("");
  const [mainEnabled, setMainEnabled] = useState(false);
  const [mainEvery, setMainEvery] = useState("30m");
  const [effectiveEvery, setEffectiveEvery] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId || !isEditing || agentId === "new-agent") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await projectApi.getAgentHeartbeat(projectId, agentId);
      setMode(data.mode);
      setHeartbeatMd(data.heartbeatMd ?? "");
      setMainEnabled(data.mainEnabled);
      setMainEvery(data.mainEvery);
      setEffectiveEvery(data.effectiveEvery);
      if (data.mode === "custom" && data.every) {
        const mapped = presetFromInterval(true, data.every);
        setPreset(mapped.preset === "off" ? "30m" : mapped.preset);
        setCustomAmount(mapped.customAmount);
        setCustomUnit(mapped.customUnit);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load heartbeat settings");
    } finally {
      setLoading(false);
    }
  }, [projectId, isEditing, agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!projectId || !isEditing || agentId === "new-agent") return;
    setSaving(true);
    setError(null);
    try {
      let every: string | null = null;
      if (mode === "custom") {
        every = intervalFromPreset(preset, customAmount, customUnit).every;
      }
      const data = await projectApi.updateAgentHeartbeat(projectId, agentId, {
        mode,
        every,
        heartbeatMd: heartbeatMd.trim() ? heartbeatMd : null,
      });
      setEffectiveEvery(data.effectiveEvery);
      setMode(data.mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save heartbeat settings");
    } finally {
      setSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <Card className={styles.card}>
        <Typography variant="p" color="muted">
          Save the agent first, then configure heartbeat overrides for this bot.
        </Typography>
      </Card>
    );
  }

  if (loading) {
    return (
      <Flex align="center" justify="center" className={styles.loading}>
        <Spinner size="md" />
      </Flex>
    );
  }

  return (
    <Card className={styles.card}>
      <Typography variant="p" weight="medium">
        Heartbeat override
      </Typography>
      <Typography variant="small" color="muted">
        Custom agents are off by default.{" "}
        <Link href={dashboardPath("agent", "heartbeat")}>Project heartbeat (Main)</Link>{" "}
        is currently {mainEnabled ? `on (${mainEvery})` : "off"}.
      </Typography>

      {error ? (
        <Typography variant="small" className={styles.error}>
          {error}
        </Typography>
      ) : null}

      <Select
        label="Mode"
        value={mode}
        onValueChange={(value) =>
          setMode(value === "inherit" || value === "custom" ? value : "off")
        }
        options={MODE_OPTIONS}
      />

      {mode === "custom" ? (
        <>
          <div className={styles.presetRow}>
            {PRESET_OPTIONS.map((option) => (
              <label key={option.value} className={styles.presetOption}>
                <input
                  type="radio"
                  name={`heartbeat-agent-${agentId}`}
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
        </>
      ) : null}

      <div className={styles.fieldGroup}>
        <Typography variant="small" weight="medium">
          HEARTBEAT.md for this agent
        </Typography>
        <textarea
          className={styles.textarea}
          value={heartbeatMd}
          onChange={(e) => setHeartbeatMd(e.target.value)}
          placeholder={HEARTBEAT_MD_PLACEHOLDER}
          rows={8}
          disabled={mode === "off"}
        />
      </div>

      <Flex justify="between" align="center">
        <Typography variant="small" color="muted">
          Effective: {effectiveEvery ?? "disabled"}
        </Typography>
        <Button variant="primary" size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : "Save heartbeat"}
        </Button>
      </Flex>
    </Card>
  );
}
