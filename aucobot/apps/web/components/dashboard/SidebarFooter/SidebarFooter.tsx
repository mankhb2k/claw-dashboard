"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Monitor, Moon, Palette, Settings, Sun, User } from "lucide-react";
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
import type { ThemePreference } from "@/schemas/theme.schema";
import { resolveUserAvatarSrc } from "@/lib/user-avatar";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";
import styles from "./SidebarFooter.module.css";

const ICON_STROKE = 1.25;

const THEME_DETAIL: Record<ThemePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

interface SidebarFooterProps {
  collapsed: boolean;
}

function FooterDropdownMenuContent({ onLogout }: { onLogout: () => void }) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <>
      <DropdownMenuItem asChild>
        <Link href="/dashboard/profile">
          <User size={14} aria-hidden />
          Profile
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSub select>
        <DropdownMenuSubItem detail={THEME_DETAIL[theme]}>
          <Palette size={14} aria-hidden />
          Appearance
        </DropdownMenuSubItem>
        <DropdownMenuSubContent width={180}>
          <DropdownMenuItem
            selected={theme === "system"}
            onSelect={() => setTheme("system")}
          >
            <Monitor size={14} aria-hidden />
            System
          </DropdownMenuItem>
          <DropdownMenuItem
            selected={theme === "light"}
            onSelect={() => setTheme("light")}
          >
            <Sun size={14} aria-hidden />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem
            selected={theme === "dark"}
            onSelect={() => setTheme("dark")}
          >
            <Moon size={14} aria-hidden />
            Dark
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem asChild>
        <Link href="/dashboard/setting">
          <Settings size={14} aria-hidden />
          Settings
        </Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuItem variant="danger" onClick={onLogout}>
        <LogOut size={14} aria-hidden />
        Log out
      </DropdownMenuItem>
    </>
  );
}

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const [openCollapsedMenu, setOpenCollapsedMenu] = useState(false);
  const [openExpandedMenu, setOpenExpandedMenu] = useState(false);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";
  const displayName = user?.name?.trim() || user?.username || "User";

  const handleLogout = async () => {
    setOpenCollapsedMenu(false);
    setOpenExpandedMenu(false);
    await logout();
    router.push("/login");
  };

  useEffect(() => {
    setOpenCollapsedMenu(false);
    setOpenExpandedMenu(false);
  }, [collapsed]);

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
            aria-label="Open quick settings"
            aria-expanded={openCollapsedMenu}
            disabled={!collapsed}
          >
            <Avatar
              size="md"
              className={styles.footerAvatar}
              src={resolveUserAvatarSrc(user?.avatarUrl)}
              fallback={initials}
              alt={user?.username ?? "User avatar"}
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
                aria-label="Open quick settings"
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
