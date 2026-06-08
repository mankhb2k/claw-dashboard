"use client";

import React from "react";
import { Flex } from "@/components/layout";
import { Typography, Button, Card, Input, Select } from "@/components/ui";
import {
  HEARTBEAT_MD_PLACEHOLDER,
  type HeartbeatIntervalPreset,
} from "@/lib/heartbeat-interval";
import styles from "./CardHeartbeatConfig.module.css";

const PRESET_OPTIONS: { value: HeartbeatIntervalPreset; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "15m", label: "Every 15 minutes" },
  { value: "30m", label: "Every 30 minutes" },
  { value: "1h", label: "Every 1 hour" },
  { value: "custom", label: "Custom" },
];

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
  return (
    <Card className={styles.card}>
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
                onChange={() => onPresetChange(option.value)}
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
              onChange={(e) => onCustomAmountChange(e.target.value)}
            />
            <Select
              label="Unit"
              value={customUnit}
              onValueChange={(value) =>
                onCustomUnitChange(value === "h" ? "h" : "m")
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
          onChange={(e) => onHeartbeatMdChange(e.target.value)}
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
          onClick={onSave}
          disabled={saving || !projectId}
        >
          {saving ? "Saving…" : "Save heartbeat"}
        </Button>
      </Flex>
    </Card>
  );
}
