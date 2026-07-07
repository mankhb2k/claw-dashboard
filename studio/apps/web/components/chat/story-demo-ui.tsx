import type { CSSProperties, ReactNode } from 'react'

export function StorySectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--color-muted-foreground)',
        fontWeight: 600,
        margin: '0 0 12px',
      }}
    >
      {children}
    </p>
  )
}

export function StoryDemoBox({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-background)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
