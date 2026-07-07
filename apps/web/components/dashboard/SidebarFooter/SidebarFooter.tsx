"use client";

import { LogOut, Monitor, Moon, Palette, Settings, Sun, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import styles from "./SidebarFooter.module.css";
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSubItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";
import { resolveUserAvatarSrc } from "@/utils/profile/user-avatar";

import type { ThemePreference } from "@/schemas/theme.schema";

const ICON_STROKE = 1.25;

interface SidebarFooterProps {
  collapsed: boolean;
}

function FooterDropdownMenuContent({ onLogout }: { onLogout: () => void }) {
  const { t } = useI18n();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const themeDetail = useMemo(
    (): Record<ThemePreference, string> => ({
      system: t("sidebar.footer.system"),
      light: t("sidebar.footer.light"),
      dark: t("sidebar.footer.dark"),
    }),
    [t],
  );

  return (
    <>
      <DropdownMenuItem asChild>
        <Link href="/dashboard/profile">
          <User size={14} aria-hidden />
          {t("sidebar.footer.profile")}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSub select>
        <DropdownMenuSubItem detail={themeDetail[theme]}>
          <Palette size={14} aria-hidden />
          {t("sidebar.footer.appearance")}
        </DropdownMenuSubItem>
        <DropdownMenuSubContent width={180}>
          <DropdownMenuItem
            selected={theme === "system"}
            onSelect={() => setTheme("system")}
          >
            <Monitor size={14} aria-hidden />
            {t("sidebar.footer.system")}
          </DropdownMenuItem>
          <DropdownMenuItem
            selected={theme === "light"}
            onSelect={() => setTheme("light")}
          >
            <Sun size={14} aria-hidden />
            {t("sidebar.footer.light")}
          </DropdownMenuItem>
          <DropdownMenuItem
            selected={theme === "dark"}
            onSelect={() => setTheme("dark")}
          >
            <Moon size={14} aria-hidden />
            {t("sidebar.footer.dark")}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem asChild>
        <Link href="/dashboard/setting">
          <Settings size={14} aria-hidden />
          {t("sidebar.footer.settings")}
        </Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuItem variant="danger" onClick={onLogout}>
        <LogOut size={14} aria-hidden />
        {t("sidebar.footer.logout")}
      </DropdownMenuItem>
    </>
  );
}

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const { t } = useI18n();
  const [openCollapsedMenu, setOpenCollapsedMenu] = useState(false);
  const [openExpandedMenu, setOpenExpandedMenu] = useState(false);
  const [trackedCollapsed, setTrackedCollapsed] = useState(collapsed);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";
  const displayName =
    user?.name?.trim() || user?.username || t("sidebar.footer.userFallback");

  const handleLogout = async () => {
    setOpenCollapsedMenu(false);
    setOpenExpandedMenu(false);
    await logout();
    router.push("/login");
  };

  if (collapsed !== trackedCollapsed) {
    setTrackedCollapsed(collapsed);
    setOpenCollapsedMenu(false);
    setOpenExpandedMenu(false);
  }

  return (
    <div
      className={`${styles.footerItem} ${collapsed ? styles.footerItemCollapsed : ""}`}
    >
      <DropdownMenu
        open={openCollapsedMenu}
        onOpenChange={setOpenCollapsedMenu}
        modal={false}
      >
        <DropdownMenuTrigger asChild variant="unstyled">
          <button
            type="button"
            className={styles.footerAvatarTrigger}
            aria-label={t("sidebar.footer.openQuickSettings")}
            aria-expanded={openCollapsedMenu}
            disabled={!collapsed}
          >
            <Avatar
              size="md"
              className={styles.footerAvatar}
              src={resolveUserAvatarSrc(user?.avatarUrl)}
              fallback={initials}
              alt={user?.username ?? t("sidebar.footer.userAvatar")}
            />
          </button>
        </DropdownMenuTrigger>

        {collapsed && (
          <DropdownMenuContent
            width={220}
            side="top"
            align="start"
            sideOffset={8}
          >
            <FooterDropdownMenuContent onLogout={handleLogout} />
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      {!collapsed && (
        <Link href="/dashboard/profile" className={styles.footerText}>
          {displayName}
        </Link>
      )}

      {!collapsed && (
        <div className={styles.settingsWrap}>
          <DropdownMenu
            open={openExpandedMenu}
            onOpenChange={setOpenExpandedMenu}
            modal={false}
          >
            <DropdownMenuTrigger asChild variant="unstyled">
              <button
                type="button"
                className={styles.footerSettingsBtn}
                aria-label={t("sidebar.footer.openQuickSettings")}
                aria-expanded={openExpandedMenu}
              >
                <Settings size={18} strokeWidth={ICON_STROKE} aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              width={220}
              side="top"
              align="start"
              sideOffset={8}
            >
              <FooterDropdownMenuContent onLogout={handleLogout} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
