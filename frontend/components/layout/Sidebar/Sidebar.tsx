'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/projects', label: 'Projects', icon: '◈' },
  { href: '/settings', label: 'Cài đặt', icon: '⚙' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⚡</span>
        <span className={styles.logoText}>OpenClaw</span>
      </div>

      <nav className={styles.nav}>
        {NAV.map((item) => {
          const isActive =
            item.href === '/projects'
              ? pathname === item.href || pathname.startsWith('/projects/')
              : item.href === '/settings'
                ? pathname.startsWith('/settings')
                : pathname === item.href
          return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              styles.navItem,
              isActive ? styles.navItemActive : '',
            ].join(' ')}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </Link>
          )
        })}
      </nav>
    </aside>
  )
}
