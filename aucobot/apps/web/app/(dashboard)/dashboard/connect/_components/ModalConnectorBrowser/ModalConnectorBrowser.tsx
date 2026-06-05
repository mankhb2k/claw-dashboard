'use client'

import { useMemo, useState } from 'react'
import { Plus, Settings } from 'lucide-react'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, IconProvider, Input, Typography } from '@/components/ui'
import { Grid } from '@/components/layout'
import type { ServiceConnectData } from '../../projectConnectData'
import styles from './ModalConnectorBrowser.module.css'

type Props = {
  services: ServiceConnectData[]
  connections: Record<string, boolean>
  onClose: () => void
  onConnect: (serviceId: string) => void
  onOpenDetails: (service: ServiceConnectData) => void
}

export function ModalConnectorBrowser({
  services,
  connections,
  onClose,
  onConnect,
  onOpenDetails,
}: Props) {
  const [query, setQuery] = useState('')

  const visibleServices = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return services
    return services.filter((svc) => {
      const label = svc.name.toLowerCase()
      const desc = svc.description.toLowerCase()
      return label.includes(keyword) || desc.includes(keyword)
    })
  }, [query, services])

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={styles.modal}>
        <DialogHeader className={styles.header}>
          <DialogTitle>Trung tâm Kết nối</DialogTitle>
        </DialogHeader>

        <div className={styles.searchWrap}>
          <Input
            type="text"
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm dịch vụ..."
            aria-label="Tìm kiếm dịch vụ"
          />
        </div>

        <Grid columns={2} gap="var(--space-3)" className={styles.list}>
          {visibleServices.map((svc) => {
            const isConnected = Boolean(connections[svc.slug] ?? connections[svc.id])
            return (
              <div key={svc.slug} className={styles.card}>
                <div className={styles.cardMain}>
                  <IconProvider
                    src={svc.iconSrc}
                    label={svc.name}
                    size="lg"
                    shape="square"
                    withBackground={true}
                  />
                  <div style={{ minWidth: 0 }}>
                    <Typography variant="p" weight="bold" as="h3" style={{ margin: 0 }}>
                      {svc.name}
                    </Typography>
                    <Typography variant="xs" color="muted" className={styles.cardDesc}>
                      {svc.description}
                    </Typography>
                  </div>
                </div>
                {isConnected ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    iconOnly
                    aria-label="Cài đặt"
                    onClick={() => onOpenDetails(svc)}
                  >
                    <Settings size={16} />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    iconOnly
                    aria-label="Kết nối"
                    onClick={() => onConnect(svc.id)}
                  >
                    <Plus size={16} />
                  </Button>
                )}
              </div>
            )
          })}
          {visibleServices.length === 0 && (
            <div className={styles.empty}>Không tìm thấy dịch vụ nào phù hợp.</div>
          )}
        </Grid>
      </DialogContent>
    </Dialog>
  )
}
