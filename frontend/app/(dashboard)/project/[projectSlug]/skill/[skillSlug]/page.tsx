'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PanelRight, Share } from 'lucide-react'
import { Header } from '@/components/layout/Header/Header'
import { Button } from '@/components/ui/Button/Button'
import { useI18n } from '@/lib/i18n'
import { buildSkillMarkdown, buildSkillMetaJson, skillDraftSchema, type SkillDraft } from '@/lib/skill-markdown'
import { extractProjectIdFromSegment } from '@/lib/project-route'
import { useProjectStore } from '@/stores/project.store'
import { SkillEditor } from '@/components/project/SkillEditor/SkillEditor'
import { getLocalSkill, type SkillLocal } from '@/lib/skill-storage'
import styles from '../skill.module.css'

export default function ProjectSkillEditorPage() {
  const { t } = useI18n()
  const params = useParams()
  
  const projectSegment = typeof params.projectSlug === 'string' ? params.projectSlug : ''
  const skillSlug = typeof params.skillSlug === 'string' ? params.skillSlug : ''
  
  const id = useMemo(() => extractProjectIdFromSegment(projectSegment), [projectSegment])

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const fetchProjects = useProjectStore((s) => s.fetchProjects)

  const [fetched, setFetched] = useState(false)
  const [skill, setSkill] = useState<SkillLocal | null>(null)
  
  const [bodyMarkdown, setBodyMarkdown] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<'ok' | 'fail' | null>(null)
  const [bannerError, setBannerError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setFetched(false)
    void fetchProjects().finally(() => setFetched(true))
  }, [id, fetchProjects])

  useEffect(() => {
    if (skillSlug) {
      const loaded = getLocalSkill(skillSlug)
      if (loaded) {
        setSkill(loaded)
        // Note: setting initial content in BlockNote might require a ref or a key change, 
        // but for now we just load metadata.
      }
    }
  }, [skillSlug])

  const builderPreview = useMemo(() => {
    if (!skill) return null
    return buildSkillMarkdown(skill, bodyMarkdown)
  }, [skill, bodyMarkdown])

  const handleCopy = useCallback(async () => {
    setCopyFeedback(null)
    setBannerError(null)
    if (!builderPreview?.trim()) {
      setBannerError(t('skills.page.errGeneric'))
      return
    }
    try {
      await navigator.clipboard.writeText(builderPreview)
      setCopyFeedback('ok')
      setTimeout(() => setCopyFeedback(null), 2500)
    } catch {
      setCopyFeedback('fail')
    }
  }, [builderPreview, t])


  if (!id || (fetched && !project)) {
    return (
      <>
        <Header title={t('skills.page.headerSkill')} />
        <div className={styles.page}>
           <div className={styles.shell}>
             <p className={styles.error}>{!id ? t('skills.page.invalidProject') : t('skills.page.projectNotFound')}</p>
           </div>
        </div>
      </>
    )
  }

  if (!project && !fetched) {
    return (
      <>
        <Header title={t('skills.page.headerSkill')} />
        <div className={styles.page}>
           <div className={styles.state}><span className={styles.spinner} /><p>{t('skills.page.loading')}</p></div>
        </div>
      </>
    )
  }

  if (!skill && fetched) {
    return (
      <>
        <Header title="Skill Not Found" />
        <div className={styles.page}>
          <div className={styles.shell}>
            <Link className={styles.back} href={`/project/${projectSegment}/skill`}>
              &larr; Quay lại danh sách
            </Link>
            <p className={styles.error}>Không tìm thấy Skill trong LocalStorage.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title={skill ? `Editing: ${skill.name}` : 'Skill Editor'} />

      <div className={styles.page}>
        <div className={styles.shell}>
          <Link className={styles.back} href={`/project/${projectSegment}/skill`}>
            &larr; Danh sách Kỹ năng
          </Link>

          {bannerError ? (
            <p className={styles.bannerError} role="alert">{bannerError}</p>
          ) : null}

          <div className={styles.formStack}>
            <div className={styles.documentAreaWrapper}>
              <div className={styles.documentArea} data-sidebar={isSidebarOpen}>
                <div className={styles.docHeader}>
                  <div className={styles.docHeaderLeft}>
                    <div className={styles.macDot} style={{ background: '#f87171' }} />
                    <div className={styles.macDot} style={{ background: '#fbbf24' }} />
                    <div className={styles.macDot} style={{ background: '#4ade80' }} />
                  </div>
                  <div className={styles.docHeaderRight}>
                    <Button type="button" variant="ghost" size="sm" onClick={() => void handleCopy()} style={{ height: '28px', padding: '0 8px', gap: '4px' }}>
                      <Share size={14} />
                      <span style={{ fontSize: '12px' }}>{t('skills.page.copyButton')}</span>
                    </Button>
                    <div className={styles.docHeaderDivider} />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsSidebarOpen(v => !v)} style={{ height: '28px', padding: '0 8px' }} title="Toggle Sidebar">
                      <PanelRight size={16} />
                    </Button>
                  </div>
                </div>
                <div className={styles.docBody}>
                  <div className={styles.editorContent}>
                    <SkillEditor onChange={setBodyMarkdown} />
                  </div>
                  {isSidebarOpen && (
                    <div className={styles.sidebar}>
                      <div className={styles.sidebarHeader}>COMMENTS</div>
                      <div className={styles.sidebarContent}>
                        Tính năng bình luận trực tiếp trên văn bản (Collaboration) đang được phát triển.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {copyFeedback === 'ok' ? (
              <p className={styles.success} role="status">{t('skills.page.copySuccess')}</p>
            ) : null}
            {copyFeedback === 'fail' ? (
              <p className={styles.error} role="alert">{t('skills.page.copyFail')}</p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
