"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Flex } from "@/components/layout";
import { Typography, Spinner, Button } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type { ProjectAgentListRow } from "@/schemas/project.schema";
import { toast } from "@/components/ui/Toast/Toast";
import { notifyCollaborationUpdated } from "@/utils/agent/collaboration-events";
import { DASHBOARD_BASE_PATH } from "@/lib/routing/dashboard-route";
import { CardCollaborationSettings } from "../CardCollaborationSettings/CardCollaborationSettings";
import { CardCollaborationMembers } from "../CardCollaborationMembers/CardCollaborationMembers";
import { CardCollaborationAllowList } from "../CardCollaborationAllowList/CardCollaborationAllowList";
import { useI18n } from "@/lib/i18n";
import styles from "./ClientCollaborationPage.module.css";

export function ClientCollaborationPage() {
  const { t } = useI18n();
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
      setLoadError(
        err instanceof Error ? err.message : t("agent.collaboration.loadError"),
      );
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
      toast.success(
        t("agent.collaboration.saved"),
        t("agent.collaboration.savedDetail"),
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("agent.collaboration.saveFailed"));
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
      ? t("agent.collaboration.needMember")
      : null;

  const enabledAgentCount = agents.filter((a) => a.enabled).length;
  const needsMoreAgents = enabled && enabledAgentCount < 2;

  return (
    <div className={styles.root}>
      {agents.length < 2 ? (
        <Typography variant="small" className={styles.hintBanner}>
          {t("agent.collaboration.needTwoAgents")}{" "}
          <Link
            href={`${DASHBOARD_BASE_PATH}/agent`}
            className={styles.inlineLink}
          >
            {t("agent.collaboration.goToAgents")}
          </Link>
        </Typography>
      ) : null}

      {needsMoreAgents ? (
        <Typography variant="small" className={styles.hintBanner}>
          {t("agent.collaboration.bestWithTwo")}
        </Typography>
      ) : null}

      <CardCollaborationSettings
        enabled={enabled}
        onEnabledChange={handleToggleEnabled}
      />

      <CardCollaborationMembers
        enabled={enabled}
        agents={agents}
        filteredAgents={filteredAgents}
        memberSlugs={memberSlugs}
        searchQuery={searchQuery}
        validationError={validationError}
        saveError={saveError}
        onSearchChange={setSearchQuery}
        onMemberToggle={handleMemberToggle}
        onSelectAllEnabled={handleSelectAllEnabled}
      />

      <CardCollaborationAllowList
        enabled={enabled}
        dirty={dirty}
        memberSlugs={memberSlugs}
        effectiveAllow={effectiveAllow}
        agents={agents}
      />

      <Flex justify="end" className={styles.actions}>
        <Button
          type="button"
          disabled={!projectId || saving || Boolean(validationError) || !dirty}
          onClick={() => void handleSave()}
        >
          {saving ? t("agent.collaboration.saving") : t("agent.collaboration.saveChanges")}
        </Button>
      </Flex>
    </div>
  );
}
