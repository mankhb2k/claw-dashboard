"use client";

import { useMemo } from "react";

import styles from "./CardHeartbeatConfig.module.css";
import { Flex } from "@/components/layout";
import { Typography, Button, Card, Input, Select } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import {
  HEARTBEAT_MD_PLACEHOLDER,
  type HeartbeatIntervalPreset,
} from "@/utils/agent/heartbeat-interval";

type CardHeartbeatConfigProps = {
  preset: HeartbeatIntervalPreset;
  customAmount: string;
  customUnit: "m" | "h";
  heartbeatMd: string;
  effectiveEvery: string | null;
  enabled: boolean;
  saving: boolean;
  projectId: string;
  onPresetChange: (preset: HeartbeatIntervalPreset) => void;
  onCustomAmountChange: (value: string) => void;
  onCustomUnitChange: (value: "m" | "h") => void;
  onHeartbeatMdChange: (value: string) => void;
  onSave: () => void;
};

export function CardHeartbeatConfig({
  preset,
  customAmount,
  customUnit,
  heartbeatMd,
  effectiveEvery,
  enabled,
  saving,
  projectId,
  onPresetChange,
  onCustomAmountChange,
  onCustomUnitChange,
  onHeartbeatMdChange,
  onSave,
}: CardHeartbeatConfigProps) {
  const { t } = useI18n();

  const presetOptions = useMemo(
    (): { value: HeartbeatIntervalPreset; label: string }[] => [
      { value: "off", label: t("agent.heartbeat.config.off") },
      { value: "15m", label: t("agent.heartbeat.config.every15") },
      { value: "30m", label: t("agent.heartbeat.config.every30") },
      { value: "1h", label: t("agent.heartbeat.config.every1h") },
      { value: "custom", label: t("agent.heartbeat.config.custom") },
    ],
    [t],
  );

  return (
    <Card className={styles.card}>
      <div className={styles.fieldGroup}>
        <Typography variant="small" weight="medium">
          {t("agent.heartbeat.config.interval")}
        </Typography>
        <div className={styles.presetRow}>
          {presetOptions.map((option) => (
            <label key={option.value} className={styles.presetOption}>
              <input
                type="radio"
                name="heartbeat-preset"
                checked={preset === option.value}
                onChange={() => onPresetChange(option.value)}
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
              onChange={(e) => onCustomAmountChange(e.target.value)}
            />
            <Select
              label={t("agent.heartbeat.config.unit")}
              value={customUnit}
              onValueChange={(value) =>
                onCustomUnitChange(value === "h" ? "h" : "m")
              }
              options={[
                { value: "m", label: t("agent.heartbeat.config.minutes") },
                { value: "h", label: t("agent.heartbeat.config.hours") },
              ]}
            />
          </Flex>
        ) : null}
      </div>

      <div className={styles.fieldGroup}>
        <Typography variant="small" weight="medium">
          {t("agent.heartbeat.config.checklist")}
        </Typography>
        <textarea
          className={styles.textarea}
          value={heartbeatMd}
          onChange={(e) => onHeartbeatMdChange(e.target.value)}
          placeholder={HEARTBEAT_MD_PLACEHOLDER}
          rows={8}
          disabled={!enabled}
        />
      </div>

      <Flex justify="between" align="center" className={styles.footerRow}>
        <Typography variant="small" color="muted">
          {t("agent.heartbeat.config.effective", {
            value: effectiveEvery ?? t("agent.heartbeat.config.disabled"),
          })}
        </Typography>
        <Button
          variant="primary"
          size="sm"
          onClick={onSave}
          disabled={saving || !projectId}
        >
          {saving ? t("agent.heartbeat.config.saving") : t("agent.heartbeat.config.save")}
        </Button>
      </Flex>
    </Card>
  );
}
