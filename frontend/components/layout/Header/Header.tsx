'use client'

import { useRouter } from 'next/navigation'
import * as Avatar from '@radix-ui/react-avatar'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Separator from '@radix-ui/react-separator'
import { FaArrowRightFromBracket, FaMoon, FaSun } from 'react-icons/fa6'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import styles from './Header.module.css'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
        >
          {theme === 'dark' ? <FaSun size={16} aria-hidden /> : <FaMoon size={16} aria-hidden />}
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className={styles.avatarButton} type="button" aria-label="Mở menu người dùng">
              <Avatar.Root className={styles.avatar}>
                <Avatar.Fallback delayMs={120}>{initials}</Avatar.Fallback>
              </Avatar.Root>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content className={styles.dropdown} align="end" sideOffset={8}>
              <DropdownMenu.Label className={styles.dropdownEmail}>
                {user?.email ?? 'preview@example.com'}
              </DropdownMenu.Label>
              <Separator.Root className={styles.dropdownSeparator} decorative />
              <DropdownMenu.Item className={styles.dropdownItem} onClick={handleLogout}>
                <FaArrowRightFromBracket size={14} aria-hidden />
                Đăng xuất
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
