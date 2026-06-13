import { Ellipsis } from 'lucide-react'
import {
  Button,
  Typography,
  IconProvider,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui'
import { Flex } from '@/components/layout'
import type { ServiceConnectData } from '../../projectConnectData'
import styles from './CardConnection.module.css'

type Props = {
  service: ServiceConnectData
  onViewDetails: () => void
  onDisconnect: () => void
  onRemove: () => void
  onRefreshTools?: () => void
}

export function CardConnection({ service, onViewDetails, onDisconnect, onRemove, onRefreshTools }: Props) {
  const label = service.name
  const desc = service.description

  return (
    <Flex align="center" justify="between" gap={4} className={styles.listItem} role="group" aria-label={label}>

      <Flex align="center" gap={18} className={styles.itemMain}>
        <IconProvider
          src={service.iconSrc}
          label={label}
          size="lg"
          shape="square"
          withBackground
        />
        <Flex direction="column" gap={1} className={styles.itemContent}>
          <Flex align="center" gap={10} className={styles.itemTop}>
            <Typography variant="h3" weight="bold" className={styles.cardTitle}>
              {label}
            </Typography>
            <span className={styles.cardBadge}>{service.type}</span>
          </Flex>
          <Typography variant="small" color="muted" className={styles.cardDesc}>
            {desc}
          </Typography>
        </Flex>
      </Flex>

      <div className={styles.itemActions}>
        <div className={styles.actionsGroup}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`${styles.actionBtn} ${styles.configBtn}`}
            onClick={onViewDetails}
          >
            Configure
          </Button>

          <div className={styles.divider} />

          <DropdownMenu>
            <DropdownMenuTrigger variant="kebab" className={styles.menuTrigger}>
              <Ellipsis size={18} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRefreshTools}>
                Refresh tool list
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="danger" onClick={onDisconnect}>
                Disconnect
              </DropdownMenuItem>
              <DropdownMenuItem variant="danger" onClick={onRemove}>
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

    </Flex>
  )
}
