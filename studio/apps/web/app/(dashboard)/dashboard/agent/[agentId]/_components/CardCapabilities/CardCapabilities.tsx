"use client";

import { Globe, FileText, Terminal } from "lucide-react";
import React, { useCallback, useEffect } from "react";

import styles from "./CardCapabilities.module.css";
import { Flex } from "@/components/layout";
import {
  Typography,
  Select,
  Switch,
  Card,
} from "@/components/ui";
import { useModelCatalog } from "@/hooks/chat/use-model-catalog";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
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
          {t("agent.capabilities.title")}
        </Typography>
        <Typography variant="small" color="muted">
          {t("agent.capabilities.description")}
        </Typography>
      </div>

      <div className={styles.modelFields}>
        <Select
          id="agent-model-provider"
          label={t("agent.capabilities.provider")}
          options={providerSelectOptions}
          value={providerId}
          onValueChange={handleProviderChange}
          disabled={modelsLoading || !hasProviders}
          placeholder={
            modelsLoading
              ? t("agent.capabilities.loading")
              : t("agent.capabilities.noApiKey")
          }
        />
        <Select
          id="agent-model"
          label={t("agent.capabilities.defaultModel")}
          options={modelSelectOptions}
          value={modelId ?? model}
          onValueChange={onModelChange}
          disabled={
            modelsLoading || !hasProviders || modelSelectOptions.length === 0
          }
          placeholder={
            modelsLoading
              ? t("agent.capabilities.loading")
              : t("agent.capabilities.modelPlaceholder")
          }
        />
      </div>
      <Typography variant="small" color="muted">
        {t("agent.capabilities.channelHint")}
      </Typography>
      {loadError ? (
        <Typography variant="small" color="muted">
          {loadError}
        </Typography>
      ) : null}

      <hr className={styles.divider} />

      <Typography variant="p" weight="bold" className={styles.sectionTitle}>
        {t("agent.capabilities.nativeTools")}
      </Typography>

      <Flex direction="column" gap={3}>
        <ToolRow
          icon={<Globe size={20} />}
          title={t("agent.capabilities.browser.title")}
          description={t("agent.capabilities.browser.description")}
          checked
          disabled
        />
        <ToolRow
          icon={<FileText size={20} />}
          title={t("agent.capabilities.files.title")}
          description={t("agent.capabilities.files.description")}
          checked
          disabled
        />
        <ToolRow
          icon={<Terminal size={20} />}
          title={t("agent.capabilities.shell.title")}
          description={t("agent.capabilities.shell.description")}
          checked={shellExecEnabled}
          onCheckedChange={setShellExecEnabled}
        />
      </Flex>
    </Card>
  );
}
