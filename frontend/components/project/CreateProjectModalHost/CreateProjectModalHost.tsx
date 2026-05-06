'use client'

import { useEffect } from 'react'
import { CreateProjectFormCard } from '@/components/project/CreateProjectFormCard/CreateProjectFormCard'
import { useCreateProjectModalStore } from '@/stores/create-project-modal.store'
import styles from './CreateProjectModalHost.module.css'

export function CreateProjectModalHost() {
  const isOpen = useCreateProjectModalStore((s) => s.isOpen)
  const close = useCreateProjectModalStore((s) => s.close)

  useEffect(() => {
    if (!isOpen) return

    const prevOverflow = document.body.style.overflow
    const prevPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPaddingRight
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.modalRoot}>
      <button type="button" className={styles.backdrop} aria-label="Đóng modal" onClick={close} />
      <div className={styles.modalCard} role="dialog" aria-modal="true" aria-label="Tạo project">
        <CreateProjectFormCard onSuccess={close} onCancel={close} />
      </div>
    </div>
  )
}
