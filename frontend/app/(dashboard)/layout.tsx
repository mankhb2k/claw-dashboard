import { Sidebar } from '@/components/layout/Sidebar/Sidebar'
import { ProjectStatusPoller } from '@/components/ProjectStatusPoller/ProjectStatusPoller'
import styles from './dashboard.layout.module.css'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <ProjectStatusPoller />
      <Sidebar />
      <div className={styles.main}>{children}</div>
    </div>
  )
}
