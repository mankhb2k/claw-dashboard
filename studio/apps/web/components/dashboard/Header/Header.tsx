"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  FaArrowRightFromBracket,
  FaBars,
  FaMoon,
  FaSun,
} from "react-icons/fa6";

import styles from "./Header.module.css";
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
import { resolveThemeAppearance } from "@/lib/theme/theme-resolve";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";

import type { NavItem } from "@/components/dashboard/Sidebar/Sidebar";

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
  logoutLabel = "Log out",
  previewEmailLabel = "preview@example.com",
  switchToLightLabel = "Switch to light mode",
  switchToDarkLabel = "Switch to dark mode",
  themeLightTitle = "Light mode",
  themeDarkTitle = "Dark mode",
  openUserMenuLabel = "Open user menu",
}: HeaderProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = resolveThemeAppearance(theme) === "dark";
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {items.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconOnly
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

      <div className={styles.middle} />

      <div className={styles.right}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={isDark ? switchToLightLabel : switchToDarkLabel}
          title={isDark ? themeLightTitle : themeDarkTitle}
        >
          {isDark ? (
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
              size="sm"
              iconOnly
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
              {user?.username ?? previewEmailLabel}
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
