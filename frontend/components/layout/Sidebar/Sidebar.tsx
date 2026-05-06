"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Brain,
  ChevronsLeft,
  ChevronsRight,
  FolderOpen,
  LayoutDashboard,
  MessageSquareCodeIcon,
  Settings as SettingsIcon,
  Sparkles,
  Cable,
} from "lucide-react";
import styles from "./Sidebar.module.css";

const ICON_STROKE = 1;

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/settings", label: "Cài đặt", icon: SettingsIcon },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const projectPathMatch = pathname.match(
    /^\/project\/([^/]+)(?:\/(setting|model|channel|skill|connect)(?:\/[^/]+)*)?$/,
  );
  const isProjectDetail = Boolean(projectPathMatch);
  const [activeProjectHash, setActiveProjectHash] = useState("overview");
  const projectSegment = projectPathMatch?.[1] ?? "";
  const baseProjectPath = `/project/${projectSegment}`;
  const projectNav: {
    href: string;
    hash: string;
    label: string;
    icon: LucideIcon;
  }[] = [
    {
      href: baseProjectPath,
      hash: "overview",
      label: "Tổng quan",
      icon: LayoutDashboard,
    },

    {
      href: `${baseProjectPath}/model`,
      hash: "model",
      label: "Model",
      icon: Brain,
    },
    {
      href: `${baseProjectPath}/channel`,
      hash: "channel",
      label: "Channel",
      icon: MessageSquareCodeIcon,
    },
    {
      href: `${baseProjectPath}/skill`,
      hash: "skill",
      label: "Skill",
      icon: Sparkles,
    },
    {
      href: `${baseProjectPath}/connect`,
      hash: "connect",
      label: "Kết nối",
      icon: Cable,
    },
    {
      href: `${baseProjectPath}/setting`,
      hash: "setting",
      label: "Cài đặt",
      icon: SettingsIcon,
    },
  ];

  useEffect(() => {
    if (!isProjectDetail) return;

    const readHash = () => {
      const hash = window.location.hash.replace("#", "");
      setActiveProjectHash(hash || "overview");
    };

    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, [isProjectDetail, pathname]);

  return (
    <aside
      className={[
        styles.sidebar,
        collapsed ? styles.sidebarCollapsed : "",
      ].join(" ")}
    >
      <header className={styles.header}>
        <Link
          href="/dashboard"
          className={styles.brand}
          aria-label={collapsed ? "Về Dashboard" : undefined}
          title="Dashboard"
        >
          <span className={styles.logoIcon} aria-hidden>
            ⚡
          </span>
          {!collapsed && <span className={styles.logoText}>CLAWSANDBOX</span>}
        </Link>
      </header>

      <div className={styles.navWrap}>
        <nav className={styles.nav}>
          {isProjectDetail
            ? projectNav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.hash === "overview"
                    ? pathname === baseProjectPath
                    : item.hash === "setting"
                      ? pathname.startsWith(`${baseProjectPath}/setting`)
                      : item.hash === "model"
                        ? pathname.startsWith(`${baseProjectPath}/model`)
                        : item.hash === "channel"
                          ? pathname.startsWith(`${baseProjectPath}/channel`)
                          : item.hash === "skill"
                            ? pathname.startsWith(`${baseProjectPath}/skill`)
                            : item.hash === "connect"
                              ? pathname.startsWith(`${baseProjectPath}/connect`)
                              : activeProjectHash === item.hash;
                return (
                  <Link
                    key={item.hash}
                    href={item.href}
                    className={[
                      styles.navItem,
                      isActive ? styles.navItemActive : "",
                    ].join(" ")}
                    onClick={() => setActiveProjectHash(item.hash)}
                  >
                    <Icon
                      className={styles.navIcon}
                      size={18}
                      strokeWidth={ICON_STROKE}
                      aria-hidden
                    />
                    {!collapsed && item.label}
                  </Link>
                );
              })
            : NAV.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/projects"
                    ? pathname === item.href ||
                      pathname.startsWith("/projects/")
                    : item.href === "/settings"
                      ? pathname.startsWith("/settings")
                      : pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      styles.navItem,
                      isActive ? styles.navItemActive : "",
                    ].join(" ")}
                  >
                    <Icon
                      className={styles.navIcon}
                      size={16}
                      strokeWidth={ICON_STROKE}
                      aria-hidden
                    />
                    {!collapsed && item.label}
                  </Link>
                );
              })}
        </nav>
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.accountButton}
          aria-label={collapsed ? "Tài khoản: demo@example.com" : undefined}
          title="demo@example.com"
        >
          <span className={styles.accountAvatarSlot}>
            <Image
              src="/man.png"
              alt=""
              fill
              sizes="32px"
              className={styles.accountAvatar}
              draggable={false}
              priority
            />
          </span>
          {!collapsed && (
            <span className={styles.accountText}>demo@example.com</span>
          )}
        </button>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={onToggle}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {collapsed ? (
            <ChevronsRight size={12} strokeWidth={ICON_STROKE} aria-hidden />
          ) : (
            <ChevronsLeft size={12} strokeWidth={ICON_STROKE} aria-hidden />
          )}
          {!collapsed && <span className={styles.collapseText}>Thu gọn</span>}
        </button>
      </footer>
    </aside>
  );
}
