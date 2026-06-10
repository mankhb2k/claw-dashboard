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
import type { ProjectAgentListRow } from "@/schemas/project.schema";
import styles from "./SandboxSection.module.css";
import { CardSection } from "../CardSection/CardSection";
import { TitleSection } from "../TitleSection/TitleSection";

interface Props {
  projectId: string;
}

type SandboxMode = "all" | "selected";

const MODE_OPTIONS = [
  { value: "all", label: "All agents" },
  { value: "selected", label: "Selected agents only" },
];

function AgentSandboxPicker({
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
        placeholder="Search agents..."
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
          Loading agents...
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
            No agents found for this project.
          </Typography>
          <Button variant="link" size="sm" asChild>
            <Link href="/dashboard/agent/create">Create an agent</Link>
          </Button>
        </Flex>
      ) : filteredAgents.length === 0 ? (
        <Typography
          variant="small"
          color="muted"
          className={styles.agentPickerState}
        >
          No agents match your search.
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
                    Use Docker sandbox
                  </Typography>
                  <Switch
                    id={switchId}
                    checked={selected}
                    disabled={!agentsLoaded || rowDisabled}
                    onCheckedChange={(val) => onToggle(agent.slug, val)}
                    aria-label={`Use Docker sandbox for ${agent.name}`}
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
          err instanceof Error ? err.message : "Cannot load agents",
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
          err instanceof Error ? err.message : "Cannot load sandbox settings",
        );
        setConfigLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [projectId]);

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

  const selectedModeSummary =
    appliedCount === 0
      ? "Turn on Docker sandbox per agent. Agents left off run on the gateway host."
      : `${appliedCount} of ${agents.length || appliedCount} agent${
          (agents.length || appliedCount) === 1 ? "" : "s"
        } use Sandbox.`;

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
      <TitleSection title="Sandbox" />

      <CardSection>
        {configError ? (
          <Typography variant="small" className={styles.configError}>
            {configError}. Sandbox settings could not be loaded from the server.
          </Typography>
        ) : null}

        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              Enable project sandbox
            </Typography>
            <Typography variant="small" color="muted">
              Run shell commands inside Docker. Choose whether sandbox applies to
              all agents or only selected ones.
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={!configLoaded}
              aria-label="Enable project sandbox"
            />
          </CardSection.Action>
        </CardSection.Row>

        <CardSection.Row noBorder className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              Isolation scope
            </Typography>
            <Typography variant="small" color="muted">
              <strong>All agents</strong> — every agent uses Docker sandbox.{" "}
              <strong>Selected agents only</strong> — pick who uses Docker.
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <Select
              id="sandbox-default-mode"
              options={MODE_OPTIONS}
              value={mode}
              onValueChange={(val) => handleMode(val as SandboxMode)}
              disabled={!configLoaded || !enabled}
            />
          </CardSection.Action>
        </CardSection.Row>

        {enabled && mode === "all" ? (
          <Typography variant="small" color="muted" className={styles.allModeHint}>
            All agents use Docker sandbox.
          </Typography>
        ) : null}

        {enabled && mode === "selected" ? (
          <Flex direction="column" className={styles.agentPickerSection}>
            <AgentSandboxPicker
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
            Turn on project sandbox to configure agent placement.
          </Typography>
        ) : null}

        <Flex align="start" gap={2} className={styles.callout}>
          <AlertTriangle size={16} aria-hidden />
          <Typography variant="small" color="muted">
            The <code>docker</code> backend requires the gateway to reach Docker
            (socket or DinD). Sandbox changes where commands run, not whether
            agents can use shell tools.
          </Typography>
        </Flex>

        <CardSection.Footer>
          {saveStatus === "error" && (
            <Typography variant="small" className={styles.fieldError}>
              Something went wrong. Try again.
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
              ? "Saving..."
              : saveStatus === "saved"
                ? "Saved"
                : "Save changes"}
          </Button>
        </CardSection.Footer>
      </CardSection>
    </Flex>
  );
}
