"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import Link from "next/link";
import { Plus, Bot, Users } from "lucide-react";
import { DASHBOARD_BASE_PATH } from "@/lib/dashboard-route";
import { SearchItem } from "@/components/dashboard";
import { CardAgent } from "../CardAgent/CardAgent";
import styles from "./ClientAgentPage.module.css";
import type { AgentItem } from "../../agentMockData";
import { ModalTemplate } from "../ModalTemplate/ModalTemplate";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type { ProjectAgentListRow } from "@/schemas/project.schema";
import { COLLABORATION_UPDATED_EVENT } from "@/lib/collaboration-events";

function toAgentItem(row: ProjectAgentListRow): AgentItem {
  return {
    id: row.slug,
    name: row.name,
    avatar: row.avatar,
    description: row.description,
    model: row.model,
    skillsCount: 0,
    isActive: row.enabled,
    inCollaboration: row.inCollaboration,
  };
}

export default function ClientAgentPage() {
  const router = useRouter();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [isModalTemplateOpen, setIsModalTemplateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<"all" | "collaboration">("all");
  const [collaborationEnabled, setCollaborationEnabled] = useState(false);

  useEffect(() => {
    void fetchProjects({ silent: true });
  }, [fetchProjects]);

  const loadList = useCallback(async () => {
    if (!projectId) {
      setAgents([]);
      setCollaborationEnabled(false);
      return;
    }
    const [rows, collaboration] = await Promise.all([
      projectApi.listAgents(projectId),
      projectApi.getCollaboration(projectId),
    ]);
    setCollaborationEnabled(collaboration.enabled);
    setAgents(rows.map(toAgentItem));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setAgents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void loadList()
      .catch((err) => {
        setAgents([]);
        setError(err instanceof Error ? err.message : "Cannot load agent list");
      })
      .finally(() => setLoading(false));
  }, [projectId, loadList]);

  useEffect(() => {
    const refresh = () => {
      void loadList().catch(() => undefined);
    };
    window.addEventListener(COLLABORATION_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(COLLABORATION_UPDATED_EVENT, refresh);
  }, [loadList]);

  useEffect(() => {
    if (!collaborationEnabled && listFilter === "collaboration") {
      setListFilter("all");
    }
  }, [collaborationEnabled, listFilter]);

  const reloadAgents = useCallback(async () => {
    if (!projectId) return;
    try {
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load agent list");
    }
  }, [projectId, loadList]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      if (listFilter === "collaboration" && !agent.inCollaboration) {
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
  }, [agents, searchQuery, listFilter]);

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
        setError(err instanceof Error ? err.message : "Duplicate agent failed");
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
        setError(err instanceof Error ? err.message : "Delete agent failed");
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
            placeholder="Search agent..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
          {collaborationEnabled ? (
            <Flex align="center" gap={2} className={styles.filterGroup}>
              <button
                type="button"
                className={`${styles.filterChip} ${
                  listFilter === "all" ? styles.filterChipActive : ""
                }`}
                onClick={() => setListFilter("all")}
              >
                All ({agents.length})
              </button>
              <button
                type="button"
                className={`${styles.filterChip} ${
                  listFilter === "collaboration" ? styles.filterChipActive : ""
                }`}
                onClick={() => setListFilter("collaboration")}
              >
                <Users size={14} aria-hidden />
                Collaboration ({collaborationCount})
              </button>
            </Flex>
          ) : null}
        </Flex>

        <Button onClick={handleCreateNew} disabled={!projectId}>
          <Plus size={18} />
          Create New Agent
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
            No agents yet
          </Typography>
          <Typography
            variant="small"
            color="muted"
            className={styles.emptyDesc}
          >
            Create your first agent, then configure collaboration so they can
            work together.
          </Typography>
          <Button onClick={handleCreateNew} disabled={!projectId}>
            <Plus size={18} />
            Create first agent
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
            {listFilter === "collaboration"
              ? "No agents in collaboration"
              : "No matching agents"}
          </Typography>
          <Typography
            variant="small"
            color="muted"
            className={styles.emptyDesc}
          >
            {listFilter === "collaboration"
              ? "Add agents on the Collaboration page or clear the filter."
              : "Try a different search query."}
          </Typography>
          {listFilter === "collaboration" ? (
            <Link
              href={`${DASHBOARD_BASE_PATH}/agent/collaboration`}
              className={styles.collaborationLink}
            >
              Open collaboration settings
            </Link>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSearchQuery("")}
            >
              Clear search
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
            <AlertDialogTitle>Delete agent permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The AI assistant and all related
              configuration will be removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={confirmDelete}>
              Yes, delete
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
