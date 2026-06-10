"use client";

import React, { useCallback, useEffect } from "react";
import { Flex } from "@/components/layout";
import {
  Typography,
  Select,
  Switch,
  Card,
} from "@/components/ui";
import { Globe, FileText, Terminal } from "lucide-react";
import { useModelCatalog } from "@/lib/chat/use-model-catalog";
import styles from "./CardCapabilities.module.css";

interface CardCapabilitiesProps {
  projectId: string;
  model: string;
  setModel: (val: string) => void;
  shellExecEnabled: boolean;
  setShellExecEnabled: (val: boolean) => void;
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
  projectId,
  model,
  setModel,
  shellExecEnabled,
  setShellExecEnabled,
}: CardCapabilitiesProps) {
  const {
    modelsLoading,
    loadError,
    providerId,
    modelId,
    providerSelectOptions,
    modelSelectOptions,
    hasProviders,
    handleProviderChange,
    handleModelChange,
  } = useModelCatalog(projectId, model);

  useEffect(() => {
    if (modelsLoading || !modelId?.trim() || model.trim()) return;
    setModel(modelId);
  }, [modelsLoading, modelId, model, setModel]);

  const onModelChange = useCallback(
    (nextModelId: string) => {
      handleModelChange(nextModelId);
      setModel(nextModelId);
    },
    [handleModelChange, setModel],
  );

  return (
    <Card className={styles.card} disableHover>
      <div className={styles.header}>
        <Typography variant="p" weight="bold">
          Agent runtime
        </Typography>
        <Typography variant="small" color="muted">
          Model and shell access for this agent — synced to openclaw.json.
        </Typography>
      </div>

      <div className={styles.modelFields}>
        <Select
          id="agent-model-provider"
          label="Provider"
          options={providerSelectOptions}
          value={providerId}
          onValueChange={handleProviderChange}
          disabled={modelsLoading || !hasProviders}
          placeholder={modelsLoading ? "Loading…" : "No API key"}
        />
        <Select
          id="agent-model"
          label="Default model"
          options={modelSelectOptions}
          value={modelId ?? model}
          onValueChange={onModelChange}
          disabled={
            modelsLoading || !hasProviders || modelSelectOptions.length === 0
          }
          placeholder={modelsLoading ? "Loading…" : "Model"}
        />
      </div>
      <Typography variant="small" color="muted">
        Used on Telegram, Discord, and as the Chat default for this agent.
      </Typography>
      {loadError ? (
        <Typography variant="small" color="muted">
          {loadError}
        </Typography>
      ) : null}

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
          icon={<Terminal size={20} />}
          title="Allow shell commands"
          description="When off, this agent cannot run shell commands. Project shell policy in Settings does not apply."
          checked={shellExecEnabled}
          onCheckedChange={setShellExecEnabled}
        />
      </Flex>
    </Card>
  );
}
