"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProjectStore } from "@/stores/project.store";
import {
  getPrimaryProject,
  shouldRedirectToSetup,
  SETUP_PATH,
} from "@/lib/entry-route";
import { Sidebar, NavItem } from "@/components/dashboard/Sidebar/Sidebar";
import { Header } from "@/components/dashboard/Header/Header";
import {
  Brain,
  LayoutDashboard,
  MessageSquareCodeIcon,
  MessageSquare,
  Settings as SettingsIcon,
  Sparkles,
  Cable,
  Bot,
} from "lucide-react";
import { DASHBOARD_BASE_PATH } from "@/lib/dashboard-route";
import styles from "./layout.module.css";

function isDashboardCanvasRoute(pathname: string): boolean {
  if (pathname.startsWith(`${DASHBOARD_BASE_PATH}/chat`)) {
    return true;
  }
  if (/\/agent\/[^/]+$/.test(pathname) && !pathname.endsWith("/agent/create")) {
    return true;
  }
  if (/\/skill\/[^/]+$/.test(pathname) && !pathname.endsWith("/skill")) {
    return true;
  }
  return false;
}

const DASHBOARD_ROUTE =
  /^\/dashboard(?:\/(setting|ai-model|channel|chat|skill|connect|agent)(?:\/[^/]+)*)?$/;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [workspaceChecked, setWorkspaceChecked] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const projects = useProjectStore((s) => s.projects);
  const gateDoneRef = useRef(false);

  useEffect(() => {
    if (gateDoneRef.current) return;
    void fetchProjects()
      .then(() => {
        gateDoneRef.current = true;
        const primary = getPrimaryProject(useProjectStore.getState().projects);
        if (shouldRedirectToSetup(primary)) {
          router.replace(SETUP_PATH);
          return;
        }
        setWorkspaceChecked(true);
      })
      .catch(() => {
        router.replace(SETUP_PATH);
      });
  }, [fetchProjects, router]);

  useEffect(() => {
    if (!workspaceChecked) return;
    const primary = getPrimaryProject(projects);
    if (shouldRedirectToSetup(primary)) {
      router.replace(SETUP_PATH);
    }
  }, [projects, workspaceChecked, router]);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState !== null) {
      setCollapsed(JSON.parse(savedState));
    }
  }, []);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
      return newState;
    });
  };

  const pathMatch = pathname.match(DASHBOARD_ROUTE);
  const subSegment = pathMatch?.[1] ?? "overview";

  const titleMap: Record<string, string> = {
    overview: "Tổng quan",
    "ai-model": "Model & API keys",
    agent: "Bot Agent",
    channel: "Channels",
    chat: "Chat",
    connect: "Connect",
    skill: "Skill Directory",
    setting: "Cài đặt",
  };

  const title = titleMap[subSegment] || "Dashboard";
  const canvasRoute = isDashboardCanvasRoute(pathname);

  const nav: NavItem[] = [
    {
      href: DASHBOARD_BASE_PATH,
      label: "Overview",
      icon: LayoutDashboard,
      isActive: (p) => p === DASHBOARD_BASE_PATH,
    },
    {
      href: `${DASHBOARD_BASE_PATH}/ai-model`,
      label: "AI Model",
      icon: Brain,
      isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/ai-model`),
    },
    {
      href: `${DASHBOARD_BASE_PATH}/agent`,
      label: "Bot Agent",
      icon: Bot,
      isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/agent`),
    },
    {
      href: `${DASHBOARD_BASE_PATH}/channel`,
      label: "Channels",
      icon: MessageSquareCodeIcon,
      isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/channel`),
    },
    {
      href: `${DASHBOARD_BASE_PATH}/chat`,
      label: "Chat",
      icon: MessageSquare,
      isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/chat`),
    },
    {
      href: `${DASHBOARD_BASE_PATH}/connect`,
      label: "Connect",
      icon: Cable,
      isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/connect`),
    },
    {
      href: `${DASHBOARD_BASE_PATH}/skill`,
      label: "Skills",
      icon: Sparkles,
      isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/skill`),
    },
    {
      href: `${DASHBOARD_BASE_PATH}/setting`,
      label: "Settings",
      icon: SettingsIcon,
      isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/setting`),
    },
  ];

  if (!workspaceChecked) {
    return (
      <div className={styles.shell} data-dashboard-shell>
        <div className={styles.gate}>
          <p>Đang kiểm tra workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell} data-dashboard-shell>
      <Sidebar
        items={nav}
        collapsed={collapsed}
        onToggle={handleToggle}
        homeHref={DASHBOARD_BASE_PATH}
      />

      <div className={styles.main}>
        <div
          className={canvasRoute ? styles.contentCanvas : styles.contentScroll}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
