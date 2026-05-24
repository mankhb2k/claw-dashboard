'use client'

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from '@/components/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import styles from './ModalCustomConnector.module.css'

type Props = {
  onClose: () => void
}

const customConnectorSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  serverUrl: z.string().url('URL không hợp lệ'),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
})

type CustomConnectorInput = z.infer<typeof customConnectorSchema>

export function ModalCustomConnector({ onClose }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomConnectorInput>({
    resolver: zodResolver(customConnectorSchema),
  })

  const onSubmit = (data: CustomConnectorInput) => {
    console.log('Submitted data:', data)
    // Handle submission
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={styles.title}>
            Thêm Kết nối tùy chỉnh
            <span className={styles.beta}>BETA</span>
          </DialogTitle>
        </DialogHeader>

        <p className={styles.lead}>Kết nối với server MCP hoặc API riêng của bạn.</p>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <Input
            id="custom-connector-name"
            label="Tên dịch vụ"
            type="text"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            type="text"
            placeholder="URL của server (ví dụ: https://mcp.your-domain.com)"
            error={errors.serverUrl?.message}
            {...register('serverUrl')}
          />

          <p className={styles.advanced}>Cài đặt nâng cao (Tùy chọn)</p>
          
          <Input
            type="text"
            placeholder="Client ID (nếu có)"
            error={errors.clientId?.message}
            {...register('clientId')}
          />

          <Input
            type="password"
            placeholder="Client Secret (nếu có)"
            error={errors.clientSecret?.message}
            {...register('clientSecret')}
          />

          <p className={styles.hint}>Mọi thông tin sẽ được mã hóa và lưu trữ an toàn.</p>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              Thêm Kết nối
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
