"use client";

import React from "react";
import { Flex } from "@/components/layout";
import {
  Typography,
  Select,
  Switch,
  Input,
  Card,
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui";
import { Globe, FileText, Code, Settings2, X } from "lucide-react";
import styles from "./CardCapabilities.module.css";

const MODEL_OPTIONS = [
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet (Recommended)" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gemini-1-5-pro", label: "Gemini 1.5 Pro" },
];

interface CardCapabilitiesProps {
  model: string;
  setModel: (val: string) => void;
  sandboxEnabled: boolean;
  setSandboxEnabled: (val: boolean) => void;
  askPolicy: "always" | "on-miss" | "off";
  setAskPolicy: (val: "always" | "on-miss" | "off") => void;
  safeBins: string[];
  newTagInput: string;
  setNewTagInput: (val: string) => void;
  timeoutSec: number;
  setTimeoutSec: (val: number) => void;
  handleAddTag: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleRemoveTag: (tag: string) => void;
}

function ToolRow({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.toolRow}>
      <div className={styles.toolMain}>
        <span className={styles.toolIconWrap} aria-hidden>
          {icon}
        </span>
        <div className={styles.toolCopy}>
          <Typography variant="p" weight="medium">
            {title}
          </Typography>
          <Typography variant="small" color="muted">
            {description}
          </Typography>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={title}
      />
    </div>
  );
}

export function CardCapabilities({
  model,
  setModel,
  sandboxEnabled,
  setSandboxEnabled,
  askPolicy,
  setAskPolicy,
  safeBins,
  newTagInput,
  setNewTagInput,
  timeoutSec,
  setTimeoutSec,
  handleAddTag,
  handleRemoveTag,
}: CardCapabilitiesProps) {
  const policyHint =
    askPolicy === "always"
      ? "The agent must request your approval before running any command."
      : askPolicy === "on-miss"
        ? "Only commands outside the allowlist below require approval."
        : "The agent may run commands automatically without approval (use only with Docker Sandbox).";

  return (
    <Card className={styles.card} disableHover>
      <div className={styles.header}>
        <Typography variant="p" weight="bold">
          Runtime configuration
        </Typography>
        <Typography variant="small" color="muted">
          Model, sandbox, and execution policy — synced to openclaw.json (not Markdown
          files).
        </Typography>
      </div>

      <Select
        id="agent-model"
        label="AI model"
        options={MODEL_OPTIONS}
        value={model}
        onValueChange={setModel}
      />

      <hr className={styles.divider} />

      <Typography variant="p" weight="bold" className={styles.sectionTitle}>
        Native tools
      </Typography>

      <Flex direction="column" gap={3}>
        <ToolRow
          icon={<Globe size={20} />}
          title="Browser & web search"
          description="Lets the agent browse the web and fetch realtime information."
          checked
          disabled
        />
        <ToolRow
          icon={<FileText size={20} />}
          title="Read/write workspace files"
          description="Access files uploaded in the project."
          checked
          disabled
        />
        <ToolRow
          icon={<Code size={20} />}
          title="Code execution (Sandbox)"
          description="Run Python/JS for computation and data processing."
          checked={sandboxEnabled}
          onCheckedChange={setSandboxEnabled}
        />
      </Flex>

      {sandboxEnabled ? (
        <div className={styles.advancedPanel}>
          <div className={styles.advancedTitle}>
            <span className={styles.toolIconWrap} aria-hidden>
              <Settings2 size={16} />
            </span>
            <Typography variant="small" weight="bold">
              Advanced sandbox
            </Typography>
          </div>

          <div className={styles.field}>
            <Typography variant="small" weight="medium">
              Approval policy
            </Typography>
            <ToggleGroup
              type="single"
              value={askPolicy}
              onValueChange={(value) => {
                if (value === "always" || value === "on-miss" || value === "off") {
                  setAskPolicy(value);
                }
              }}
              className={styles.policyGroup}
            >
              <ToggleGroupItem value="always">Always ask</ToggleGroupItem>
              <ToggleGroupItem value="on-miss">Standard</ToggleGroupItem>
              <ToggleGroupItem value="off">Automatic</ToggleGroupItem>
            </ToggleGroup>
            <Typography variant="small" color="muted">
              {policyHint}
            </Typography>
          </div>

          <div className={styles.field}>
            <Typography variant="small" weight="medium">
              Commands exempt from approval (allowlist)
            </Typography>
            <div className={styles.tagContainer}>
              {safeBins.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    className={styles.tagDeleteBtn}
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove ${tag}`}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                className={styles.tagInput}
                placeholder={
                  safeBins.length === 0
                    ? "Enter a command and press Enter..."
                    : "Add command..."
                }
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
            <Typography variant="small" color="muted">
              Press Enter or comma to add a command to the silent-run allowlist.
            </Typography>
          </div>

          <Input
            id="sandbox-timeout"
            type="number"
            label="Maximum run time (seconds)"
            className={styles.timeoutField}
            value={timeoutSec}
            onChange={(e) => setTimeoutSec(Number(e.target.value))}
            min={5}
            max={3600}
          />
        </div>
      ) : null}
    </Card>
  );
}
