"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ChevronsLeft } from "lucide-react";
import { SidebarFooter } from "@/components/dashboard/SidebarFooter/SidebarFooter";
import { useI18n } from "@/lib/i18n";
import styles from "./Sidebar.module.css";

const ICON_STROKE = 1.25;

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

interface SidebarProps {
  items: NavItem[];
  collapsed: boolean;
  onToggle: () => void;
  homeHref?: string;
}

export function Sidebar({
  items,
  collapsed,
  onToggle,
  homeHref = "/",
}: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
    >
      <header className={styles.header}>
        <div className={styles.brand}>
          <Link href={homeHref} title={t("sidebar.dashboardTitle")} className={styles.brandLink}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/aucobot-icon.svg"
              alt=""
              aria-hidden
              className={styles.logoIcon}
              width={24}
              height={24}
            />
            <span className={styles.logoText}>
              {t("sidebar.brand")}
            </span>
          </Link>
        </div>
        <button
          onClick={onToggle}
          className={styles.collapseBtn}
          aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        >
          <ChevronsLeft
            size={14}
            strokeWidth={ICON_STROKE}
            aria-hidden
            className={`${styles.collapseIcon} ${collapsed ? styles.collapseIconRotated : ""}`}
          />
        </button>
      </header>

      <nav className={styles.navWrap}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
            >
              <Icon
                className={styles.navIcon}
                size={18}
                strokeWidth={ICON_STROKE}
                aria-hidden
              />
              <span
                className={`${styles.navText} ${collapsed ? styles.navTextHidden : ""}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <footer className={styles.footer}>
        <SidebarFooter collapsed={collapsed} />
      </footer>
    </aside>
  );
}
