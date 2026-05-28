"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";
  const displayName = user?.name?.trim() || user?.username || "User";

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/login");
  };

  const handleOpenQuickSettings = () => {
    if (!collapsed) {
      setOpen(true);
    }
  };

  return (
    <div
      className={`${styles.footerItem} ${collapsed ? styles.footerItemCollapsed : ""}`}
      onClick={handleOpenQuickSettings}
    >
      <Avatar
        size="md"
        className={styles.footerAvatar}
        fallback={initials}
        alt={user?.username ?? "User avatar"}
      />
      <span
        className={`${styles.footerText} ${collapsed ? styles.footerTextHidden : ""}`}
      >
        {displayName}
      </span>

      {!collapsed && (
        <div className={styles.settingsWrap} onClick={(event) => event.stopPropagation()}>
          <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger asChild variant="unstyled">
              <button
                type="button"
                className={styles.footerSettingsBtn}
                aria-label="Mở cài đặt nhanh"
                aria-expanded={open}
              >
                <Settings size={18} strokeWidth={ICON_STROKE} aria-hidden />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className={styles.dropdown}
              side="top"
              align="end"
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
