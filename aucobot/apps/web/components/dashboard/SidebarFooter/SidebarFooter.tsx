"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Monitor, Moon, Palette, Settings, Sun } from "lucide-react";
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui";
import type { ThemePreference } from "@/schemas/theme.schema";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";
import styles from "./SidebarFooter.module.css";

const ICON_STROKE = 1.25;

interface SidebarFooterProps {
  collapsed: boolean;
}

function FooterDropdownMenuContent({ onLogout }: { onLogout: () => void }) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <>
      <div
        className={styles.themeToggleWrap}
        onPointerDown={(e) => e.preventDefault()}
      >
        <span className={styles.themeToggleLabel}>
          <Palette size={14} aria-hidden />
          Theme
        </span>
        <ToggleGroup
          type="single"
          size="sm"
          className={styles.themeToggle}
          value={theme}
          onValueChange={(value) => {
            if (value) setTheme(value as ThemePreference);
          }}
        >
          <ToggleGroupItem
            value="system"
            className={styles.themeToggleItem}
            aria-label="Hệ thống"
          >
            <Monitor size={13} aria-hidden />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="light"
            className={styles.themeToggleItem}
            aria-label="Chế độ sáng"
          >
            <Sun size={13} aria-hidden />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="dark"
            className={styles.themeToggleItem}
            aria-label="Chế độ tối"
          >
            <Moon size={13} aria-hidden />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/dashboard/setting">
          <Settings size={14} aria-hidden />
          Cài đặt
        </Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuItem variant="danger" onClick={onLogout}>
        <LogOut size={14} aria-hidden />
        Đăng xuất
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
            aria-label="Mở cài đặt nhanh"
            aria-expanded={openCollapsedMenu}
            disabled={!collapsed}
          >
            <Avatar
              size="md"
              className={styles.footerAvatar}
              fallback={initials}
              alt={user?.username ?? "User avatar"}
            />
          </button>
        </DropdownMenuTrigger>

        {collapsed && (
          <DropdownMenuContent
            width={180}
            side="top"
            align="start"
            sideOffset={8}
          >
            <FooterDropdownMenuContent onLogout={handleLogout} />
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      {!collapsed && <span className={styles.footerText}>{displayName}</span>}

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
                aria-label="Mở cài đặt nhanh"
                aria-expanded={openExpandedMenu}
              >
                <Settings size={18} strokeWidth={ICON_STROKE} aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              width={180}
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
