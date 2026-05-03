'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar/Sidebar'
import { ProjectStatusPoller } from '@/components/ProjectStatusPoller/ProjectStatusPoller'
import { CreateProjectModalHost } from '@/components/project/CreateProjectModalHost/CreateProjectModalHost'
import styles from './dashboard.layout.module.css'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className={styles.shell}>
      <ProjectStatusPoller />
      <CreateProjectModalHost />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className={[styles.main, collapsed ? styles.mainCollapsed : ''].join(' ')}>
        {children}
      </div>
    </div>
  )
}
