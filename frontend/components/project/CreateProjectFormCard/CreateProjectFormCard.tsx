'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProjectStore } from '@/stores/project.store'
import { projectApi } from '@/lib/api/project'
import { Input } from '@/components/ui/Input/Input'
import { Button } from '@/components/ui/Button/Button'
import styles from './CreateProjectFormCard.module.css'

const createProjectModalSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Vui lòng nhập Tên Project')
    .max(200, 'Tên tối đa 200 ký tự'),
  provider: z.enum(['chatgpt', 'gemini', 'claude']),
  providerApiKey: z.string().optional(),
})

type CreateProjectModalInput = z.infer<typeof createProjectModalSchema>

function providerToEnvKey(provider: CreateProjectModalInput['provider']): string {
  if (provider === 'chatgpt') return 'OPENAI_API_KEY'
  if (provider === 'gemini') return 'GEMINI_API_KEY'
  return 'ANTHROPIC_API_KEY'
}

interface CreateProjectFormCardProps {
  onSuccess?: () => void
  onCancel?: () => void
  title?: string
  description?: string
}

export function CreateProjectFormCard({
  onSuccess,
  onCancel,
  title = 'Tạo Project',
  description = 'Project sẽ chạy trên 1 container Docker riêng. Subdomain được gán tự động.',
}: CreateProjectFormCardProps) {
  const createProject = useProjectStore((s) => s.createProject)
  const {
    register,
    watch,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectModalInput>({
    resolver: zodResolver(createProjectModalSchema),
    defaultValues: {
      displayName: '',
      provider: 'chatgpt',
      providerApiKey: '',
    },
  })
  const publicDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'clawsandbox.cloud'
  const displayNameValue = watch('displayName') ?? ''

  const onSubmit = async (data: CreateProjectModalInput) => {
    try {
      // Current backend accepts displayName only.
      const project = await createProject({ displayName: data.displayName.trim() })
      const apiKey = data.providerApiKey?.trim()
      if (apiKey) {
        await projectApi.upsertEnv(project.id, {
          env: [
            {
              key: providerToEnvKey(data.provider),
              value: apiKey,
            },
          ],
        })
      }
      onSuccess?.()
      reset({ displayName: '', provider: 'chatgpt', providerApiKey: '' })
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Tạo project thất bại',
      })
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>

      <div className={styles.formStack}>
        <Input
          id="project-name"
          label="Tên Project"
          placeholder="Ví dụ: My Claw"
          error={errors.displayName?.message}
          {...register('displayName')}
        />

        {displayNameValue.trim() && (
          <div className={styles.preview}>
            <span className={styles.previewLabel}>
              URL công khai: https://&lt;slug&gt;.{publicDomain} (slug do server tạo từ tên này)
            </span>
          </div>
        )}

        <div className={styles.selectField}>
          <label htmlFor="provider" className={styles.selectLabel}>
            API provider
          </label>
          <select id="provider" className={styles.select} {...register('provider')}>
            <option value="chatgpt">ChatGPT</option>
            <option value="gemini">GEMINI</option>
            <option value="claude">Claude</option>
          </select>
          <p className={styles.providerHint}>Provider sẽ dùng cho cấu hình agent trong bước tiếp theo.</p>
        </div>

        <Input
          id="provider-api-key"
          label="API Key Provider"
          placeholder="Ví dụ: sk-... / AIza... / claude-..."
          type="password"
          autoComplete="off"
          {...register('providerApiKey')}
        />
        <p className={styles.providerHint}>
          API key sẽ được lưu an toàn cho project này và dùng khi khởi tạo container.
        </p>

        {errors.root && <p className={styles.rootError}>{errors.root.message}</p>}
      </div>

      <div className={styles.formActions}>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Huỷ
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          Tạo project
        </Button>
      </div>
    </form>
  )
}
