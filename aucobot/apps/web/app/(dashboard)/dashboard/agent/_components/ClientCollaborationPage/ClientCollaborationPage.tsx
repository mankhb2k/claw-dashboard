"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Flex } from "@/components/layout";
import {
  Typography,
  Switch,
  Checkbox,
  Avatar,
  Card,
  Spinner,
  Button,
} from "@/components/ui";
import { SearchItem } from "@/components/dashboard";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type { ProjectAgentListRow } from "@/schemas/project.schema";
import { toast } from "@/components/ui/Toast/Toast";
import { notifyCollaborationUpdated } from "@/lib/collaboration-events";
import Link from "next/link";
import { DASHBOARD_BASE_PATH } from "@/lib/dashboard-route";
import styles from "./ClientCollaborationPage.module.css";

export default function ClientCollaborationPage() {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const [agents, setAgents] = useState<ProjectAgentListRow[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [memberSlugs, setMemberSlugs] = useState<string[]>([]);
  const [effectiveAllow, setEffectiveAllow] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    void fetchProjects({ silent: true });
  }, [fetchProjects]);

  const load = useCallback(async () => {
    if (!projectId) {
      setAgents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const [agentRows, collaboration] = await Promise.all([
        projectApi.listAgents(projectId),
        projectApi.getCollaboration(projectId),
      ]);
      setAgents(agentRows);
      setEnabled(collaboration.enabled);
      setMemberSlugs(collaboration.memberSlugs);
      setEffectiveAllow(collaboration.effectiveAllow);
      setDirty(false);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load collaboration");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(q) ||
        agent.description.toLowerCase().includes(q) ||
        agent.slug.toLowerCase().includes(q),
    );
  }, [agents, searchQuery]);

  const listDisabled = !enabled;

  const handleToggleEnabled = (checked: boolean) => {
    setEnabled(checked);
    setDirty(true);
    setSaveError(null);
  };

  const handleMemberToggle = (slug: string, checked: boolean) => {
    const next = checked
      ? [...memberSlugs, slug]
      : memberSlugs.filter((s) => s !== slug);
    setMemberSlugs(next);
    setDirty(true);
    setSaveError(null);
  };

  const handleSelectAllEnabled = () => {
    const slugs = agents.filter((a) => a.enabled).map((a) => a.slug);
    setMemberSlugs(slugs);
    setDirty(true);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await projectApi.updateCollaboration(projectId, {
        enabled,
        memberSlugs,
      });
      setEnabled(result.enabled);
      setMemberSlugs(result.memberSlugs);
      setEffectiveAllow(result.effectiveAllow);
      setDirty(false);
      notifyCollaborationUpdated();
      toast.success("Collaboration saved", "Gateway allow list updated.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" className={styles.loading}>
        <Spinner />
      </Flex>
    );
  }

  if (loadError) {
    return (
      <Typography variant="small" color="muted">
        {loadError}
      </Typography>
    );
  }

  const validationError =
    enabled && memberSlugs.length === 0
      ? "Select at least one agent when collaboration is enabled"
      : null;

  const enabledAgentCount = agents.filter((a) => a.enabled).length;
  const needsMoreAgents = enabled && enabledAgentCount < 2;

  return (
    <div className={styles.root}>
      {agents.length < 2 ? (
        <Typography variant="small" className={styles.hintBanner}>
          Create at least two agents before enabling collaboration.{" "}
          <Link href={`${DASHBOARD_BASE_PATH}/agent`} className={styles.inlineLink}>
            Go to agents
          </Link>
        </Typography>
      ) : null}

      {needsMoreAgents ? (
        <Typography variant="small" className={styles.hintBanner}>
          Collaboration works best with two or more enabled agents in the pool.
        </Typography>
      ) : null}

      <Card className={styles.card} disableHover>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <Typography variant="p" weight="bold">
              Agent collaboration
            </Typography>
            <Typography variant="small" color="muted">
              Members can message and spawn each other. OpenClaw uses one shared
              allow list for the project (not one-way permissions).
            </Typography>
          </div>
          <Switch checked={enabled} onCheckedChange={handleToggleEnabled} />
        </div>

        <Flex justify="between" align="center" gap={3} className={styles.toolbar}>
          <SearchItem
            id="collaboration-agent-search"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={setSearchQuery}
            className={styles.search}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={listDisabled || agents.every((a) => !a.enabled)}
            onClick={handleSelectAllEnabled}
          >
            Select all enabled
          </Button>
        </Flex>

        <div
          className={`${styles.listPanel} ${listDisabled ? styles.listPanelDisabled : ""}`}
        >
          <Typography variant="small" weight="medium" className={styles.listTitle}>
            Members
            {enabled && memberSlugs.length > 0 ? ` (${memberSlugs.length})` : ""}
          </Typography>

          {agents.length === 0 ? (
            <Typography variant="small" color="muted" className={styles.listState}>
              No agents in this project yet. Create agents first.
            </Typography>
          ) : filteredAgents.length === 0 ? (
            <Typography variant="small" color="muted" className={styles.listState}>
              No matching agents found.
            </Typography>
          ) : (
            <ul className={styles.list}>
              {filteredAgents.map((agent) => {
                const checked = memberSlugs.includes(agent.slug);
                const checkboxId = `collaboration-member-${agent.slug}`;

                return (
                  <li key={agent.slug} className={styles.listItem}>
                    <Flex align="center" gap={3} className={styles.agentInfo}>
                      <Avatar src="" fallback={agent.avatar} size="sm" />
                      <div className={styles.agentMeta}>
                        <Typography variant="p" weight="medium">
                          {agent.name}
                        </Typography>
                        <Typography variant="small" color="muted">
                          {agent.slug}
                        </Typography>
                      </div>
                    </Flex>
                    <Checkbox
                      id={checkboxId}
                      size="sm"
                      checked={checked}
                      disabled={listDisabled || !agent.enabled}
                      onCheckedChange={(val) =>
                        handleMemberToggle(agent.slug, val === true)
                      }
                      aria-label={`Include ${agent.name} in collaboration`}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!enabled ? (
          <Typography variant="small" color="muted">
            Turn on collaboration to select members.
          </Typography>
        ) : null}

        {validationError ? (
          <Typography variant="small" className={styles.fieldError}>
            {validationError}
          </Typography>
        ) : null}

        {saveError ? (
          <Typography variant="small" className={styles.fieldError}>
            {saveError}
          </Typography>
        ) : null}
      </Card>

      <Card className={styles.previewCard} disableHover>
        <Typography variant="small" weight="medium">
          Gateway allow list (preview)
        </Typography>
        <Typography variant="small" color="muted" className={styles.previewHint}>
          {enabled
            ? "After save, these agents (plus main) can use agent-to-agent tools."
            : "Collaboration is off — allow list will be empty."}
        </Typography>
        <div className={styles.chips}>
          {(enabled ? effectiveAllow : []).length === 0 ? (
            <Typography variant="small" color="muted">
              —
            </Typography>
          ) : (
            (dirty
              ? ["main", ...memberSlugs.filter((slug) =>
                  agents.some((a) => a.slug === slug && a.enabled),
                )].sort()
              : effectiveAllow
            ).map((slug) => (
              <span key={slug} className={styles.chip}>
                {slug}
              </span>
            ))
          )}
        </div>
      </Card>

      <Flex justify="end" className={styles.actions}>
        <Button
          type="button"
          disabled={!projectId || saving || Boolean(validationError) || !dirty}
          onClick={() => void handleSave()}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Flex>
    </div>
  );
}
