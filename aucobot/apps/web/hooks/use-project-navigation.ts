"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  LayoutDashboard,
  Brain,
  MessageSquareCodeIcon,
  Sparkles,
  Cable,
  Settings as SettingsIcon,
  Bot,
} from "lucide-react";
import type { NavItem } from "@/components/dashboard/Sidebar/Sidebar";
import { DASHBOARD_BASE_PATH } from "@/lib/routing/dashboard-route";

const DASHBOARD_ROUTE =
  /^\/dashboard(?:\/(setting|ai-model|channel|skill|connect|agent)(?:\/[^/]+)*)?$/;

export function useProjectNavigation() {
  const pathname = usePathname();

  return useMemo(() => {
    const pathMatch = pathname.match(DASHBOARD_ROUTE);
    const subSegment = pathMatch?.[1] ?? "overview";
    const baseProjectPath = DASHBOARD_BASE_PATH;

    const titleMap: Record<string, string> = {
      overview: "Tổng quan",
      "ai-model": "Model & API keys",
      agent: "Bot Agent",
      channel: "Channels",
      skill: "Skill Directory",
      connect: "Connect",
      setting: "Cài đặt",
    };

    const title = titleMap[subSegment] || "Dashboard";

    const projectNav: NavItem[] = [
      {
        href: baseProjectPath,
        label: "Overview",
        icon: LayoutDashboard,
        isActive: (p) => p === baseProjectPath,
      },
      {
        href: `${baseProjectPath}/ai-model`,
        label: "AI Model",
        icon: Brain,
        isActive: (p) => p.startsWith(`${baseProjectPath}/ai-model`),
      },
      {
        href: `${baseProjectPath}/agent`,
        label: "Bot Agent",
        icon: Bot,
        isActive: (p) => p.startsWith(`${baseProjectPath}/agent`),
      },
      {
        href: `${baseProjectPath}/channel`,
        label: "Channels",
        icon: MessageSquareCodeIcon,
        isActive: (p) => p.startsWith(`${baseProjectPath}/channel`),
      },
      {
        href: `${baseProjectPath}/skill`,
        label: "Skills",
        icon: Sparkles,
        isActive: (p) => p.startsWith(`${baseProjectPath}/skill`),
      },
      {
        href: `${baseProjectPath}/connector`,
        label: "Connector",
        icon: Cable,
        isActive: (p) => p.startsWith(`${baseProjectPath}/connector`),
      },
      {
        href: `${baseProjectPath}/setting`,
        label: "Settings",
        icon: SettingsIcon,
        isActive: (p) => p.startsWith(`${baseProjectPath}/setting`),
      },
    ];

    return {
      title,
      projectNav,
      baseProjectPath,
      subSegment,
    };
  }, [pathname]);
}
