"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  FaArrowRightFromBracket,
  FaBars,
  FaMoon,
  FaSun,
} from "react-icons/fa6";
import {
  Avatar,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";
import type { NavItem } from "@/components/dashboard/Sidebar/Sidebar";
import styles from "./Header.module.css";

interface HeaderProps {
  title: string;
  items?: NavItem[];
  logoutLabel?: string;
  previewEmailLabel?: string;
  switchToLightLabel?: string;
  switchToDarkLabel?: string;
  themeLightTitle?: string;
  themeDarkTitle?: string;
  openUserMenuLabel?: string;
}

export function Header({
  title,
  items = [],
  logoutLabel = "Đăng xuất",
  previewEmailLabel = "preview@example.com",
  switchToLightLabel = "Chuyển sang chế độ sáng",
  switchToDarkLabel = "Chuyển sang chế độ tối",
  themeLightTitle = "Chế độ sáng",
  themeDarkTitle = "Chế độ tối",
  openUserMenuLabel = "Mở menu người dùng",
}: HeaderProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user?.login?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className={styles.header}>
      {/* Phần 1: Left */}
      <div className={styles.left}>
        {/* Dropdown Menu cho Mobile (Chỉ hiện khi có items) */}
        {items.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon_sm"
                className={styles.mobileMenuBtn}
                aria-label="Toggle navigation"
              >
                <FaBars size={16} aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={styles.mobileDropdown}
              align="start"
              sideOffset={8}
            >
              {/* Tự render menu riêng cho Header */}
              <nav className={styles.mobileNav}>
                {items.map((item) => {
                  const isActive = item.isActive(pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ""}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <h1 className={styles.title}>{title}</h1>
      </div>

      {/* Phần 2: Middle (Chiếm khoảng trống ở giữa) */}
      <div className={styles.middle}></div>

      {/* Phần 3: Right */}
      <div className={styles.right}>
        <Button
          type="button"
          variant="ghost"
          size="icon_sm"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={theme === "dark" ? switchToLightLabel : switchToDarkLabel}
          title={theme === "dark" ? themeLightTitle : themeDarkTitle}
        >
          {theme === "dark" ? (
            <FaSun size={16} aria-hidden />
          ) : (
            <FaMoon size={16} aria-hidden />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className={styles.avatarButton}
              variant="ghost"
              size="icon_sm"
              aria-label={openUserMenuLabel}
            >
              <Avatar className={styles.avatar} fallback={initials} size="md" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className={styles.dropdown}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className={styles.dropdownEmail}>
              {user?.login ?? previewEmailLabel}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className={styles.dropdownSeparator} />
            <DropdownMenuItem
              className={styles.dropdownItem}
              variant="danger"
              onClick={handleLogout}
            >
              <FaArrowRightFromBracket size={14} aria-hidden />
              {logoutLabel}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
