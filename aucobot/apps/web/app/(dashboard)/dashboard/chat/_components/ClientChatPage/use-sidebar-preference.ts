"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadSidebarCollapsed,
  saveSidebarCollapsed,
} from "@/utils/chat/session/last-key";

/** Chat sidebar collapsed state, persisted per project. */
export function useSidebarPreference(projectId: string) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setSidebarCollapsed(loadSidebarCollapsed(projectId));
  }, [projectId]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (projectId) saveSidebarCollapsed(projectId, next);
      return next;
    });
  }, [projectId]);

  return { sidebarCollapsed, handleToggleSidebar };
}
