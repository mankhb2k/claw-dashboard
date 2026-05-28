"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Settings, Sun } from "lucide-react";
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";
import styles from "./SidebarFooterSetting.module.css";

const ICON_STROKE = 1.25;

interface SidebarFooterSettingProps {
  collapsed: boolean;
}

export function SidebarFooterSetting({ collapsed }: SidebarFooterSettingProps) {
  const [openCollapsedMenu, setOpenCollapsedMenu] = useState(false);
  const [openExpandedMenu, setOpenExpandedMenu] = useState(false);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

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
            className={styles.dropdown}
            side="top"
            align="start"
            sideOffset={8}
          >
            <DropdownMenuLabel className={styles.dropdownLabel}>
              {user?.username ?? displayName}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === "dark" ? (
                <>
                  <Sun size={14} aria-hidden />
                  Chế độ sáng
                </>
              ) : (
                <>
                  <Moon size={14} aria-hidden />
                  Chế độ tối
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/setting">
                <Settings size={14} aria-hidden />
                Cài đặt
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger" onClick={handleLogout}>
              <LogOut size={14} aria-hidden />
              Đăng xuất
            </DropdownMenuItem>
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
              className={styles.dropdown}
              side="top"
              align="start"
              sideOffset={8}
            >
              <DropdownMenuLabel className={styles.dropdownLabel}>
                {user?.username ?? displayName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? (
                  <>
                    <Sun size={14} aria-hidden />
                    Chế độ sáng
                  </>
                ) : (
                  <>
                    <Moon size={14} aria-hidden />
                    Chế độ tối
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/setting">
                  <Settings size={14} aria-hidden />
                  Cài đặt
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="danger" onClick={handleLogout}>
                <LogOut size={14} aria-hidden />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
