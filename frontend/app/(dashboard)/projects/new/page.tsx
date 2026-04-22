'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createProjectSchema, type CreateProjectInput } from '@/schemas/project.schema'
import { useProjectStore } from '@/stores/project.store'
import { Header } from '@/components/layout/Header/Header'
import { Input } from '@/components/ui/Input/Input'
import { Button } from '@/components/ui/Button/Button'
import styles from './new-project.module.css'

export default function NewProjectPage() {
  const router = useRouter()
  const createProject = useProjectStore((s) => s.createProject)

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  })

  const nameValue = watch('name') ?? ''
  const previewSubdomain = nameValue.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')

  const onSubmit = async (data: CreateProjectInput) => {
    try {
      await createProject(data)
      router.push('/dashboard')
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Tạo project thất bại',
      })
    }
  }

  return (
    <>
      <Header title="Tạo project mới" />

      <div className={styles.page}>
        <div className={styles.card}>
          <h2 className={styles.title}>Cấu hình project</h2>
          <p className={styles.description}>
            Project sẽ chạy trên 1 container Docker riêng. Subdomain được gán tự động.
          </p>

          <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              id="name"
              label="Tên project"
              placeholder="my-bot"
              error={errors.name?.message}
              {...register('name')}
            />

            {previewSubdomain && (
              <div className={styles.preview}>
                <span className={styles.previewLabel}>Subdomain preview</span>
                <code className={styles.previewUrl}>
                  {previewSubdomain}.openclaw.ai
                </code>
              </div>
            )}

            {errors.root && (
              <p className={styles.rootError}>{errors.root.message}</p>
            )}

            <div className={styles.formActions}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Huỷ
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Tạo project
              </Button>
            </div>
          </form>
        </div>

        <div className={styles.info}>
          <h3 className={styles.infoTitle}>Thông tin</h3>
          <ul className={styles.infoList}>
            <li>Container: 256MB RAM · 0.25 vCPU</li>
            <li>Storage: 4GB SSD</li>
            <li>Auto-shutdown sau 10 phút không hoạt động</li>
            <li>Tự động cấp SSL qua Cloudflare</li>
          </ul>
        </div>
      </div>
    </>
  )
}
