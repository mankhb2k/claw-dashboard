"use client";

import React from "react";
import { Flex } from "@/components/layout";
import { Typography, Select, Switch, Input } from "@/components/ui";
import { Globe, FileText, Code, X } from "lucide-react";
import styles from "./CardCapabilities.module.css";

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
  return (
    <div className={styles.section}>
      <Typography variant="p" weight="bold">
        Runtime configuration (openclaw.json)
      </Typography>
      <Typography variant="small" color="muted">
        Model, sandbox, and execution policy — does not create Markdown files.
      </Typography>
      <Typography variant="p" weight="bold">
        AI Model
      </Typography>
      <Select
        options={[
          { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet (Recommended)" },
          { value: "gpt-4o", label: "GPT-4o" },
          { value: "gemini-1-5-pro", label: "Gemini 1.5 Pro" },
        ]}
        value={model}
        onValueChange={(val) => setModel(val)}
      />
      
      <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "16px 0" }} />
      
      <Typography variant="p" weight="bold" style={{ marginBottom: 8 }}>Native tools</Typography>
      
      <div className={styles.toolItem}>
        <Flex align="center" gap={3}>
          <Globe size={20} color="var(--primary-color)" />
          <div>
            <Typography variant="p" weight="medium">Browser & web search</Typography>
            <Typography variant="small" color="muted">Lets the agent browse the web and fetch realtime information.</Typography>
          </div>
        </Flex>
        <Switch checked={true} onCheckedChange={() => {}} />
      </div>

      <div className={styles.toolItem}>
        <Flex align="center" gap={3}>
          <FileText size={20} color="var(--primary-color)" />
          <div>
            <Typography variant="p" weight="medium">Read/write workspace files</Typography>
            <Typography variant="small" color="muted">Access files uploaded in the project.</Typography>
          </div>
        </Flex>
        <Switch checked={true} onCheckedChange={() => {}} />
      </div>

      <div className={styles.toolItem}>
        <Flex align="center" gap={3}>
          <Code size={20} color="var(--primary-color)" />
          <div>
            <Typography variant="p" weight="medium">Code execution (Sandbox)</Typography>
            <Typography variant="small" color="muted">Run Python/JS for computation and data processing.</Typography>
          </div>
        </Flex>
        <Switch checked={sandboxEnabled} onCheckedChange={setSandboxEnabled} />
      </div>

      {sandboxEnabled && (
        <div className={styles.advancedPanel}>
          <Typography variant="small" weight="bold" color="primary" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
            ⚙️ Advanced sandbox (ExecToolConfig)
          </Typography>

          <div className={styles.inputGroup}>
            <Typography variant="small" weight="medium">Approval policy (Ask Policy)</Typography>
            <div className={styles.segmentedControl}>
              {[
                { value: "always", label: "Always ask" },
                { value: "on-miss", label: "Standard" },
                { value: "off", label: "Automatic" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.segmentedButton} ${askPolicy === opt.value ? styles.active : ""}`}
                  onClick={() => setAskPolicy(opt.value as "always" | "on-miss" | "off")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Typography variant="small" color="muted" style={{ marginTop: 4 }}>
              {askPolicy === "always" && "The agent must request your approval before running any command."}
              {askPolicy === "on-miss" && "Only commands outside the allowlist below require approval."}
              {askPolicy === "off" && "The agent may run commands automatically without approval (use only with Docker Sandbox)."}
            </Typography>
          </div>

          <div className={styles.inputGroup}>
            <Typography variant="small" weight="medium">Commands exempt from approval (Allowlist)</Typography>
            <div className={styles.tagContainer}>
              {safeBins.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    className={styles.tagDeleteBtn}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X size={13} style={{ marginLeft: 4 }} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                className={styles.tagInput}
                placeholder={safeBins.length === 0 ? "Enter a command and press Enter..." : "Add command..."}
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
            <Typography variant="small" color="muted">
              Enter a command name and press Enter or comma (,) to add it to the silent-run allowlist.
            </Typography>
          </div>

          <div className={styles.inputGroup}>
            <Typography variant="small" weight="medium">Maximum run time (Timeout)</Typography>
            <div className={styles.numberInputWrapper}>
              <Input
                type="number"
                value={timeoutSec}
                onChange={(e) => setTimeoutSec(Number(e.target.value))}
                min={5}
                max={3600}
              />
              <span className={styles.numberInputSuffix}>seconds</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
