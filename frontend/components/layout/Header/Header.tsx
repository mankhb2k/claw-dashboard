'use client'

import { useRouter } from 'next/navigation'
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
        <div className={styles.userMenu}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.dropdown}>
            <p className={styles.dropdownEmail}>{user?.email}</p>
            <button className={styles.dropdownItem} onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
