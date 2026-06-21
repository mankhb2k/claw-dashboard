"use client";

import {
  Brain,
  LayoutDashboard,
  MessageSquareCodeIcon,
  MessageCircle,
  Settings as SettingsIcon,
  Sparkles,
  Cable,
  Bot,
  MonitorSmartphone,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";

import styles from "./layout.module.css";
import { Sidebar, NavItem } from "@/components/dashboard/Sidebar/Sidebar";
import { useSessionKeepAlive } from "@/hooks/auth/use-session-keep-alive";
import { useI18n } from "@/lib/i18n";
import { DASHBOARD_BASE_PATH } from "@/lib/routing/dashboard-route";
import {
  getPrimaryProject,
  shouldRedirectToSetup,
  SETUP_PATH,
} from "@/lib/routing/entry-route";
import { isOssRuntime } from "@/lib/runtime/runtime-mode";
import { useAuthStore } from "@/stores/auth.store";
import { useProjectStore } from "@/stores/project.store";

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [workspaceChecked, setWorkspaceChecked] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const syncProjectHealth = useProjectStore((s) => s.syncProjectHealth);
  const projects = useProjectStore((s) => s.projects);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const gateDoneRef = useRef(false);

  useSessionKeepAlive();

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState !== null) {
      // SSR-safe: localStorage is client-only; read after mount to avoid hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- §9.11
      setCollapsed(JSON.parse(savedState) as boolean);
    }
  }, []);

  useEffect(() => {
    if (gateDoneRef.current) return;

    void (async () => {
      try {
        const cached = getPrimaryProject(useProjectStore.getState().projects);
        if (cached && !isOssRuntime() && !shouldRedirectToSetup(cached)) {
          gateDoneRef.current = true;
          setWorkspaceChecked(true);
          return;
        }

        await fetchProjects();

        let primary = getPrimaryProject(useProjectStore.getState().projects);
        if (primary && isOssRuntime()) {
          await syncProjectHealth(primary.id);
          primary = getPrimaryProject(useProjectStore.getState().projects);
        }

        gateDoneRef.current = true;
        if (shouldRedirectToSetup(primary)) {
          router.replace(SETUP_PATH);
          return;
        }
        setWorkspaceChecked(true);
      } catch {
        gateDoneRef.current = true;
        const primary = getPrimaryProject(useProjectStore.getState().projects);
        if (primary && !shouldRedirectToSetup(primary)) {
          setWorkspaceChecked(true);
          return;
        }
        router.replace(SETUP_PATH);
      }
    })();
  }, [fetchProjects, syncProjectHealth, router]);

  useEffect(() => {
    if (!workspaceChecked || !gateDoneRef.current) return;
    const primary = getPrimaryProject(projects);
    if (shouldRedirectToSetup(primary)) {
      router.replace(SETUP_PATH);
    }
  }, [projects, workspaceChecked, router]);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
      return newState;
    });
  };

  const canvasRoute = isDashboardCanvasRoute(pathname);

  const nav: NavItem[] = useMemo(
    () => [
      {
        href: DASHBOARD_BASE_PATH,
        label: t("sidebar.nav.overview"),
        icon: LayoutDashboard,
        isActive: (p) => p === DASHBOARD_BASE_PATH,
      },
      {
        href: `${DASHBOARD_BASE_PATH}/chat`,
        label: t("sidebar.nav.chat"),
        icon: MessageCircle,
        isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/chat`),
      },
      {
        href: `${DASHBOARD_BASE_PATH}/ai-model`,
        label: t("sidebar.nav.aiModel"),
        icon: Brain,
        isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/ai-model`),
      },
      {
        href: `${DASHBOARD_BASE_PATH}/agent`,
        label: t("sidebar.nav.agent"),
        icon: Bot,
        isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/agent`),
      },
      {
        href: `${DASHBOARD_BASE_PATH}/channel`,
        label: t("sidebar.nav.channel"),
        icon: MessageSquareCodeIcon,
        isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/channel`),
      },
      {
        href: `${DASHBOARD_BASE_PATH}/connector`,
        label: t("sidebar.nav.connector"),
        icon: Cable,
        isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/connector`),
      },
      {
        href: `${DASHBOARD_BASE_PATH}/nodes`,
        label: t("sidebar.nav.nodes"),
        icon: MonitorSmartphone,
        isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/nodes`),
      },
      {
        href: `${DASHBOARD_BASE_PATH}/skill`,
        label: t("sidebar.nav.skill"),
        icon: Sparkles,
        isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/skill`),
      },
      {
        href: `${DASHBOARD_BASE_PATH}/setting`,
        label: t("sidebar.nav.settings"),
        icon: SettingsIcon,
        isActive: (p) => p.startsWith(`${DASHBOARD_BASE_PATH}/setting`),
      },
    ],
    [t],
  );

  if (!workspaceChecked) {
    return (
      <div className={styles.shell} data-dashboard-shell>
        <div className={styles.gate}>
          <p>{t("sidebar.gate")}</p>
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
