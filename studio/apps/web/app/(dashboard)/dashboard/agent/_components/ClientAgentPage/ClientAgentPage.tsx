"use client";

import { Plus, Bot, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import styles from "./ClientAgentPage.module.css";
import { CardAgent } from "../CardAgent/CardAgent";
import { ModalTemplate } from "../ModalTemplate/ModalTemplate";
import { SearchItem } from "@/components/dashboard";
import { Flex, Grid } from "@/components/layout";
import {
  Button,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  Spinner,
  Typography,
} from "@/components/ui";
import { chatApi } from "@/lib/api/chat";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";
import { DASHBOARD_BASE_PATH } from "@/lib/routing/dashboard-route";
import { useProjectStore } from "@/stores/project.store";
import { COLLABORATION_UPDATED_EVENT } from "@/utils/agent/collaboration-events";
import { resolveModelDisplayName } from "@/utils/chat/model-catalog";

import type { AgentItem } from "../../agentMockData";
import type { ChatModelsResponse } from "@/lib/api/chat";
import type { ProjectAgentListRow } from "@/schemas/project.schema";

function toAgentItem(
  row: ProjectAgentListRow,
  modelCatalog: ChatModelsResponse | null,
): AgentItem {
  return {
    id: row.slug,
    name: row.name,
    avatar: row.avatar,
    description: row.description,
    model: resolveModelDisplayName(modelCatalog, row.model),
    skillsCount: row.skillsCount,
    isActive: row.enabled,
    inCollaboration: row.inCollaboration,
  };
}

export function ClientAgentPage() {
  const { t } = useI18n();
  const router = useRouter();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [isModalTemplateOpen, setIsModalTemplateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<"all" | "collaboration">("all");
  const [collaborationEnabled, setCollaborationEnabled] = useState(false);
  const [trackedProjectId, setTrackedProjectId] = useState(projectId);
  const [loading, setLoading] = useState(Boolean(projectId));

  if (projectId !== trackedProjectId) {
    setTrackedProjectId(projectId);
    setLoading(Boolean(projectId));
    setError(null);
    if (!projectId) {
      setAgents([]);
      setCollaborationEnabled(false);
    }
  }

  const effectiveListFilter =
    !collaborationEnabled && listFilter === "collaboration"
      ? "all"
      : listFilter;

  useEffect(() => {
    void fetchProjects({ silent: true });
  }, [fetchProjects]);

  const loadList = useCallback(async () => {
    if (!projectId) return;
    const [rows, collaboration, modelCatalog] = await Promise.all([
      projectApi.listAgents(projectId),
      projectApi.getCollaboration(projectId),
      chatApi.listModels(projectId).catch(() => null),
    ]);
    setCollaborationEnabled(collaboration.enabled);
    setAgents(rows.map((row) => toAgentItem(row, modelCatalog)));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    void (async () => {
      await Promise.resolve();
      try {
        await loadList();
      } catch (err) {
        setAgents([]);
        setError(
          err instanceof Error ? err.message : t("agent.list.errors.loadList"),
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, loadList, t]);

  useEffect(() => {
    const refresh = () => {
      void loadList().catch(() => undefined);
    };
    window.addEventListener(COLLABORATION_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(COLLABORATION_UPDATED_EVENT, refresh);
  }, [loadList]);

  const reloadAgents = useCallback(async () => {
    if (!projectId) return;
    try {
      await loadList();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("agent.list.errors.loadList"),
      );
    }
  }, [projectId, loadList, t]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      if (effectiveListFilter === "collaboration" && !agent.inCollaboration) {
        return false;
      }
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        agent.name.toLowerCase().includes(q) ||
        agent.description.toLowerCase().includes(q) ||
        agent.id.toLowerCase().includes(q)
      );
    });
  }, [agents, searchQuery, effectiveListFilter]);

  const collaborationCount = useMemo(
    () => agents.filter((a) => a.inCollaboration).length,
    [agents],
  );

  const handleCreateNew = () => {
    setIsModalTemplateOpen(true);
  };

  const handleEdit = (agentId: string) => {
    router.push(`/dashboard/agent/${agentId}`);
  };

  const handleDuplicate = (agent: AgentItem) => {
    if (!projectId) return;
    void projectApi
      .duplicateAgent(projectId, agent.id)
      .then(() => reloadAgents())
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : t("agent.list.errors.duplicate"),
        );
      });
  };

  const handleDelete = (agentId: string) => {
    setDeleteAgentId(agentId);
  };

  const confirmDelete = () => {
    if (!deleteAgentId || !projectId) return;
    void projectApi
      .deleteAgent(projectId, deleteAgentId)
      .then(() => reloadAgents())
      .then(() => {
        setDeleteAgentId(null);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : t("agent.list.errors.delete"),
        );
      });
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" className={styles.root}>
        <Spinner />
      </Flex>
    );
  }

  return (
    <Flex direction="column" className={styles.root}>
      {error && (
        <Typography variant="small" color="muted">
          {error}
        </Typography>
      )}

      <Flex
        justify="between"
        align="center"
        wrap="wrap"
        className={styles.toolbar}
      >
        <Flex align="center" gap={3} className={styles.toolbarStart}>
          <SearchItem
            id="agent-search"
            placeholder={t("agent.list.searchPlaceholder")}
            value={searchQuery}
            onChange={setSearchQuery}
          />
          {collaborationEnabled ? (
            <Flex align="center" gap={2} className={styles.filterGroup}>
              <button
                type="button"
                className={`${styles.filterChip} ${
                  effectiveListFilter === "all" ? styles.filterChipActive : ""
                }`}
                onClick={() => setListFilter("all")}
              >
                {t("agent.list.filterAll", { count: String(agents.length) })}
              </button>
              <button
                type="button"
                className={`${styles.filterChip} ${
                  effectiveListFilter === "collaboration"
                    ? styles.filterChipActive
                    : ""
                }`}
                onClick={() => setListFilter("collaboration")}
              >
                <Users size={14} aria-hidden />
                {t("agent.list.filterCollaboration", {
                  count: String(collaborationCount),
                })}
              </button>
            </Flex>
          ) : null}
        </Flex>

        <Button onClick={handleCreateNew} disabled={!projectId}>
          <Plus size={18} />
          {t("agent.list.createNew")}
        </Button>
      </Flex>

      {filteredAgents.length > 0 ? (
        <Grid
          columns="repeat(auto-fill, minmax(320px, 1fr))"
          gap="var(--space-5)"
          className={styles.grid}
        >
          {filteredAgents.map((agent) => (
            <CardAgent
              key={agent.id}
              agent={agent}
              onClick={() => handleEdit(agent.id)}
              onEdit={() => handleEdit(agent.id)}
              onDuplicate={() => handleDuplicate(agent)}
              onDelete={() => handleDelete(agent.id)}
            />
          ))}
        </Grid>
      ) : agents.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          className={styles.emptyState}
        >
          <Bot size={48} className={styles.emptyIcon} />
          <Typography variant="h3" className={styles.emptyTitle}>
            {t("agent.list.emptyTitle")}
          </Typography>
          <Typography
            variant="small"
            color="muted"
            className={styles.emptyDesc}
          >
            {t("agent.list.emptyDescription")}
          </Typography>
          <Button onClick={handleCreateNew} disabled={!projectId}>
            <Plus size={18} />
            {t("agent.list.createFirst")}
          </Button>
        </Flex>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          className={styles.emptyState}
        >
          <Bot size={48} className={styles.emptyIcon} />
          <Typography variant="h3" className={styles.emptyTitle}>
            {effectiveListFilter === "collaboration"
              ? t("agent.list.noCollaborationTitle")
              : t("agent.list.noMatchTitle")}
          </Typography>
          <Typography
            variant="small"
            color="muted"
            className={styles.emptyDesc}
          >
            {effectiveListFilter === "collaboration"
              ? t("agent.list.noCollaborationDescription")
              : t("agent.list.noMatchDescription")}
          </Typography>
          {effectiveListFilter === "collaboration" ? (
            <Link
              href={`${DASHBOARD_BASE_PATH}/agent/collaboration`}
              className={styles.collaborationLink}
            >
              {t("agent.list.openCollaboration")}
            </Link>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSearchQuery("")}
            >
              {t("agent.list.clearSearch")}
            </Button>
          )}
        </Flex>
      )}

      <AlertDialog
        open={!!deleteAgentId}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeleteAgentId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("agent.list.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("agent.list.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("agent.list.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={confirmDelete}>
              {t("agent.list.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ModalTemplate
        isOpen={isModalTemplateOpen}
        onClose={() => setIsModalTemplateOpen(false)}
        projectId={projectId}
      />
    </Flex>
  );
}
