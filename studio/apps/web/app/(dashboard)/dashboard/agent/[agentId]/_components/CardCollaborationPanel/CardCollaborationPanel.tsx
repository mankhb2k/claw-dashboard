"use client";

import { Users, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./CardCollaborationPanel.module.css";
import { Flex } from "@/components/layout";
import { Typography, Card, Spinner } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { DASHBOARD_BASE_PATH } from "@/lib/routing/dashboard-route";
import { useProjectStore } from "@/stores/project.store";

import type { ProjectCollaboration } from "@/schemas/project.schema";

const COLLABORATION_HREF = `${DASHBOARD_BASE_PATH}/agent/collaboration`;

interface CardCollaborationPanelProps {
  /** Slug of the agent being edited; omitted on create flow. */
  agentSlug?: string;
}

export function CardCollaborationPanel({ agentSlug }: CardCollaborationPanelProps) {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const [collaboration, setCollaboration] = useState<ProjectCollaboration | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [trackedProjectId, setTrackedProjectId] = useState(projectId);

  if (projectId !== trackedProjectId) {
    setTrackedProjectId(projectId);
    setCollaboration(null);
    setLoading(Boolean(projectId));
  }

  useEffect(() => {
    if (!projectId) {
      return;
    }
    void projectApi
      .getCollaboration(projectId)
      .then(setCollaboration)
      .catch(() => setCollaboration(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  const isMember =
    Boolean(agentSlug) &&
    Boolean(collaboration?.enabled) &&
    collaboration?.memberSlugs.includes(agentSlug ?? "") === true;

  const peerMembers =
    collaboration?.enabled && collaboration.memberSlugs.length > 0
      ? collaboration.memberSlugs.filter((slug) => slug !== agentSlug)
      : [];

  return (
    <Card className={styles.card} disableHover>
      <Flex align="center" gap={2} className={styles.titleRow}>
        <Users size={16} aria-hidden />
        <Typography variant="p" weight="bold">
          Work with other agents
        </Typography>
      </Flex>

      <Typography variant="small" color="muted">
        Collaboration permissions are configured per project. Use Instructions to
        describe when this agent should delegate via{" "}
        <code className={styles.inlineCode}>sessions_send</code> or{" "}
        <code className={styles.inlineCode}>sessions_spawn</code>.
      </Typography>

      {loading ? (
        <Flex align="center" gap={2} className={styles.loadingRow}>
          <Spinner />
          <Typography variant="small" color="muted">
            Loading collaboration…
          </Typography>
        </Flex>
      ) : !collaboration?.enabled ? (
        <Typography variant="small" color="muted">
          Collaboration is off for this project. Enable it to let agents message
          each other.
        </Typography>
      ) : agentSlug && !isMember ? (
        <Typography variant="small" color="muted">
          This agent is not in the collaboration pool yet.
        </Typography>
      ) : peerMembers.length > 0 ? (
        <div>
          <Typography variant="small" weight="medium" className={styles.peersLabel}>
            Peers in collaboration
          </Typography>
          <div className={styles.chips}>
            {peerMembers.map((slug) => (
              <span key={slug} className={styles.chip}>
                {slug}
              </span>
            ))}
          </div>
        </div>
      ) : isMember ? (
        <Typography variant="small" color="muted">
          No other members selected yet. Add peers on the Collaboration page.
        </Typography>
      ) : null}

      <Link href={COLLABORATION_HREF} className={styles.configureLink}>
        <ExternalLink size={14} aria-hidden />
        Configure collaboration
      </Link>
    </Card>
  );
}
