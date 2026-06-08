"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Flex } from "@/components/layout";
import { Typography, Spinner } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type { HeartbeatSummaryEntry } from "@/schemas/project.schema";
import {
  intervalFromPreset,
  presetFromInterval,
  type HeartbeatIntervalPreset,
} from "@/lib/heartbeat-interval";
import { CardHeartbeatOverview } from "../CardHeartbeatOverview/CardHeartbeatOverview";
import { CardHeartbeatConfig } from "../CardHeartbeatConfig/CardHeartbeatConfig";
import { CardHeartbeatAgents } from "../CardHeartbeatAgents/CardHeartbeatAgents";
import styles from "./ClientProjectHeartbeatPage.module.css";

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
      setError(
        err instanceof Error ? err.message : "Cannot load heartbeat settings",
      );
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
      setError(
        err instanceof Error ? err.message : "Cannot save heartbeat settings",
      );
    } finally {
      setSaving(false);
    }
  };

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

      <CardHeartbeatOverview />

      <CardHeartbeatConfig
        preset={preset}
        customAmount={customAmount}
        customUnit={customUnit}
        heartbeatMd={heartbeatMd}
        effectiveEvery={effectiveEvery}
        enabled={enabled}
        saving={saving}
        projectId={projectId}
        onPresetChange={setPreset}
        onCustomAmountChange={setCustomAmount}
        onCustomUnitChange={setCustomUnit}
        onHeartbeatMdChange={setHeartbeatMd}
        onSave={() => void handleSave()}
      />

      <CardHeartbeatAgents agents={agents} />
    </div>
  );
}
