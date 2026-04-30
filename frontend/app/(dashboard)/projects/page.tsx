'use client'

import { useEffect } from 'react'
import { useProjectStore } from '@/stores/project.store'
import { useCreateProjectModalStore } from '@/stores/create-project-modal.store'
import { Header } from '@/components/layout/Header/Header'
import { Button } from '@/components/ui/Button/Button'
import { ProjectCard } from '@/components/project/ProjectCard/ProjectCard'
import styles from './projects.module.css'

export default function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects)
  const isLoading = useProjectStore((s) => s.isLoading)
  const error = useProjectStore((s) => s.error)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const openCreateModal = useCreateProjectModalStore((s) => s.open)

  useEffect(() => {
    void fetchProjects()
  }, [fetchProjects])

  return (
    <>
      <Header title="Projects" />

      <div className={styles.page}>
        <div className={styles.topbar}>
          <div>
            <h2 className={styles.heading}>Tất cả project</h2>
            <p className={styles.sub}>Mỗi project là một môi trường sandbox riêng (container)</p>
          </div>
          <Button type="button" onClick={() => openCreateModal('projects')}>
            + Tạo project
          </Button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {isLoading ? (
          <div className={styles.empty}>
            <span className={styles.spinner} />
            <p>Đang tải...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>◈</p>
            <p className={styles.emptyText}>Chưa có project nào</p>
            <Button type="button" onClick={() => openCreateModal('projects')}>
              Tạo project đầu tiên
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

    </>
  )
}
