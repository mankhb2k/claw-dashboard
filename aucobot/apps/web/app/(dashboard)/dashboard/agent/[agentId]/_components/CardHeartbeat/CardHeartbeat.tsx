"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useI18n } from "@/lib/i18n";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import { dashboardPath } from "@/lib/routing/dashboard-route";
import {
  HEARTBEAT_MD_PLACEHOLDER,
  intervalFromPreset,
  presetFromInterval,
  type HeartbeatIntervalPreset,
} from "@/utils/agent/heartbeat-interval";
import styles from "./CardHeartbeat.module.css";

interface CardHeartbeatProps {
  agentId: string;
  isEditing?: boolean;
}

export function CardHeartbeat({ agentId, isEditing }: CardHeartbeatProps) {
  const { t } = useI18n();
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

  const modeOptions = useMemo(
    () => [
      { value: "off", label: t("agent.heartbeat.tab.modeOff") },
      { value: "inherit", label: t("agent.heartbeat.tab.modeSameAsMain") },
      { value: "custom", label: t("agent.heartbeat.tab.modeCustom") },
    ],
    [t],
  );

  const presetOptions = useMemo(
    (): { value: HeartbeatIntervalPreset; label: string }[] => [
      { value: "15m", label: t("agent.heartbeat.config.every15") },
      { value: "30m", label: t("agent.heartbeat.config.every30") },
      { value: "1h", label: t("agent.heartbeat.config.every1h") },
      { value: "custom", label: t("agent.heartbeat.config.custom") },
    ],
    [t],
  );

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
      setError(
        err instanceof Error ? err.message : t("agent.heartbeat.errors.load"),
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, isEditing, agentId, t]);

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
      setError(
        err instanceof Error ? err.message : t("agent.heartbeat.errors.save"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <Card className={styles.card}>
        <Typography variant="p" color="muted">
          {t("agent.heartbeat.tab.saveFirst")}
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
        {t("agent.heartbeat.tab.title")}
      </Typography>
      <Typography variant="small" color="muted">
        {t("agent.heartbeat.tab.customOff")}{" "}
        <Link href={dashboardPath("agent", "heartbeat")}>
          {t("agent.heartbeat.tab.projectLink")}
        </Link>{" "}
        {mainEnabled
          ? t("agent.heartbeat.tab.projectOn", { interval: mainEvery })
          : t("agent.heartbeat.tab.projectOff")}
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
        options={modeOptions}
      />

      {mode === "custom" ? (
        <>
          <div className={styles.presetRow}>
            {presetOptions.map((option) => (
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
                label={t("agent.heartbeat.config.customInterval")}
                type="number"
                min={1}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
              <Select
                label={t("agent.heartbeat.config.unit")}
                value={customUnit}
                onValueChange={(value) =>
                  setCustomUnit(value === "h" ? "h" : "m")
                }
                options={[
                  { value: "m", label: t("agent.heartbeat.config.minutes") },
                  { value: "h", label: t("agent.heartbeat.config.hours") },
                ]}
              />
            </Flex>
          ) : null}
        </>
      ) : null}

      <div className={styles.fieldGroup}>
        <Typography variant="small" weight="medium">
          {t("agent.heartbeat.tab.agentChecklist")}
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
          {t("agent.heartbeat.config.effective", {
            value: effectiveEvery ?? t("agent.heartbeat.config.disabled"),
          })}
        </Typography>
        <Button variant="primary" size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? t("agent.heartbeat.config.saving") : t("agent.heartbeat.config.save")}
        </Button>
      </Flex>
    </Card>
  );
}
