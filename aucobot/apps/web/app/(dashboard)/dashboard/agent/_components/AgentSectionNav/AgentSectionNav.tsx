"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Tabs, type TabItem } from "@/components/ui";
import { DASHBOARD_BASE_PATH, dashboardPath } from "@/lib/routing/dashboard-route";
import { projectApi } from "@/lib/api/project";
import { COLLABORATION_UPDATED_EVENT } from "@/utils/agent/collaboration-events";
import { useProjectStore } from "@/stores/project.store";
import { useI18n } from "@/lib/i18n";
import styles from "./AgentSectionNav.module.css";

const AGENTS_HREF = `${DASHBOARD_BASE_PATH}/agent`;
const COLLABORATION_HREF = `${DASHBOARD_BASE_PATH}/agent/collaboration`;
const SCHEDULES_HREF = dashboardPath("agent", "schedules");
const HEARTBEAT_HREF = dashboardPath("agent", "heartbeat");

export function AgentSectionNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const [memberCount, setMemberCount] = useState(0);
  const [collaborationOn, setCollaborationOn] = useState(false);
  const [failedCount, setFailedCount] = useState(0);

  const isCollaboration = pathname === COLLABORATION_HREF;
  const isSchedules =
    pathname === SCHEDULES_HREF || pathname.startsWith(`${SCHEDULES_HREF}/`);
  const isHeartbeat =
    pathname === HEARTBEAT_HREF || pathname.startsWith(`${HEARTBEAT_HREF}/`);

  const activeValue = isHeartbeat
    ? "heartbeat"
    : isSchedules
      ? "schedules"
      : isCollaboration
        ? "collaboration"
        : "agents";

  useEffect(() => {
    if (!projectId) {
      setMemberCount(0);
      setCollaborationOn(false);
      setFailedCount(0);
      return;
    }

    const loadCollaboration = () => {
      void projectApi
        .getCollaboration(projectId)
        .then((data) => {
          setCollaborationOn(data.enabled);
          setMemberCount(data.memberSlugs.length);
        })
        .catch(() => {
          setCollaborationOn(false);
          setMemberCount(0);
        });
    };

    const loadCron = () => {
      void projectApi
        .getCronSummary(projectId)
        .then((summary) => setFailedCount(summary.failedCount ?? 0))
        .catch(() => setFailedCount(0));
    };

    loadCollaboration();
    loadCron();
    window.addEventListener(COLLABORATION_UPDATED_EVENT, loadCollaboration);
    return () =>
      window.removeEventListener(
        COLLABORATION_UPDATED_EVENT,
        loadCollaboration,
      );
  }, [projectId, pathname]);

  const items = useMemo<TabItem[]>(
    () => [
      { value: "agents", label: t("agent.sectionNav.agents"), href: AGENTS_HREF },
      {
        value: "collaboration",
        label: t("agent.sectionNav.collaboration"),
        href: COLLABORATION_HREF,
        badge: collaborationOn && memberCount > 0 ? memberCount : undefined,
      },
      {
        value: "schedules",
        label: t("agent.sectionNav.schedules"),
        href: SCHEDULES_HREF,
        badge: failedCount > 0 ? failedCount : undefined,
        badgeTone: failedCount > 0 ? "danger" : undefined,
      },
      { value: "heartbeat", label: t("agent.sectionNav.heartbeat"), href: HEARTBEAT_HREF },
    ],
    [collaborationOn, memberCount, failedCount, t],
  );

  return (
    <Tabs
      items={items}
      value={activeValue}
      variant="section"
      showIndicator
      className={styles.root}
      aria-label={t("agent.sectionNav.ariaLabel")}
    />
  );
}
