"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Flex } from "@/components/layout";
import { Typography } from "@/components/ui";
import { Users } from "lucide-react";
import { DASHBOARD_BASE_PATH } from "@/lib/dashboard-route";
import { projectApi } from "@/lib/api/project";
import { COLLABORATION_UPDATED_EVENT } from "@/lib/collaboration-events";
import { useProjectStore } from "@/stores/project.store";
import styles from "./PreviewCollaborationBanner.module.css";

interface PreviewCollaborationBannerProps {
  agentSlug: string;
}

export function PreviewCollaborationBanner({
  agentSlug,
}: PreviewCollaborationBannerProps) {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const [inCollaboration, setInCollaboration] = useState(false);
  const [collaborationOn, setCollaborationOn] = useState(false);

  useEffect(() => {
    if (!projectId || !agentSlug) return;

    const load = () => {
      void projectApi
        .getCollaboration(projectId)
        .then((data) => {
          setCollaborationOn(data.enabled);
          setInCollaboration(
            data.enabled && data.memberSlugs.includes(agentSlug),
          );
        })
        .catch(() => {
          setCollaborationOn(false);
          setInCollaboration(false);
        });
    };

    load();
    window.addEventListener(COLLABORATION_UPDATED_EVENT, load);
    return () => window.removeEventListener(COLLABORATION_UPDATED_EVENT, load);
  }, [projectId, agentSlug]);

  if (!collaborationOn) {
    return (
      <Flex align="center" gap={2} className={styles.banner}>
        <Users size={14} aria-hidden />
        <Typography variant="small" color="muted">
          Collaboration off —{" "}
          <Link
            href={`${DASHBOARD_BASE_PATH}/agent/collaboration`}
            className={styles.link}
          >
            Configure
          </Link>
        </Typography>
      </Flex>
    );
  }

  return (
    <Flex align="center" gap={2} className={styles.banner}>
      <Users size={14} aria-hidden />
      <Typography variant="small" color="muted">
        {inCollaboration
          ? "In collaboration pool"
          : "Not in collaboration pool"}{" "}
        —{" "}
        <Link
          href={`${DASHBOARD_BASE_PATH}/agent/collaboration`}
          className={styles.link}
        >
          Manage
        </Link>
      </Typography>
    </Flex>
  );
}
