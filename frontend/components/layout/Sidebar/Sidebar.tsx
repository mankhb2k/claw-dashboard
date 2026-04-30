'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FaAnglesLeft,
  FaAnglesRight,
  FaArrowLeft,
  FaChevronDown,
  FaCircleExclamation,
  FaCircleInfo,
  FaFolderOpen,
  FaGaugeHigh,
  FaGear,
  FaMagnifyingGlass,
  FaPlay,
  FaCircleUser,
} from 'react-icons/fa6'
import styles from './Sidebar.module.css'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: FaGaugeHigh },
  { href: '/projects', label: 'Projects', icon: FaFolderOpen },
  { href: '/settings', label: 'Cài đặt', icon: FaGear },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const isProjectDetail = /^\/projects\/[^/]+/.test(pathname)
  const [activeProjectHash, setActiveProjectHash] = useState('overview')
  const projectNav = [
    { hash: 'overview', label: 'Tổng quan', icon: FaGaugeHigh },
    { hash: 'info', label: 'Thông tin', icon: FaCircleInfo },
    { hash: 'controls', label: 'Điều khiển', icon: FaPlay },
    { hash: 'danger', label: 'Nguy hiểm', icon: FaCircleExclamation },
  ]

  useEffect(() => {
    if (!isProjectDetail) return

    const readHash = () => {
      const hash = window.location.hash.replace('#', '')
      setActiveProjectHash(hash || 'overview')
    }

    readHash()
    window.addEventListener('hashchange', readHash)
    return () => window.removeEventListener('hashchange', readHash)
  }, [isProjectDetail, pathname])

  return (
    <aside className={[styles.sidebar, collapsed ? styles.sidebarCollapsed : ''].join(' ')}>
      <header className={styles.header}>
        {isProjectDetail ? (
          <>
            <Link href="/projects" className={styles.scopeButton}>
              <FaArrowLeft size={12} aria-hidden />
              {!collapsed && <span className={styles.logoText}>Quay lại Projects</span>}
            </Link>
            {!collapsed && <p className={styles.projectCaption}>Project Settings</p>}
          </>
        ) : (
          <>
            <button type="button" className={styles.scopeButton}>
              <span className={styles.logoIcon}>⚡</span>
              {!collapsed && (
                <>
                  <span className={styles.logoText}>OpenClaw Projects</span>
                  <span className={styles.scopeBadge}>Hobby</span>
                  <span className={styles.scopeIcon}>
                    <FaChevronDown size={12} aria-hidden />
                  </span>
                </>
              )}
            </button>

            {!collapsed && (
              <button type="button" className={styles.searchButton}>
                <FaMagnifyingGlass size={13} aria-hidden />
                <span className={styles.searchText}>Find...</span>
                <kbd className={styles.searchKbd}>F</kbd>
              </button>
            )}
          </>
        )}
      </header>

      <div className={styles.navWrap}>
        <nav className={styles.nav}>
          {isProjectDetail
            ? projectNav.map((item) => {
                const Icon = item.icon
                const isActive = activeProjectHash === item.hash
                return (
                  <Link
                    key={item.hash}
                    href={`${pathname}#${item.hash}`}
                    className={[styles.navItem, isActive ? styles.navItemActive : ''].join(' ')}
                    onClick={() => setActiveProjectHash(item.hash)}
                  >
                    <span className={styles.navIcon}>
                      <Icon size={14} aria-hidden />
                    </span>
                    {!collapsed && item.label}
                  </Link>
                )
              })
            : NAV.map((item) => {
                const Icon = item.icon
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
                    className={[styles.navItem, isActive ? styles.navItemActive : ''].join(' ')}
                  >
                    <span className={styles.navIcon}>
                      <Icon size={14} aria-hidden />
                    </span>
                    {!collapsed && item.label}
                  </Link>
                )
              })}
        </nav>
      </div>

      <div className={styles.footer}>
        {!collapsed && !isProjectDetail && (
          <button type="button" className={styles.accountButton}>
            <FaCircleUser size={16} aria-hidden />
            <span className={styles.accountText}>demo@example.com</span>
          </button>
        )}
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={onToggle}
          aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed ? <FaAnglesRight size={12} aria-hidden /> : <FaAnglesLeft size={12} aria-hidden />}
          {!collapsed && <span className={styles.collapseText}>Thu gọn</span>}
        </button>
      </div>
    </aside>
  )
}
