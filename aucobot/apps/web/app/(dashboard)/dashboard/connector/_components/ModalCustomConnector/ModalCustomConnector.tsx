'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import styles from './ModalCustomConnector.module.css'
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { createCustomConnectorSchema, type CustomConnectorInput } from '@/schemas/connect.schema'

type Props = {
  onClose: () => void
}

export function ModalCustomConnector({ onClose }: Props) {
  const { t } = useI18n()
  const customConnectorSchema = useMemo(() => createCustomConnectorSchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomConnectorInput>({
    resolver: zodResolver(customConnectorSchema),
  })

  const onSubmit = (_data: CustomConnectorInput) => {
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={styles.title}>
            Add custom connection
            <span className={styles.beta}>BETA</span>
          </DialogTitle>
        </DialogHeader>

        <p className={styles.lead}>Connect to your own MCP server or private API.</p>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <Input
            id="custom-connector-name"
            label="Service name"
            type="text"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            type="text"
            placeholder="Server URL (e.g. https://mcp.your-domain.com)"
            error={errors.serverUrl?.message}
            {...register('serverUrl')}
          />

          <p className={styles.advanced}>Advanced settings (optional)</p>

          <Input
            type="text"
            placeholder="Client ID (if any)"
            error={errors.clientId?.message}
            {...register('clientId')}
          />

          <Input
            type="password"
            placeholder="Client Secret (if any)"
            error={errors.clientSecret?.message}
            {...register('clientSecret')}
          />

          <p className={styles.hint}>All credentials are encrypted and stored securely.</p>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              Add connection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
