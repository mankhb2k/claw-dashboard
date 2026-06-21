"use client";

import { useCallback, useState } from "react";

import {
  loadSidebarCollapsed,
  saveSidebarCollapsed,
} from "@/utils/chat/session/last-key";

/** Chat sidebar collapsed state, persisted per project. */
export function useSidebarPreference(projectId: string) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    projectId ? loadSidebarCollapsed(projectId) : false,
  );
  const [trackedProjectId, setTrackedProjectId] = useState(projectId);

  if (projectId !== trackedProjectId) {
    setTrackedProjectId(projectId);
    setSidebarCollapsed(projectId ? loadSidebarCollapsed(projectId) : false);
  }

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (projectId) saveSidebarCollapsed(projectId, next);
      return next;
    });
  }, [projectId]);

  return { sidebarCollapsed, handleToggleSidebar };
}
