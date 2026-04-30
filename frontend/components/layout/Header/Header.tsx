'use client'

import { useRouter } from 'next/navigation'
import * as Avatar from '@radix-ui/react-avatar'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Separator from '@radix-ui/react-separator'
import { FaArrowRightFromBracket } from 'react-icons/fa6'
import { useAuthStore } from '@/stores/auth.store'
import styles from './Header.module.css'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.right}>
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
