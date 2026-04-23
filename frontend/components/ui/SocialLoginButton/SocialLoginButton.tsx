import { Globe, GitBranch, MessageCircle } from 'lucide-react'
import styles from './SocialLoginButton.module.css'

interface SocialLoginButtonProps {
  provider: 'google' | 'github' | 'discord'
  onClick: () => void
  loading?: boolean
}

const PROVIDER_CONFIG = {
  google: {
    label: 'Google',
    icon: Globe,
  },
  github: {
    label: 'GitHub',
    icon: GitBranch,
  },
  discord: {
    label: 'Discord',
    icon: MessageCircle,
  },
}

export function SocialLoginButton({
  provider,
  onClick,
  loading = false,
}: SocialLoginButtonProps) {
  const config = PROVIDER_CONFIG[provider]
  const Icon = config.icon

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={styles.btn}
      aria-label={`Sign in with ${config.label}`}
    >
      {Icon && <Icon size={18} className={styles.icon} />}
      <span className={styles.label}>Tiếp tục với {config.label}</span>
    </button>
  )
}
