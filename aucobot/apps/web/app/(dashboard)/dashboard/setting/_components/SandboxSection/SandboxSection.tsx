"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Button,
  Select,
  Switch,
  Typography,
} from "@/components/ui";
import { Flex } from "@/components/layout";
import { SearchItem } from "@/components/dashboard";
import { AlertTriangle } from "lucide-react";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";
import type { ProjectAgentListRow } from "@/schemas/project.schema";
import styles from "./SandboxSection.module.css";
import { CardSection } from "../CardSection/CardSection";
import { TitleSection } from "../TitleSection/TitleSection";

interface Props {
  projectId: string;
}

type SandboxMode = "all" | "selected";

function AgentSandboxPicker({
  t,
  summary,
  agents,
  filteredAgents,
  searchQuery,
  onSearchChange,
  agentsLoaded,
  agentsError,
  selectedSlugs,
  onToggle,
}: {
  t: (path: string, vars?: Record<string, string>) => string;
  summary: string;
  agents: ProjectAgentListRow[];
  filteredAgents: ProjectAgentListRow[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  agentsLoaded: boolean;
  agentsError: string | null;
  selectedSlugs: string[];
  onToggle: (slug: string, checked: boolean) => void;
}) {
  return (
    <Flex direction="column" gap={3} className={styles.agentPicker}>
      <Typography variant="small" color="muted">
        {summary}
      </Typography>

      <SearchItem
        id="sandbox-applied-search"
        placeholder={t("settings.sandbox.picker.searchPlaceholder")}
        value={searchQuery}
        onChange={onSearchChange}
        className={styles.agentPickerSearch}
      />

      {!agentsLoaded ? (
        <Typography
          variant="small"
          color="muted"
          className={styles.agentPickerState}
        >
          {t("settings.sandbox.picker.loadingAgents")}
        </Typography>
      ) : agentsError ? (
        <Typography variant="small" className={styles.fieldError}>
          {agentsError}
        </Typography>
      ) : agents.length === 0 ? (
        <Flex
          direction="column"
          align="start"
          gap={2}
          className={styles.agentPickerState}
        >
          <Typography variant="small" color="muted">
            {t("settings.sandbox.picker.noAgents")}
          </Typography>
          <Button variant="link" size="sm" asChild>
            <Link href="/dashboard/agent/create">
              {t("settings.sandbox.picker.createAgent")}
            </Link>
          </Button>
        </Flex>
      ) : filteredAgents.length === 0 ? (
        <Typography
          variant="small"
          color="muted"
          className={styles.agentPickerState}
        >
          {t("settings.sandbox.picker.noMatch")}
        </Typography>
      ) : (
        <Flex
          as="ul"
          direction="column"
          gap={3}
          className={styles.agentList}
        >
          {filteredAgents.map((agent) => {
            const selected = selectedSlugs.includes(agent.slug);
            const switchId = `sandbox-applied-${agent.slug}`;
            const rowDisabled = !agent.enabled;

            return (
              <Flex
                as="li"
                key={agent.slug}
                justify="between"
                align="center"
                gap={4}
                className={styles.agentRow}
              >
                <Flex align="start" gap={3} className={styles.agentRowMain}>
                  <Avatar
                    src=""
                    fallback={agent.avatar}
                    size="sm"
                    className={styles.agentAvatar}
                  />
                  <Flex direction="column" gap={2} className={styles.agentMeta}>
                    <Typography variant="p" weight="medium">
                      {agent.name}
                    </Typography>
                    <Typography variant="small" color="muted">
                      {agent.slug}
                    </Typography>
                  </Flex>
                </Flex>

                <Flex
                  direction="column"
                  align="end"
                  gap={2}
                  className={styles.agentRowActions}
                >
                  <Typography
                    variant="small"
                    color="muted"
                    className={styles.toggleHint}
                  >
                    {t("settings.sandbox.picker.useDocker")}
                  </Typography>
                  <Switch
                    id={switchId}
                    checked={selected}
                    disabled={!agentsLoaded || rowDisabled}
                    onCheckedChange={(val) => onToggle(agent.slug, val)}
                    aria-label={t("settings.sandbox.picker.useDockerFor", {
                      name: agent.name,
                    })}
                  />
                </Flex>
              </Flex>
            );
          })}
        </Flex>
      )}
    </Flex>
  );
}

export function SandboxSection({ projectId }: Props) {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<SandboxMode>("all");
  const [exemptAgentSlugs, setExemptAgentSlugs] = useState<string[]>([]);
  const [appliedAgentSlugs, setAppliedAgentSlugs] = useState<string[]>([]);
  const [agents, setAgents] = useState<ProjectAgentListRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [configLoaded, setConfigLoaded] = useState(false);
  const [agentsLoaded, setAgentsLoaded] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  useEffect(() => {
    let active = true;
    if (!projectId) return;

    setConfigLoaded(false);
    setAgentsLoaded(false);
    setConfigError(null);
    setAgentsError(null);

    void projectApi
      .listAgents(projectId)
      .then((rows) => {
        if (!active) return;
        setAgents(rows);
        setAgentsError(null);
        setAgentsLoaded(true);
      })
      .catch((err) => {
        if (!active) return;
        setAgents([]);
        setAgentsError(
          err instanceof Error ? err.message : t("settings.sandbox.errors.loadAgents"),
        );
        setAgentsLoaded(true);
      });

    void projectApi
      .getProjectSandbox(projectId)
      .then((res) => {
        if (!active) return;
        setEnabled(res.enabled);
        setMode(res.mode);
        setExemptAgentSlugs(res.exemptAgentSlugs);
        setAppliedAgentSlugs(res.appliedAgentSlugs);
        setConfigError(null);
        setConfigLoaded(true);
      })
      .catch((err) => {
        if (!active) return;
        setConfigError(
          err instanceof Error
            ? err.message
            : t("settings.sandbox.errors.loadSettings"),
        );
        setConfigLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [projectId, t]);

  const modeOptions = useMemo(
    () => [
      { value: "all", label: t("settings.sandbox.mode.all") },
      { value: "selected", label: t("settings.sandbox.mode.selected") },
    ],
    [t],
  );

  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(q) ||
        agent.slug.toLowerCase().includes(q),
    );
  }, [agents, searchQuery]);

  const appliedCount = appliedAgentSlugs.length;
  const total = agents.length || appliedCount;

  const selectedModeSummary =
    appliedCount === 0
      ? t("settings.sandbox.picker.summaryEmpty")
      : appliedCount === 1
        ? t("settings.sandbox.picker.summaryOne", {
            count: String(appliedCount),
            total: String(total),
          })
        : t("settings.sandbox.picker.summaryMany", {
            count: String(appliedCount),
            total: String(total),
          });

  const handleToggle = (val: boolean) => {
    setEnabled(val);
    setDirty(true);
  };

  const handleMode = (val: SandboxMode) => {
    setMode(val);
    setSearchQuery("");
    setDirty(true);
    if (val === "all") {
      setExemptAgentSlugs([]);
    }
  };

  const handleAppliedToggle = (slug: string, checked: boolean) => {
    const next = checked
      ? [...new Set([...appliedAgentSlugs, slug])]
      : appliedAgentSlugs.filter((s) => s !== slug);
    setAppliedAgentSlugs(next);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      const res = await projectApi.updateProjectSandbox(projectId, {
        enabled,
        mode,
        exemptAgentSlugs: mode === "all" ? [] : exemptAgentSlugs,
        appliedAgentSlugs,
      });
      setEnabled(res.enabled);
      setMode(res.mode);
      setExemptAgentSlugs(res.exemptAgentSlugs);
      setAppliedAgentSlugs(res.appliedAgentSlugs);
      setConfigError(null);
      setSaveStatus("saved");
      setDirty(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  };

  const loaded = configLoaded && agentsLoaded;

  return (
    <Flex direction="column" gap={24}>
      <TitleSection title={t("settings.sandbox.title")} />

      <CardSection>
        {configError ? (
          <Typography variant="small" className={styles.configError}>
            {configError}. {t("settings.sandbox.configErrorSuffix")}
          </Typography>
        ) : null}

        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              {t("settings.sandbox.enable.label")}
            </Typography>
            <Typography variant="small" color="muted">
              {t("settings.sandbox.enable.description")}
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={!configLoaded}
              aria-label={t("settings.sandbox.enable.aria")}
            />
          </CardSection.Action>
        </CardSection.Row>

        <CardSection.Row noBorder className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              {t("settings.sandbox.isolation.label")}
            </Typography>
            <Typography variant="small" color="muted">
              <strong>{t("settings.sandbox.isolation.descriptionAll")}</strong>{" "}
              — {t("settings.sandbox.isolation.descriptionAllDetail")}{" "}
              <strong>
                {t("settings.sandbox.isolation.descriptionSelected")}
              </strong>{" "}
              — {t("settings.sandbox.isolation.descriptionSelectedDetail")}
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <Select
              id="sandbox-default-mode"
              options={modeOptions}
              value={mode}
              onValueChange={(val) => handleMode(val as SandboxMode)}
              disabled={!configLoaded || !enabled}
            />
          </CardSection.Action>
        </CardSection.Row>

        {enabled && mode === "all" ? (
          <Typography variant="small" color="muted" className={styles.allModeHint}>
            {t("settings.sandbox.allModeHint")}
          </Typography>
        ) : null}

        {enabled && mode === "selected" ? (
          <Flex direction="column" className={styles.agentPickerSection}>
            <AgentSandboxPicker
              t={t}
              summary={selectedModeSummary}
              agents={agents}
              filteredAgents={filteredAgents}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              agentsLoaded={agentsLoaded}
              agentsError={agentsError}
              selectedSlugs={appliedAgentSlugs}
              onToggle={handleAppliedToggle}
            />
          </Flex>
        ) : null}

        {!enabled ? (
          <Typography variant="small" color="muted" className={styles.disabledHint}>
            {t("settings.sandbox.disabledHint")}
          </Typography>
        ) : null}

        <Flex align="start" gap={2} className={styles.callout}>
          <AlertTriangle size={16} aria-hidden />
          <Typography variant="small" color="muted">
            {t("settings.sandbox.callout")}
          </Typography>
        </Flex>

        <CardSection.Footer>
          {saveStatus === "error" && (
            <Typography variant="small" className={styles.fieldError}>
              {t("settings.sandbox.save.error")}
            </Typography>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={!dirty || saveStatus === "saving" || !loaded}
            size="sm"
          >
            {saveStatus === "saving"
              ? t("settings.sandbox.save.saving")
              : saveStatus === "saved"
                ? t("settings.sandbox.save.saved")
                : t("settings.sandbox.save.submit")}
          </Button>
        </CardSection.Footer>
      </CardSection>
    </Flex>
  );
}
