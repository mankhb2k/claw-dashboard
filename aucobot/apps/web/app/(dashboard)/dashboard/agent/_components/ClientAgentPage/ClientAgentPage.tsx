"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { Plus, Bot } from "lucide-react";
import { SearchItem } from "@/components/dashboard";
import { CardAgent } from "../CardAgent/CardAgent";
import styles from "./ClientAgentPage.module.css";
import type { AgentItem } from "../../agentMockData";
import { ModalTemplate } from "../ModalTemplate/ModalTemplate";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type { ProjectAgentListRow } from "@/schemas/project.schema";

function toAgentItem(row: ProjectAgentListRow): AgentItem {
  return {
    id: row.slug,
    name: row.name,
    avatar: row.avatar,
    description: row.description,
    model: row.model,
    skillsCount: 0,
    isActive: row.enabled,
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

  useEffect(() => {
    void fetchProjects({ silent: true });
  }, [fetchProjects]);

  useEffect(() => {
    if (!projectId) {
      setAgents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void projectApi
      .listAgents(projectId)
      .then((rows) => setAgents(rows.map(toAgentItem)))
      .catch((err) => {
        setAgents([]);
        setError(err instanceof Error ? err.message : "Cannot load agent list");
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const filteredAgents = useMemo(() => {
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [agents, searchQuery]);

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
      .then(() => projectApi.listAgents(projectId))
      .then((rows) => setAgents(rows.map(toAgentItem)))
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
      .then(() => projectApi.listAgents(projectId))
      .then((rows) => {
        setAgents(rows.map(toAgentItem));
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

      <Flex justify="between" align="center" className={styles.toolbar}>
        <SearchItem
          id="agent-search"
          placeholder="Search agent..."
          value={searchQuery}
          onChange={setSearchQuery}
        />

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
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          className={styles.emptyState}
        >
          <Bot size={48} className={styles.emptyIcon} />
          <Typography variant="h3" className={styles.emptyTitle}>
            No Agent found
          </Typography>
          <Typography
            variant="small"
            color="muted"
            className={styles.emptyDesc}
          >
            No AI agent found matching your search query. Try changing the query
            or creating a new agent from scratch.
          </Typography>
          <Button onClick={handleCreateNew} disabled={!projectId}>
            <Plus size={18} />
            Create First Agent
          </Button>
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
