"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Flex } from "@/components/layout";
import { Typography, Switch, Checkbox, Avatar, Card, Spinner } from "@/components/ui";
import { SearchItem } from "@/components/dashboard";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type { AgentFormInput } from "@/schemas/agentForm.schema";
import type { ProjectAgentListRow } from "@/schemas/project.schema";
import styles from "./CardTeam.module.css";

interface CardTeamProps {
  /** Slug of the agent being edited — excluded from the allow list. */
  currentAgentSlug?: string;
}

export function CardTeam({ currentAgentSlug }: CardTeamProps) {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const { watch, setValue, formState: { errors } } = useFormContext<AgentFormInput>();

  const teamEnabled = watch("teamEnabled");
  const allowedAgentSlugs = watch("allowedAgentSlugs");

  const [agents, setAgents] = useState<ProjectAgentListRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setAgents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    void projectApi
      .listAgents(projectId)
      .then((rows) => setAgents(rows))
      .catch((err) => {
        setAgents([]);
        setLoadError(
          err instanceof Error ? err.message : "Could not load agent list",
        );
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const peerAgents = useMemo(() => {
    if (!currentAgentSlug) return agents;
    return agents.filter((a) => a.slug !== currentAgentSlug);
  }, [agents, currentAgentSlug]);

  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return peerAgents;
    return peerAgents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(q) ||
        agent.description.toLowerCase().includes(q) ||
        agent.slug.toLowerCase().includes(q),
    );
  }, [peerAgents, searchQuery]);

  const handleTeamToggle = (checked: boolean) => {
    setValue("teamEnabled", checked, { shouldDirty: true, shouldValidate: true });
  };

  const handleAgentToggle = (slug: string, checked: boolean) => {
    const next = checked
      ? [...allowedAgentSlugs, slug]
      : allowedAgentSlugs.filter((s) => s !== slug);
    setValue("allowedAgentSlugs", next, { shouldDirty: true, shouldValidate: true });
  };

  const teamError =
    typeof errors.allowedAgentSlugs?.message === "string"
      ? errors.allowedAgentSlugs.message
      : undefined;

  const listDisabled = !teamEnabled;

  return (
    <Card className={styles.card} disableHover>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <Typography variant="p" weight="bold">
            Allow calling other agents (Sub-agents)
          </Typography>
          <Typography variant="small" color="muted">
            Enable this agent to delegate work to other agents in the project.
          </Typography>
        </div>
        <Switch checked={teamEnabled} onCheckedChange={handleTeamToggle} />
      </div>

      <SearchItem
        id="team-agent-search"
        placeholder="Search agents in project..."
        value={searchQuery}
        onChange={setSearchQuery}
        className={styles.search}
      />

      <div
        className={`${styles.listPanel} ${listDisabled ? styles.listPanelDisabled : ""}`}
      >
        <Typography variant="small" weight="medium" className={styles.listTitle}>
          Allowed agents
          {teamEnabled && allowedAgentSlugs.length > 0
            ? ` (${allowedAgentSlugs.length})`
            : ""}
        </Typography>

        {loading ? (
          <Flex align="center" justify="center" className={styles.listState}>
            <Spinner />
          </Flex>
        ) : loadError ? (
          <Typography variant="small" color="muted" className={styles.listState}>
            {loadError}
          </Typography>
        ) : peerAgents.length === 0 ? (
          <Typography variant="small" color="muted" className={styles.listState}>
            No other agents in this project yet.
          </Typography>
        ) : filteredAgents.length === 0 ? (
          <Typography variant="small" color="muted" className={styles.listState}>
            No matching agents found.
          </Typography>
        ) : (
          <ul className={styles.list}>
            {filteredAgents.map((agent) => {
              const checked = allowedAgentSlugs.includes(agent.slug);
              const checkboxId = `team-agent-${agent.slug}`;

              return (
                <li key={agent.slug} className={styles.listItem}>
                  <Flex align="center" gap={3} className={styles.agentInfo}>
                    <Avatar src="" fallback={agent.avatar} size="sm" />
                    <Typography variant="p" weight="medium" className={styles.agentName}>
                      {agent.name}
                    </Typography>
                  </Flex>
                  <Checkbox
                    id={checkboxId}
                    size="sm"
                    checked={checked}
                    disabled={listDisabled || !agent.enabled}
                    onCheckedChange={(val) =>
                      handleAgentToggle(agent.slug, val === true)
                    }
                    aria-label={`Allow calling ${agent.name}`}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!teamEnabled ? (
        <Typography variant="small" color="muted" className={styles.hint}>
          Turn on the switch above to select allowed agents.
        </Typography>
      ) : null}

      {teamError ? (
        <Typography variant="small" className={styles.fieldError}>
          {teamError}
        </Typography>
      ) : null}
    </Card>
  );
}
