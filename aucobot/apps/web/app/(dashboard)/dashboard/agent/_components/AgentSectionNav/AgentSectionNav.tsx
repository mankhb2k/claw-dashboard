"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_BASE_PATH, dashboardPath } from "@/lib/dashboard-route";
import { projectApi } from "@/lib/api/project";
import { COLLABORATION_UPDATED_EVENT } from "@/lib/collaboration-events";
import { useProjectStore } from "@/stores/project.store";
import styles from "./AgentSectionNav.module.css";

const AGENTS_HREF = `${DASHBOARD_BASE_PATH}/agent`;
const COLLABORATION_HREF = `${DASHBOARD_BASE_PATH}/agent/collaboration`;
const SCHEDULES_HREF = dashboardPath("agent", "schedules");

export function AgentSectionNav() {
  const pathname = usePathname();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const [memberCount, setMemberCount] = useState(0);
  const [collaborationOn, setCollaborationOn] = useState(false);
  const [failedCount, setFailedCount] = useState(0);

  const navRef = useRef<HTMLElement>(null);
  const agentsRef = useRef<HTMLAnchorElement>(null);
  const collabRef = useRef<HTMLAnchorElement>(null);
  const schedulesRef = useRef<HTMLAnchorElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const isAgents = pathname === AGENTS_HREF;
  const isCollaboration = pathname === COLLABORATION_HREF;
  const isSchedules =
    pathname === SCHEDULES_HREF || pathname.startsWith(`${SCHEDULES_HREF}/`);

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
    return () => window.removeEventListener(COLLABORATION_UPDATED_EVENT, loadCollaboration);
  }, [projectId, pathname]);

  const updateIndicator = () => {
    const nav = navRef.current;
    const activeEl = isSchedules
      ? schedulesRef.current
      : isCollaboration
        ? collabRef.current
        : agentsRef.current;
    if (!nav || !activeEl) return;
    const navRect = nav.getBoundingClientRect();
    const rect = activeEl.getBoundingClientRect();
    setIndicator({
      left: rect.left - navRect.left,
      width: rect.width,
    });
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [pathname, memberCount, collaborationOn, failedCount, isAgents, isCollaboration, isSchedules]);

  useEffect(() => {
    const onResize = () => updateIndicator();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pathname, memberCount, isAgents, isCollaboration, isSchedules]);

  return (
    <nav ref={navRef} className={styles.subNav} aria-label="Agent section">
      <span
        className={styles.indicator}
        style={{
          transform: `translateX(${indicator.left}px)`,
          width: indicator.width,
        }}
        aria-hidden
      />
      <Link
        ref={agentsRef}
        href={AGENTS_HREF}
        className={`${styles.subNavLink} ${isAgents ? styles.subNavLinkActive : ""}`}
      >
        Agents
      </Link>
      <Link
        ref={collabRef}
        href={COLLABORATION_HREF}
        className={`${styles.subNavLink} ${
          isCollaboration ? styles.subNavLinkActive : ""
        }`}
      >
        Collaboration
        {collaborationOn && memberCount > 0 ? (
          <span className={styles.badge}>{memberCount}</span>
        ) : null}
      </Link>
      <Link
        ref={schedulesRef}
        href={SCHEDULES_HREF}
        className={`${styles.subNavLink} ${isSchedules ? styles.subNavLinkActive : ""}`}
      >
        Schedules
        {failedCount > 0 ? (
          <span className={`${styles.badge} ${styles.badgeDanger}`}>{failedCount}</span>
        ) : null}
      </Link>
    </nav>
  );
}
