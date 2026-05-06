'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import JSZip from 'jszip'
import { Plus, X, MoreVertical, Edit2, Download, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/Header/Header'
import { Button } from '@/components/ui/Button/Button'
import { Input } from '@/components/ui/Input/Input'
import { useI18n } from '@/lib/i18n'
import { buildSkillMetaJson, buildSkillMarkdown, skillDraftSchema, type SkillDraft } from '@/lib/skill-markdown'
import { extractProjectIdFromSegment } from '@/lib/project-route'
import { useProjectStore } from '@/stores/project.store'
import { getLocalSkills, saveLocalSkill, deleteLocalSkill, type SkillLocal } from '@/lib/skill-storage'
import styles from './skill.module.css'

const EMPTY_DRAFT: SkillDraft = {
  name: '',
  description: '',
  heading: '',
}

export default function ProjectSkillDirectoryPage() {
  const { t } = useI18n()
  const params = useParams()
  const router = useRouter()
  
  const projectSegment = typeof params.projectSlug === 'string' ? params.projectSlug : ''
  const id = useMemo(() => extractProjectIdFromSegment(projectSegment), [projectSegment])

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const fetchProjects = useProjectStore((s) => s.fetchProjects)

  const [fetched, setFetched] = useState(false)
  const [skills, setSkills] = useState<SkillLocal[]>([])
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null)
  const [draft, setDraft] = useState<SkillDraft>(EMPTY_DRAFT)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setFetched(false)
    void fetchProjects().finally(() => setFetched(true))
  }, [id, fetchProjects])

  useEffect(() => {
    setSkills(getLocalSkills())
  }, [])

  const parsedDraft = useMemo(() => skillDraftSchema.safeParse(draft), [draft])

  const nameError = useMemo(() => {
    if (parsedDraft.success) return undefined
    const fe = parsedDraft.error.flatten().fieldErrors
    return fe.name?.length ? t('skills.page.errNameFormat') : undefined
  }, [parsedDraft, t])

  const descriptionError = useMemo(() => {
    if (parsedDraft.success) return undefined
    const fe = parsedDraft.error.flatten().fieldErrors
    return fe.description?.length ? t('skills.page.errDescription') : undefined
  }, [parsedDraft, t])

  const openCreateModal = useCallback(() => {
    setDraft(EMPTY_DRAFT)
    setEditingSlug(null)
    setIsModalOpen(true)
    setOpenMenuId(null)
  }, [])

  const openEditModal = useCallback((skill: SkillLocal, e: React.MouseEvent) => {
    e.preventDefault()
    setDraft({ name: skill.name, description: skill.description, heading: skill.heading })
    setEditingSlug(skill.slug)
    setIsModalOpen(true)
    setOpenMenuId(null)
  }, [])

  const handleSave = useCallback(() => {
    if (!parsedDraft.success) return
    
    const newSkill: SkillLocal = {
      ...parsedDraft.data,
      slug: parsedDraft.data.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      bodyMarkdown: ''
    }
    
    if (editingSlug) {
      const existing = skills.find(s => s.slug === editingSlug)
      if (existing) {
        newSkill.createdAt = existing.createdAt
        newSkill.bodyMarkdown = existing.bodyMarkdown
      }
      if (editingSlug !== newSkill.slug) {
         deleteLocalSkill(editingSlug)
      }
    }
    
    saveLocalSkill(newSkill)
    setSkills(getLocalSkills())
    setIsModalOpen(false)
    setDraft(EMPTY_DRAFT)
    
    if (!editingSlug || editingSlug !== newSkill.slug) {
      router.push(`/project/${projectSegment}/skill/${newSkill.slug}`)
    }
  }, [parsedDraft, projectSegment, router, editingSlug, skills])

  const handleDownloadZip = useCallback(async (skill: SkillLocal, e: React.MouseEvent) => {
    e.preventDefault()
    setOpenMenuId(null)
    try {
      const zip = new JSZip()
      zip.file('SKILL.md', buildSkillMarkdown(skill, skill.bodyMarkdown))
      zip.file('_meta.json', buildSkillMetaJson(skill))

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${skill.name}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const handleDelete = useCallback((slug: string, e: React.MouseEvent) => {
    e.preventDefault()
    setOpenMenuId(null)
    setSkillToDelete(slug)
  }, [])

  const confirmDeleteSkill = useCallback(() => {
    if (skillToDelete) {
      deleteLocalSkill(skillToDelete)
      setSkills(getLocalSkills())
      setSkillToDelete(null)
    }
  }, [skillToDelete])

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

  return (
    <>
      <Header title="Skill Directory" />

      <div className={styles.page} onClick={() => setOpenMenuId(null)}>
        <div className={styles.shell}>
          <div className={styles.localNotice}>
            <strong>Lưu ý:</strong> Dữ liệu Skill đang được lưu tạm thời trên trình duyệt (LocalStorage) để test UI. Sau này sẽ được lưu qua API Backend.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className={styles.title}>Danh sách Kỹ năng (Skills)</h2>
            <Button onClick={openCreateModal}>
              <Plus size={16} style={{ marginRight: 8 }} />
              Tạo Skill mới
            </Button>
          </div>

          <div className={styles.skillGrid}>
            {skills.map(skill => (
              <Link href={`/project/${projectSegment}/skill/${skill.slug}`} key={skill.slug} className={styles.skillCard}>
                <div className={styles.skillCardHeader}>
                  <h3 className={styles.skillCardTitle}>{skill.name}</h3>
                  <div className={styles.dropdownContainer}>
                    <button 
                      className={styles.dropdownButton}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === skill.slug ? null : skill.slug)
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === skill.slug && (
                      <div className={styles.dropdownMenu} onClick={(e) => e.preventDefault()}>
                        <button className={styles.dropdownItem} onClick={(e) => openEditModal(skill, e)}>
                          <Edit2 size={14} /> Sửa
                        </button>
                        <button className={styles.dropdownItem} onClick={(e) => void handleDownloadZip(skill, e)}>
                          <Download size={14} /> Tải xuống ZIP
                        </button>
                        <button className={[styles.dropdownItem, styles.danger].join(' ')} onClick={(e) => handleDelete(skill.slug, e)}>
                          <Trash2 size={14} /> Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className={styles.skillCardDesc}>{skill.description}</p>
                <div className={styles.skillCardMeta}>
                  <span>Cập nhật: {new Date(skill.updatedAt).toLocaleDateString()}</span>
                  <span>{skill.heading ? 'Có heading' : ''}</span>
                </div>
              </Link>
            ))}
            
            {skills.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)' }}>Chưa có kỹ năng nào. Hãy tạo kỹ năng đầu tiên!</p>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingSlug ? 'Sửa thông tin Skill' : 'Khởi tạo Skill mới'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <Input
                  id="skill-name"
                  label={t('skills.page.fieldName')}
                  value={draft.name}
                  autoComplete="off"
                  spellCheck={false}
                  error={nameError}
                  onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
                />
                <p className={styles.hintUnder}>{t('skills.page.fieldNameHint')}</p>
              </div>

              <div className={styles.field}>
                <Input
                  id="skill-description"
                  label={t('skills.page.fieldDescription')}
                  value={draft.description}
                  autoComplete="off"
                  spellCheck={false}
                  error={descriptionError}
                  onChange={(e) => setDraft(prev => ({ ...prev, description: e.target.value }))}
                />
                <p className={styles.hintUnder}>{t('skills.page.fieldDescriptionHint')}</p>
              </div>

              <div className={styles.field}>
                <Input
                  id="skill-heading"
                  label={t('skills.page.fieldHeading')}
                  value={draft.heading ?? ''}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => setDraft(prev => ({ ...prev, heading: e.target.value }))}
                />
                <p className={styles.hintUnder}>{t('skills.page.fieldHeadingHint')}</p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={!parsedDraft.success}>
                {editingSlug ? 'Cập nhật' : 'Tạo & Tiếp tục'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {skillToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Xác nhận xóa</h3>
            </div>
            <div className={styles.modalBody}>
              <p>Bạn có chắc chắn muốn xóa skill này không? Hành động này không thể hoàn tác.</p>
            </div>
            <div className={styles.modalFooter}>
              <Button type="button" variant="ghost" onClick={() => setSkillToDelete(null)}>
                Hủy
              </Button>
              <Button
                type="button"
                variant="primary"
                style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                onClick={confirmDeleteSkill}
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
