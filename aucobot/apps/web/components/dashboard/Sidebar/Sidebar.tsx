"use client";

import { ChevronsLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./Sidebar.module.css";
import { SidebarFooter } from "@/components/dashboard/SidebarFooter/SidebarFooter";
import { useI18n } from "@/lib/i18n";
import { shouldUseUnoptimized } from "@/utils/image/app-image.utils";

import type { LucideIcon } from "lucide-react";

const ICON_STROKE = 1.25;
const BRAND_ICON = "/aucobot-icon.svg";

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
            <Image
              src={BRAND_ICON}
              alt=""
              aria-hidden
              className={styles.logoIcon}
              width={24}
              height={24}
              unoptimized={shouldUseUnoptimized(BRAND_ICON)}
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
